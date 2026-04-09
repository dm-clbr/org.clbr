import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { JobDescriptionEditor } from '../ui/JobDescriptionEditor'
import { CheckCircle2, User, Lock, FileText, AlertCircle } from 'lucide-react'
import type { Profile } from '../../types'

interface OnboardingWizardProps {
  profile: Profile
  onComplete: () => void
}

type Step = 'welcome' | 'password' | 'profile' | 'complete'

export function OnboardingWizard({ profile, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [preferredName, setPreferredName] = useState(profile.preferred_name || '')
  const [jobDescription, setJobDescription] = useState(profile.job_description || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [location, setLocation] = useState(profile.location || '')
  const [birthday, setBirthday] = useState(
    profile.birthday ? (typeof profile.birthday === 'string' && profile.birthday.length >= 10 ? profile.birthday.slice(0, 10) : '') : ''
  )
  const [socialLinks, setSocialLinks] = useState({
    linkedin: profile.social_links?.linkedin || '',
    instagram: profile.social_links?.instagram || '',
    facebook: profile.social_links?.facebook || '',
  })
  const labelClass = 'clbr-label'
  const inputClass = 'clbr-input'
  const helperTextClass = 'text-xs text-[#9DA2B3]'
  const infoCardClass = 'clbr-list-item rounded-[2px] p-3'
  const errorBoxClass =
    'flex items-start gap-2 rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-3 text-sm text-[#D3D6E0]'

  const handleSetPassword = async () => {
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setCurrentStep('profile')
    } catch (err) {
      console.error('Error setting password:', err)
      setError(err instanceof Error ? err.message : 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          preferred_name: preferredName || null,
          job_description: jobDescription || null,
          phone: phone || null,
          location: location || null,
          birthday: birthday || null,
          social_links: socialLinks,
          onboarding_completed: true,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Bust the cached profile so Dashboard reads onboarding_completed: true
      await queryClient.invalidateQueries({ queryKey: ['profile'] })

      setCurrentStep('complete')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onComplete()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.7)]">
                <User className="h-8 w-8 text-[#D3D6E0]" />
              </div>
              <h2 className="mb-2 text-2xl font-black uppercase tracking-[0.3px] text-[#F2F2F2]">
                Welcome, {profile.full_name}!
              </h2>
              <p className="text-sm text-[#9DA2B3]">
                Let's get you set up with your account.
              </p>
            </div>

            <div className="space-y-3">
              <div className={`${infoCardClass} flex items-start gap-3`}>
                <Lock className="mt-0.5 h-5 w-5 text-[#D3D6E0]" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">Set Your Password</p>
                  <p className="text-sm text-[#9DA2B3]">
                    Choose a secure password for future logins.
                  </p>
                </div>
              </div>

              <div className={`${infoCardClass} flex items-start gap-3`}>
                <FileText className="mt-0.5 h-5 w-5 text-[#D3D6E0]" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">Complete Your Profile</p>
                  <p className="text-sm text-[#9DA2B3]">
                    Add additional information to help your team connect.
                  </p>
                </div>
              </div>
            </div>

            <Button type="button" onClick={() => setCurrentStep('password')} className="clbr-btn-primary w-full">
              Get Started
            </Button>
          </div>
        )

      case 'password':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.7)]">
                <Lock className="h-8 w-8 text-[#D3D6E0]" />
              </div>
              <h2 className="mb-2 text-2xl font-black uppercase tracking-[0.3px] text-[#F2F2F2]">Set Your Password</h2>
              <p className="text-sm text-[#9DA2B3]">
                Choose a secure password for future logins.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className={labelClass}>New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  minLength={6}
                  className={inputClass}
                />
                <p className={helperTextClass}>Must be at least 6 characters.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={labelClass}>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className={errorBoxClass}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('welcome')}
                disabled={loading}
                className="clbr-btn-secondary"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSetPassword}
                disabled={loading || !password || !confirmPassword}
                className="clbr-btn-primary flex-1"
              >
                {loading ? 'Setting Password...' : 'Continue'}
              </Button>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.7)]">
                <FileText className="h-8 w-8 text-[#D3D6E0]" />
              </div>
              <h2 className="mb-2 text-2xl font-black uppercase tracking-[0.3px] text-[#F2F2F2]">Complete Your Profile</h2>
              <p className="text-sm text-[#9DA2B3]">
                Help your team get to know you better (optional).
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferredName" className={labelClass}>Nickname / Preferred Name (Optional)</Label>
                <Input
                  id="preferredName"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="What would you like to be called?"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label className={labelClass}>Job Description (Optional)</Label>
                <JobDescriptionEditor
                  value={jobDescription}
                  onChange={(html) => setJobDescription(html)}
                  placeholder="Describe your role and responsibilities..."
                  minRows={3}
                  className="clbr-textarea"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={labelClass}>Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className={labelClass}>Location (Optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Remote"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday" className={labelClass}>Birthday (Optional)</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-3">
                <Label className={labelClass}>Social Links (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    id="linkedin"
                    value={socialLinks.linkedin}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="LinkedIn URL"
                    className={inputClass}
                  />
                  <Input
                    id="instagram"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="Instagram URL"
                    className={inputClass}
                  />
                  <Input
                    id="facebook"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="Facebook URL"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className={errorBoxClass}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('password')}
                disabled={loading}
                className="clbr-btn-secondary"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleUpdateProfile}
                disabled={loading}
                className="clbr-btn-primary flex-1"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.7)]">
                <CheckCircle2 className="h-8 w-8 text-[#D3D6E0]" />
              </div>
              <h2 className="mb-2 text-2xl font-black uppercase tracking-[0.3px] text-[#F2F2F2]">All Set!</h2>
              <p className="text-sm text-[#9DA2B3]">
                Your profile is complete. Welcome to the team!
              </p>
            </div>

            <div className="clbr-list-item space-y-2 rounded-[2px] p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">What's Next?</h3>
              <ul className="space-y-2 text-sm text-[#9DA2B3]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#D3D6E0]" />
                  <span>View the organization chart</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#D3D6E0]" />
                  <span>Upload a profile photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#D3D6E0]" />
                  <span>Connect with your team members</span>
                </li>
              </ul>
            </div>

            <Button type="button" onClick={handleComplete} className="clbr-btn-primary w-full">
              Go to Dashboard
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="clbr-page-wrap flex min-h-screen items-center justify-center p-4">
      <Card className="clbr-card w-full max-w-2xl">
        <CardHeader className="pb-2">
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <div className="mb-4 flex gap-2">
              <div
                className={`h-2 flex-1 rounded-full ${
                  currentStep === 'password' || currentStep === 'profile'
                    ? 'bg-[#D3D6E0]'
                    : 'bg-[rgba(64,66,77,0.55)]'
                }`}
              />
              <div
                className={`h-2 flex-1 rounded-full ${
                  currentStep === 'profile' ? 'bg-[#D3D6E0]' : 'bg-[rgba(64,66,77,0.55)]'
                }`}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  )
}
