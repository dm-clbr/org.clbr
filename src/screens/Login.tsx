import { useState } from 'react'
import { Link, useNavigate } from '../lib/router-shim'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

function resolveSafeReturnPath(search: string) {
  const params = new URLSearchParams(search)
  const returnTo = params.get('returnTo')?.trim()
  if (!returnTo) {
    return '/dashboard'
  }
  // Allow only same-origin absolute paths.
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/dashboard'
  }
  return returnTo
}

export default function Login() {
  usePageTitle('Sign In')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      const browserSearch = typeof window !== 'undefined' ? window.location.search : ''
      navigate(resolveSafeReturnPath(browserSearch), { replace: true })
    }
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
          <CardTitle className="clbr-card-title">Sign In</CardTitle>
          <CardDescription className="text-[14px] font-normal normal-case tracking-normal text-[#9DA2B3]">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-3 text-sm text-[#D3D6E0]">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="clbr-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="clbr-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="clbr-label">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="clbr-input"
              />
            </div>

            <Button type="submit" className="clbr-btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="text-center space-y-2">
              <Link
                to="/forgot-password"
                className="clbr-link text-sm"
              >
                Forgot your password?
              </Link>
              <div className="text-sm text-[#9DA2B3]">
                Don't have an account?{' '}
                <Link to="/signup" className="clbr-link">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
