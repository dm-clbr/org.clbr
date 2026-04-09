import { useState, useEffect, useMemo } from 'react'
import { useProfiles, useUpdateProfile, useProfileBranch } from '../../hooks/useProfile'
import { useDepartments } from '../../lib/queries'
import { useUserAuthStatus, useResendInvite, hasUserLoggedIn } from '../../hooks/useResendInvite'
import { usePermissions } from '../../hooks/usePermissions'
import { useProfile } from '../../hooks/useProfile'
import type { Profile } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { JobDescriptionEditor } from '../ui/JobDescriptionEditor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { getInitials } from '../../lib/utils'
import { Edit2, Loader2, UserPlus, Info, Mail, Clock } from 'lucide-react'
import { ManagerAddEmployeeDialog } from './ManagerAddEmployeeDialog'

export function ManagerUserManagement() {
  const { data: allProfiles, isLoading } = useProfiles()
  const { data: departments } = useDepartments()
  const { data: authStatusMap } = useUserAuthStatus()
  const updateProfile = useUpdateProfile()
  const resendInvite = useResendInvite()
  const { getTeamMembers } = usePermissions()
  const { data: currentManager } = useProfile()
  const { data: branchProfiles } = useProfileBranch(currentManager?.id)

  // Managers the current user can assign: themselves + any managers in their reporting chain
  const assignableManagers = useMemo(() => [
    ...(currentManager ? [currentManager] : []),
    ...((branchProfiles ?? []).filter((p) => p.is_manager && p.id !== currentManager?.id)),
  ], [currentManager, branchProfiles])

  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [departmentAutoFilled, setDepartmentAutoFilled] = useState(false)
  const [resendingUserId, setResendingUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    job_title: '',
    manager_id: '',
    department_id: '',
    job_description: '',
  })

  // Filter to show only team members
  const teamMembers = useMemo(() => {
    if (!allProfiles || !currentManager) return []
    return getTeamMembers() || []
  }, [allProfiles, currentManager, getTeamMembers])

  const handleEdit = (profile: Profile) => {
    setEditingUser(profile)
    setDepartmentAutoFilled(false)
    setFormData({
      job_title: profile.job_title,
      manager_id: profile.manager_id || '',
      department_id: profile.department_id || '',
      job_description: profile.job_description || '',
    })
  }

  // Auto-update department when manager changes (though manager shouldn't change for managers)
  useEffect(() => {
    if (editingUser && formData.manager_id && allProfiles) {
      const selectedManager = allProfiles.find(p => p.id === formData.manager_id)
      if (selectedManager?.department_id && selectedManager.department_id !== formData.department_id) {
        setFormData(prev => ({ ...prev, department_id: selectedManager.department_id || '' }))
        setDepartmentAutoFilled(true)
      }
    }
  }, [formData.manager_id, formData.department_id, allProfiles, editingUser])

  const handleDepartmentChange = (value: string) => {
    setFormData(prev => ({ ...prev, department_id: value }))
    setDepartmentAutoFilled(false)
  }

  const handleResendInvite = async (profile: Profile) => {
    setResendingUserId(profile.id)
    const result = await resendInvite.mutateAsync(profile)
    setResendingUserId(null)

    if (result.success) {
      console.log('Invitation resent successfully to', result.email)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !currentManager) return

    await updateProfile.mutateAsync({
      id: editingUser.id,
      job_title: formData.job_title,
      manager_id: formData.manager_id || currentManager.id,
      department_id: formData.department_id || null,
      job_description: formData.job_description || null,
    })

    setEditingUser(null)
  }

  const handleCancel = () => {
    setEditingUser(null)
  }

  if (isLoading) {
    return <div className="clbr-empty">Loading team members...</div>
  }

  if (!currentManager) {
    return <div className="clbr-empty">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="clbr-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="clbr-card-title">Team Management</CardTitle>
              <CardDescription className="clbr-card-description">
                Manage your team members ({teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'})
              </CardDescription>
            </div>
            {!editingUser && (
              <Button onClick={() => setShowInviteDialog(true)} className="clbr-btn-secondary">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="clbr-empty py-8">
              <p>You don't have any team members yet.</p>
              <p className="mt-2 text-xs text-[#9DA2B3] normal-case tracking-normal font-normal">Click "Invite Team Member" to add someone to your team.</p>
            </div>
          ) : editingUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="clbr-list-item mb-4 flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F]">
                  {editingUser.profile_photo_url && (
                    <AvatarImage src={editingUser.profile_photo_url} alt={editingUser.full_name} />
                  )}
                  <AvatarFallback className="bg-transparent text-[#F2F2F2] text-[11px] font-bold uppercase tracking-[0.3px]">
                    {getInitials(editingUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-[#F2F2F2]">{editingUser.full_name}</p>
                  <p className="text-sm text-[#9DA2B3]">{editingUser.job_title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title" className="clbr-label">Job Title</Label>
                <Input
                  id="job_title"
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                  className="clbr-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager" className="clbr-label">Manager</Label>
                {assignableManagers.length > 1 ? (
                  <select
                    id="manager"
                    value={formData.manager_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager_id: e.target.value }))}
                    disabled={updateProfile.isPending}
                    className="clbr-select flex h-10 w-full px-3 py-2 text-sm"
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
                    ? 'Select the manager this person reports to. Only managers in your team are shown.'
                    : 'This team member reports directly to you.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="clbr-label">
                  Department
                  {departmentAutoFilled && (
                    <span className="ml-2 text-xs text-[#9DA2B3] normal-case tracking-normal">(auto-updated from manager)</span>
                  )}
                </Label>
                <select
                  id="department"
                  value={formData.department_id}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="clbr-select flex h-10 w-full px-3 py-2 text-sm"
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
                    <span>Department automatically updated from manager. You can change it if needed.</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="clbr-label">Job Description</Label>
                <JobDescriptionEditor
                  value={formData.job_description || ''}
                  onChange={(html) => setFormData(prev => ({ ...prev, job_description: html }))}
                  placeholder="Describe the employee's role and responsibilities..."
                  minRows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfile.isPending} className="clbr-btn-primary">
                  {updateProfile.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="clbr-btn-secondary">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((profile) => {
                const hasLoggedIn = authStatusMap ? hasUserLoggedIn(profile.id, authStatusMap) : true
                const isResending = resendingUserId === profile.id

                return (
                  <div
                    key={profile.id}
                    className="clbr-list-item flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10 bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F]">
                        {profile.profile_photo_url && (
                          <AvatarImage src={profile.profile_photo_url} alt={profile.full_name} />
                        )}
                        <AvatarFallback className="bg-transparent text-[#F2F2F2] text-[11px] font-bold uppercase tracking-[0.3px]">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold text-[#F2F2F2]">{profile.full_name}</p>
                          {!hasLoggedIn && (
                            <Badge variant="outline" className="clbr-badge-soft clbr-status-pending">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-[#9DA2B3]">{profile.job_title}</p>
                        {profile.department && (
                          <Badge
                            className="mt-1 rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px] text-[#F2F2F2]"
                            style={{ backgroundColor: profile.department.color, color: '#F2F2F2' }}
                          >
                            {profile.department.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!hasLoggedIn && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(profile)}
                          disabled={isResending}
                          title="Resend invitation email"
                          className="clbr-btn-secondary"
                        >
                          {isResending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(profile)}
                        className="clbr-btn-minimal h-9 w-9 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ManagerAddEmployeeDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
  )
}
