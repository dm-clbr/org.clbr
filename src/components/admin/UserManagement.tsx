import { useState } from 'react'
import { useProfiles } from '../../hooks/useProfile'
import { useUserAuthStatus, useResendInvite, hasUserLoggedIn } from '../../hooks/useResendInvite'
import type { Profile } from '../../types'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { getInitials } from '../../lib/utils'
import { Edit2, UserPlus, Mail, Clock, Trash2, Shield, Users, Loader2 } from 'lucide-react'
import { AddEmployeeDialog } from './AddEmployeeDialog'
import { RemoveEmployeeDialog } from './RemoveEmployeeDialog'
import { AdminUserEditorDialog } from './AdminUserEditorDialog'

export function UserManagement() {
  const { data: profiles, isLoading } = useProfiles({ status: 'all' })
  const { data: authStatusMap } = useUserAuthStatus()
  const resendInvite = useResendInvite()

  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [employeeToRemove, setEmployeeToRemove] = useState<Profile | null>(null)
  const [resendingUserId, setResendingUserId] = useState<string | null>(null)
  const [statusView, setStatusView] = useState<'active' | 'terminated'>('active')

  const allProfiles = profiles || []
  const activeProfiles = allProfiles.filter((profile) => (profile.employment_status ?? 'active') === 'active')
  const terminatedProfiles = allProfiles.filter((profile) => profile.employment_status === 'terminated')
  const visibleProfiles = statusView === 'active' ? activeProfiles : terminatedProfiles

  const handleResendInvite = async (profile: Profile) => {
    setResendingUserId(profile.id)
    const result = await resendInvite.mutateAsync(profile)
    setResendingUserId(null)

    if (result.success) {
      console.log('Invitation resent successfully to', result.email)
    }
  }

  if (isLoading) {
    return <div className="clbr-empty">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="clbr-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="clbr-card-title">User Management</CardTitle>
              <CardDescription className="clbr-card-description">
                Manage active employees and archived terminations
              </CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)} className="clbr-btn-secondary">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStatusView('active')}
              className={statusView === 'active' ? 'clbr-btn-secondary' : 'clbr-btn-minimal'}
            >
              Active ({activeProfiles.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStatusView('terminated')}
              className={statusView === 'terminated' ? 'clbr-btn-secondary' : 'clbr-btn-minimal'}
            >
              Archived ({terminatedProfiles.length})
            </Button>
          </div>

          <div className="space-y-2">
            {visibleProfiles.length === 0 && (
              <div className="clbr-empty">
                {statusView === 'active'
                  ? 'No active employees found.'
                  : 'No archived employees found.'}
              </div>
            )}

            {visibleProfiles.map((profile) => {
                const hasLoggedIn = authStatusMap
                  ? hasUserLoggedIn(profile.id, authStatusMap)
                  : Boolean(profile.has_logged_in || profile.last_sign_in_at || profile.onboarding_completed)
                const isResending = resendingUserId === profile.id
                const isTerminated = (profile.employment_status ?? 'active') === 'terminated'
                const hasCompletedOnboarding = Boolean(profile.onboarding_completed)
                const showPendingInvite = !isTerminated && !hasLoggedIn && !hasCompletedOnboarding

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
                          {profile.is_admin && (
                            <Badge variant="secondary" className="clbr-badge-soft bg-[rgba(64,66,77,0.24)]">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {profile.is_manager && (
                            <Badge variant="secondary" className="clbr-badge-soft bg-[rgba(64,66,77,0.24)]">
                              <Users className="h-3 w-3 mr-1" />
                              Manager
                            </Badge>
                          )}
                          {showPendingInvite && (
                            <Badge variant="outline" className="clbr-badge-soft clbr-status-pending">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {isTerminated && (
                            <Badge variant="outline" className="clbr-badge-soft clbr-status-archived">
                              Archived
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
                      {showPendingInvite && (
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
                      {!isTerminated && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser(profile)}
                            title="Edit employee"
                            className="clbr-btn-minimal h-9 w-9 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEmployeeToRemove(profile)}
                            title="Terminate employee"
                            className="clbr-btn-minimal h-9 w-9 p-0 text-[#D3D6E0] hover:bg-[rgba(110,113,128,0.22)] hover:text-[#F2F2F2]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
        </CardContent>
      </Card>

      <AdminUserEditorDialog
        profile={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <AddEmployeeDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />

      <RemoveEmployeeDialog
        open={!!employeeToRemove}
        onOpenChange={(open) => !open && setEmployeeToRemove(null)}
        employee={employeeToRemove}
        allProfiles={profiles || []}
      />
    </div>
  )
}
