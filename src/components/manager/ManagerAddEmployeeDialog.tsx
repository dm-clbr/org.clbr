import { useState, useEffect } from 'react'
import { useInviteEmployee } from '../../hooks/useInviteEmployee'
import { useProfile, useProfileBranch } from '../../hooks/useProfile'
import { useDepartments } from '../../lib/queries'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react'

interface ManagerAddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManagerAddEmployeeDialog({ open, onOpenChange }: ManagerAddEmployeeDialogProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [managerId, setManagerId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departmentAutoFilled, setDepartmentAutoFilled] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const inviteEmployee = useInviteEmployee()
  const { data: currentManager } = useProfile()
  const { data: branchProfiles } = useProfileBranch(currentManager?.id)
  const { data: departments } = useDepartments()
  const labelClass = 'clbr-label'
  const inputClass = 'clbr-input'
  const selectClass = 'clbr-select flex h-10 w-full px-3 py-2 text-sm'

  // Managers the current user can assign: themselves + any managers in their reporting chain
  const assignableManagers = [
    ...(currentManager ? [currentManager] : []),
    ...((branchProfiles ?? []).filter((p) => p.is_manager && p.id !== currentManager?.id)),
  ]

  // Auto-fill department and manager when dialog opens
  useEffect(() => {
    if (open && currentManager) {
      setManagerId(currentManager.id)
      if (currentManager.department_id) {
        setDepartmentId(currentManager.department_id)
        setDepartmentAutoFilled(true)
      }
    }
  }, [open, currentManager])

  // Handle manual department change
  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value)
    setDepartmentAutoFilled(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // First name validation
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    // Last name validation
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    // Job title validation
    if (!jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required'
    } else if (jobTitle.trim().length < 2) {
      newErrors.jobTitle = 'Job title must be at least 2 characters'
    }

    // Start date validation
    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentManager) {
      setErrors({ submit: 'Manager information not available' })
      return
    }

    setSuccessMessage('')
    setErrors({})

    if (!validateForm()) {
      return
    }

    const result = await inviteEmployee.mutateAsync({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jobTitle: jobTitle.trim(),
      managerId: managerId || currentManager.id,
      departmentId: departmentId || undefined,
      startDate,
      managerMode: true,
    })

    if (result.success) {
      setSuccessMessage(`Invitation sent successfully to ${result.email}!`)
      
      // Reset form after 2 seconds and close dialog
      setTimeout(() => {
        setEmail('')
        setFirstName('')
        setLastName('')
        setJobTitle('')
        setManagerId(currentManager?.id || '')
        setDepartmentId('')
        setDepartmentAutoFilled(false)
        setStartDate(new Date().toISOString().split('T')[0])
        setSuccessMessage('')
        setErrors({})
        onOpenChange(false)
      }, 2000)
    } else {
      setErrors({ submit: result.error || 'Failed to send invitation' })
    }
  }

  const handleCancel = () => {
    setEmail('')
    setFirstName('')
    setLastName('')
    setJobTitle('')
    setManagerId(currentManager?.id || '')
    setDepartmentId('')
    setDepartmentAutoFilled(false)
    setStartDate(new Date().toISOString().split('T')[0])
    setSuccessMessage('')
    setErrors({})
    onOpenChange(false)
  }

  if (!currentManager) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[600px] rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[#131313] p-6 text-[#F2F2F2] shadow-[0_16px_36px_rgba(0,0,0,0.55)] opacity-100">
        <DialogHeader>
          <DialogTitle className="clbr-card-title">Invite Team Member</DialogTitle>
          <DialogDescription className="text-[14px] font-normal normal-case tracking-normal text-[#9DA2B3]">
            Send an invitation email with a magic link to create their account and set up their password. They will be added to your team.
          </DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-[#D3D6E0]" />
            <p className="text-center text-lg font-medium text-[#F2F2F2]">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="email" className={labelClass}>
                Email Address <span className="text-[#D3D6E0]">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviteEmployee.isPending}
                className={inputClass}
              />
              {errors.email && (
                <p className="text-sm text-[#D3D6E0]">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className={labelClass}>
                  First Name <span className="text-[#D3D6E0]">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={inviteEmployee.isPending}
                  className={inputClass}
                />
                {errors.firstName && (
                  <p className="text-sm text-[#D3D6E0]">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className={labelClass}>
                  Last Name <span className="text-[#D3D6E0]">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={inviteEmployee.isPending}
                  className={inputClass}
                />
                {errors.lastName && (
                  <p className="text-sm text-[#D3D6E0]">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle" className={labelClass}>
                Job Title <span className="text-[#D3D6E0]">*</span>
              </Label>
              <Input
                id="jobTitle"
                type="text"
                placeholder="Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={inviteEmployee.isPending}
                className={inputClass}
              />
              {errors.jobTitle && (
                <p className="text-sm text-[#D3D6E0]">{errors.jobTitle}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager" className={labelClass}>Manager</Label>
              {assignableManagers.length > 1 ? (
                <select
                  id="manager"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  disabled={inviteEmployee.isPending}
                  className={selectClass}
                >
                  {assignableManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}{m.id === currentManager?.id ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="manager"
                  type="text"
                  value={currentManager.full_name}
                  disabled
                  className="clbr-input cursor-not-allowed"
                />
              )}
              <p className="text-xs text-[#9DA2B3]">
                {assignableManagers.length > 1
                  ? 'Select the manager this person will report to. Only managers in your team are shown.'
                  : 'This team member will report directly to you.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className={labelClass}>
                Department
                {departmentAutoFilled && (
                  <span className="ml-2 text-xs font-normal normal-case tracking-normal text-[#9DA2B3]">(auto-filled from your department)</span>
                )}
              </Label>
              <select
                id="department"
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={inviteEmployee.isPending}
                className={selectClass}
              >
                <option value="">No Department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {departmentAutoFilled && (
                <div className="flex items-start gap-2 text-xs text-[#9DA2B3]">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Department automatically set from your department. You can change it if needed.</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className={labelClass}>Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={inviteEmployee.isPending}
                className={inputClass}
              />
              {errors.startDate && (
                <p className="text-sm text-[#D3D6E0]">{errors.startDate}</p>
              )}
            </div>

            {errors.submit && (
              <div className="flex items-start gap-2 rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D3D6E0]" />
                <p className="text-sm text-[#D3D6E0]">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={inviteEmployee.isPending}
                className="clbr-btn-primary flex-1"
              >
                {inviteEmployee.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invitation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={inviteEmployee.isPending}
                className="clbr-btn-secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
