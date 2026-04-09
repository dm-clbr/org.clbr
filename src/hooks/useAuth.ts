import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let latestSyncId = 0

    const applyAuthState = (nextSession: Session | null, nextUser: User | null) => {
      if (cancelled) return
      setSession(nextSession)
      setUser(nextUser)
      setLoading(false)
    }

    const syncAuthState = async () => {
      const syncId = ++latestSyncId

      try {
        // getSession() can return stale local data. Always verify with getUser().
        const {
          data: { user: verifiedUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (cancelled || syncId !== latestSyncId) return

        if (userError || !verifiedUser) {
          applyAuthState(null, null)
          return
        }

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (cancelled || syncId !== latestSyncId) return

        const validatedSession =
          currentSession?.user?.id === verifiedUser.id ? currentSession : null

        applyAuthState(validatedSession, verifiedUser)
      } catch {
        if (cancelled || syncId !== latestSyncId) return
        applyAuthState(null, null)
      }
    }

    void syncAuthState()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncAuthState()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
  }

  const signUp = async (email: string, password: string, fullName: string, jobTitle: string) => {
    const normalizedFullName = fullName.trim()
    const normalizedJobTitle = jobTitle.trim()
    return supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: normalizedFullName || undefined,
          job_title: normalizedJobTitle || undefined,
        },
      },
    })
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const configuredOrgUrl = process.env.NEXT_PUBLIC_ORG_APP_URL?.trim()
    const browserOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const baseUrl = (configuredOrgUrl || browserOrigin).replace(/\/+$/, '')
    const options = baseUrl ? { redirectTo: `${baseUrl}/reset-password` } : undefined
    return supabase.auth.resetPasswordForEmail(email.trim(), options)
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
}
