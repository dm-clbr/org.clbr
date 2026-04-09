import { useState } from 'react'
import { Link } from '../lib/router-shim'
import { sendPasswordResetEmail } from '../lib/notifications'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await sendPasswordResetEmail(email)

    if (!result.success) {
      setError(result.error ?? 'Something went wrong')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
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
          <CardTitle className="clbr-card-title">Reset Password</CardTitle>
          <CardDescription className="text-[14px] font-normal normal-case tracking-normal text-[#9DA2B3]">
            Enter your email address and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(64,66,77,0.24)] p-3 text-sm text-[#D3D6E0]">
                Password reset email sent! Check your inbox.
              </div>
              <Link to="/login">
                <Button className="clbr-btn-secondary w-full">Back to login</Button>
              </Link>
            </div>
          ) : (
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

              <Button type="submit" className="clbr-btn-primary w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>

              <div className="text-center text-sm text-[#9DA2B3]">
                Remember your password?{' '}
                <Link to="/login" className="clbr-link">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
