import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { sendEmployeeInvitationEmail } from '../lib/notifications'
import { invokeAdminUserOps } from '../lib/adminUserOps'
import type { Profile } from '../types'
import { useAuth } from './useAuth'

interface ResendInviteResult {
  success: boolean
  email?: string
  error?: string
}

interface ProfileAuthStatusRow {
  id: string
  has_logged_in: boolean | null
  last_sign_in_at: string | null
}

interface ProfileOnboardingRow {
  id: string
  onboarding_completed: boolean | null
}

interface ListUsersResponse {
  success?: boolean
  users?: Array<{
    id: string
    last_sign_in_at: string | null
  }>
}

export type UserAuthStatusMap = Record<string, boolean>

/**
 * Hook for resending invitations to employees who haven't logged in yet
 */
export function useResendInvite() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  return useMutation({
    mutationFn: async (profile: Profile): Promise<ResendInviteResult> => {
      console.log('useResendInvite: Resending invitation for', profile.email)

      if (!currentUser) {
        return { success: false, error: 'You must be logged in to resend invitations' }
      }

      try {
        // Edge function handles server-side link generation and email dispatch
        // using Supabase-configured app URL.

        // Send invitation email
        console.log('useResendInvite: Sending invitation email')
        const emailResult = await sendEmployeeInvitationEmail(profile.id)

        if (!emailResult.success) {
          console.error('useResendInvite: Error sending email:', emailResult.error)
          return { success: false, error: 'Failed to send invitation email' }
        }

        console.log('useResendInvite: Invitation resent successfully')
        return { success: true, email: profile.email }
      } catch (error) {
        console.error('useResendInvite: Unexpected error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        }
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        console.log('useResendInvite: Success, invalidating user auth status')
        queryClient.invalidateQueries({ queryKey: ['user-auth-status'] })
      }
    },
  })
}

/**
 * Hook to get auth status from admin listUsers (with profile fallbacks).
 * Returns a map of userId -> hasLoggedIn boolean.
 */
export function useUserAuthStatus() {
  const { user: currentUser } = useAuth()

  return useQuery({
    queryKey: ['user-auth-status'],
    queryFn: async () => {
      if (!currentUser) {
        console.warn('useUserAuthStatus: Not authenticated')
        return {}
      }

      try {
        const { data, error } = await invokeAdminUserOps<ListUsersResponse>({
          action: 'listUsers',
          userId: currentUser.id,
        })

        if (!error && data?.success && Array.isArray(data.users)) {
          const authStatusMap: UserAuthStatusMap = {}
          for (const row of data.users) {
            authStatusMap[row.id] = Boolean(row.last_sign_in_at)
          }

          console.log(
            'useUserAuthStatus: Fetched auth status from admin listUsers for',
            data.users.length,
            'users'
          )
          return authStatusMap
        }

        if (error) {
          console.warn(
            'useUserAuthStatus: admin listUsers failed, falling back to profiles mirror columns:',
            error.message
          )
        } else {
          console.warn('useUserAuthStatus: admin listUsers returned unexpected payload, using fallback')
        }
      } catch (error) {
        console.warn('useUserAuthStatus: Unexpected listUsers error, using fallback:', error)
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, has_logged_in, last_sign_in_at')

        if (error) {
          const errorMessage = (error.message || '').toLowerCase()
          const mirrorColumnsMissing =
            error.code === '42703' ||
            errorMessage.includes('has_logged_in') ||
            errorMessage.includes('last_sign_in_at')

          if (mirrorColumnsMissing) {
            console.warn('useUserAuthStatus: login-status mirror columns not available yet')

            const { data: onboardingData, error: onboardingError } = await supabase
              .from('profiles')
              .select('id, onboarding_completed')

            if (onboardingError) {
              console.error('useUserAuthStatus: Error fetching onboarding fallback status:', onboardingError)
              return {}
            }

            if (!onboardingData) {
              return {}
            }

            const authStatusMap: UserAuthStatusMap = {}
            const rows = onboardingData as ProfileOnboardingRow[]
            for (const row of rows) {
              authStatusMap[row.id] = Boolean(row.onboarding_completed)
            }

            console.log(
              'useUserAuthStatus: Fetched auth status from onboarding fallback for',
              rows.length,
              'users'
            )
            return authStatusMap
          }

          console.error('useUserAuthStatus: Error fetching profile auth status:', error)
          return {}
        }

        if (!data) {
          return {}
        }

        const authStatusMap: UserAuthStatusMap = {}
        const rows = data as ProfileAuthStatusRow[]
        for (const row of rows) {
          authStatusMap[row.id] = Boolean(row.has_logged_in || row.last_sign_in_at)
        }

        console.log('useUserAuthStatus: Fetched auth status for', rows.length, 'users')
        return authStatusMap
      } catch (error) {
        console.error('useUserAuthStatus: Unexpected error:', error)
        return {}
      }
    },
    staleTime: 60000,
  })
}

/**
 * Helper to check if a user has ever logged in.
 * Returns false when the user is explicitly in the map as not logged in.
 * Returns false (pending) when the userId is absent from the map to avoid
 * hiding the pending badge and resend action when auth status is incomplete.
 */
export function hasUserLoggedIn(userId: string, authStatusMap: UserAuthStatusMap): boolean {
  if (!(userId in authStatusMap)) return false
  return authStatusMap[userId]
}
