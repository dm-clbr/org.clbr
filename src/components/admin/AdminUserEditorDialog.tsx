import type { Profile } from '../../types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { AdminUserEditor } from './AdminUserEditor'

interface AdminUserEditorDialogProps {
  profile: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminUserEditorDialog({ profile, open, onOpenChange }: AdminUserEditorDialogProps) {
  return (
    <Dialog open={open && !!profile} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[820px] rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[#131313] p-6 text-[#F2F2F2] shadow-[0_16px_36px_rgba(0,0,0,0.55)]">
        <DialogHeader>
          <DialogTitle className="clbr-card-title">Edit Employee</DialogTitle>
          <DialogDescription className="text-[14px] font-normal normal-case tracking-normal text-[#9DA2B3]">
            Update employee information, reporting assignments, and permissions.
          </DialogDescription>
        </DialogHeader>
        {profile && (
          <AdminUserEditor
            profile={profile}
            onSaved={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
