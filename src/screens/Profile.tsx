import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { ProfileEditor } from '../components/profile/ProfileEditor'
import { usePageTitle } from '../hooks/usePageTitle'
import { Button } from '../components/ui/button'

export default function Profile() {
  usePageTitle('My Profile')
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { data: profile, isLoading, error } = useProfile()

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="clbr-page-wrap">
        <div className="clbr-page-content">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-[#D3D6E0]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="clbr-page-wrap">
        <div className="clbr-page-content">
        <div className="rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-4 text-[#D3D6E0]">
          Failed to load profile. Please try again.
        </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="clbr-page-wrap">
        <div className="clbr-page-content">
        <div className="clbr-empty">
          Profile not found.
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="clbr-page-wrap">
      <div className="clbr-page-content max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="clbr-page-title mb-0">My Profile</h1>
        <Button
          type="button"
          className="clbr-btn-secondary"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Logout'}
        </Button>
      </div>
      <ProfileEditor profile={profile} />
      </div>
    </div>
  )
}
