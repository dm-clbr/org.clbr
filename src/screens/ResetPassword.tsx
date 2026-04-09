import { useState, useEffect } from 'react'
import { Link, useNavigate } from '../lib/router-shim'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { LoadingSquare } from '../components/ui/loading-square'
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const [ready, setReady] = useState(false)
  const { user, loading: authLoading, updatePassword } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const navigate = useNavigate()

  // After recovery link, session is established from URL hash
  useEffect(() => {
    if (authLoading) return
    setReady(true)
  }, [authLoading])

  // If the authenticated user hasn't finished onboarding, send them there
  useEffect(() => {
    if (!ready || !user || profileLoading) return
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true })
    }
  }, [ready, user, profile, profileLoading, navigate])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await updatePassword(password)
      if (updateError) throw updateError
      setComplete(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
        <LoadingSquare />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
        <Card className="clbr-card w-full max-w-md">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-start gap-2 rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-3 text-[#D3D6E0]">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">This link is invalid or has expired. Request a new reset link.</p>
            </div>
            <Link to="/forgot-password">
              <Button className="clbr-btn-secondary w-full">Request new reset link</Button>
            </Link>
            <div className="text-center mt-4">
              <Link to="/login" className="clbr-link text-sm">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (complete) {
    return (
      <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
        <Card className="clbr-card w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.7)]">
                <CheckCircle2 className="h-8 w-8 text-[#D3D6E0]" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-[0.3px] text-[#F2F2F2]">Password Updated</h2>
              <p className="text-sm text-[#9DA2B3]">Redirecting you to the dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
      <Card className="clbr-card w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center pb-3">
            <img
              src="/images/clbr-lockup-white.svg"
              alt="CLBR"
              className="h-auto w-full max-w-[180px]"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-2 flex-1 rounded-full bg-[#D3D6E0]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.7)]">
                <Lock className="h-8 w-8 text-[#D3D6E0]" />
              </div>
              <h2 className="mb-2 text-2xl font-black uppercase tracking-[0.3px] text-[#F2F2F2]">Set New Password</h2>
              <p className="text-sm text-[#9DA2B3]">
                Choose a secure password for future logins
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="clbr-label">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  minLength={6}
                  className="clbr-input"
                />
                <p className="text-xs text-[#9DA2B3]">At least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="clbr-label">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="clbr-input"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-3 text-[#D3D6E0]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="clbr-btn-primary w-full"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>

            <div className="text-center">
              <Link to="/login" className="clbr-link text-sm">
                Back to login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
