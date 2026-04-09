import { useNavigate } from '../lib/router-shim'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard'
import { LoadingSquare } from '../components/ui/loading-square'

/**
 * Landing page for new employees arriving via invite magic link.
 * Renders the OnboardingWizard directly. Once complete, the wizard
 * navigates the user to /dashboard.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return (
      <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
        <LoadingSquare />
      </div>
    )
  }

  // Not authenticated — send to login
  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  // Already completed onboarding — send to dashboard
  if (profile?.onboarding_completed) {
    navigate('/dashboard', { replace: true })
    return null
  }

  // Profile not yet available (edge case: trigger hasn't run yet)
  if (!profile) {
    return (
      <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <LoadingSquare className="mx-auto" />
          <p className="mt-4 text-sm text-[#9DA2B3]">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <OnboardingWizard
      profile={profile}
      onComplete={() => {
        // Hard redirect clears any remaining stale React Query cache
        window.location.replace('/dashboard')
      }}
    />
  )
}
