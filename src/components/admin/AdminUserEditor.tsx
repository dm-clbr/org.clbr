import { useState, useEffect } from 'react'
import { useProfiles, useUpdateProfile } from '../../hooks/useProfile'
import { useDepartments } from '../../lib/queries'
import type { Profile } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { JobDescriptionEditor } from '../ui/JobDescriptionEditor'
import { Loader2, Shield, Users, BarChart2, GitFork } from 'lucide-react'
import { PhotoUpload } from '../profile/PhotoUpload'
import { CascadingDepartmentSelect } from './CascadingDepartmentSelect'

interface AdminUserEditorProps {
  profile: Profile
  onSaved?: () => void
  onCancel?: () => void
}

export function AdminUserEditor({ profile, onSaved, onCancel }: AdminUserEditorProps) {
  const { data: profiles } = useProfiles()
  const { data: departments } = useDepartments()
  const updateProfile = useUpdateProfile()
  const labelClass = 'clbr-label'
  const inputClass = 'clbr-input'
  const selectClass = 'clbr-select flex h-10 w-full px-3 py-2 text-sm'

  const [departmentAutoFilled, setDepartmentAutoFilled] = useState(false)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(profile.profile_photo_url)
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    job_title: profile.job_title,
    manager_id: profile.manager_id || '',
    department_id: profile.department_id || '',
    job_description: profile.job_description || '',
    is_admin: profile.is_admin,
    is_manager: profile.is_manager || false,
    is_executive: profile.is_executive || false,
    is_process_editor: profile.is_process_editor || false,
  })

  // Reset form when profile changes
  useEffect(() => {
    setFormData({
      full_name: profile.full_name,
      job_title: profile.job_title,
      manager_id: profile.manager_id || '',
      department_id: profile.department_id || '',
      job_description: profile.job_description || '',
      is_admin: profile.is_admin,
      is_manager: profile.is_manager || false,
      is_executive: profile.is_executive || false,
      is_process_editor: profile.is_process_editor || false,
    })
    setCurrentPhotoUrl(profile.profile_photo_url)
    setDepartmentAutoFilled(false)
  }, [profile])

  // Auto-update department when manager changes
  useEffect(() => {
    if (formData.manager_id && profiles) {
      const selectedManager = profiles.find(p => p.id === formData.manager_id)
      if (selectedManager?.department_id && selectedManager.department_id !== formData.department_id) {
        setFormData(prev => ({ ...prev, department_id: selectedManager.department_id || '' }))
        setDepartmentAutoFilled(true)
      }
    }
  }, [formData.manager_id, formData.department_id, profiles])

  const handleManagerChange = (value: string) => {
    setFormData(prev => ({ ...prev, manager_id: value }))
    setDepartmentAutoFilled(false)
  }

  const handleDepartmentChange = (value: string) => {
    setFormData(prev => ({ ...prev, department_id: value }))
    setDepartmentAutoFilled(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await updateProfile.mutateAsync({
      id: profile.id,
      full_name: formData.full_name,
      job_title: formData.job_title,
      manager_id: formData.manager_id || null,
      department_id: formData.department_id || null,
      job_description: formData.job_description || null,
      is_admin: formData.is_admin,
      is_manager: formData.is_manager,
      is_executive: formData.is_executive,
      is_process_editor: formData.is_process_editor,
    } as any)

    onSaved?.()
  }

  const potentialManagers = profiles?.filter(p => p.is_manager && p.id !== profile.id) || []

  const handlePhotoUploaded = async (url: string) => {
    setCurrentPhotoUrl(url)
    await updateProfile.mutateAsync({
      id: profile.id,
      profile_photo_url: url,
    } as any)
  }

  return (
    <form onSubmit={handleSubmit} className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
      <div className="clbr-list-item flex items-center gap-4 p-3">
        <PhotoUpload
          currentPhotoUrl={currentPhotoUrl}
          userName={profile.full_name}
          userId={profile.id}
          onPhotoUploaded={handlePhotoUploaded}
          size="sm"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Full name"
            required
            className={`${inputClass} h-9 text-sm font-bold`}
          />
          <p className="px-1 text-xs text-[#9DA2B3]">{profile.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job_title" className={labelClass}>Job Title</Label>
        <Input
          id="job_title"
          type="text"
          value={formData.job_title}
          onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
          placeholder="e.g. Software Engineer"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager" className={labelClass}>Manager</Label>
        <select
          id="manager"
          value={formData.manager_id}
          onChange={(e) => handleManagerChange(e.target.value)}
          className={selectClass}
        >
          <option value="">No Manager</option>
          {potentialManagers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} — {p.job_title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <CascadingDepartmentSelect
          departments={departments || []}
          value={formData.department_id}
          onChange={handleDepartmentChange}
          autoFilledNote={departmentAutoFilled ? '(auto-updated from manager)' : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label className={labelClass}>Job Description</Label>
        <JobDescriptionEditor
          value={formData.job_description}
          onChange={(html) => setFormData(prev => ({ ...prev, job_description: html }))}
          placeholder="Describe the employee's role and responsibilities..."
          minRows={4}
          className="clbr-textarea"
        />
      </div>

      <div className="space-y-2">
        <p className={labelClass}>Permissions</p>

        <label htmlFor="is_admin" className="clbr-list-item flex cursor-pointer items-center gap-3 p-3">
          <input
            type="checkbox"
            id="is_admin"
            checked={formData.is_admin}
            onChange={(e) => setFormData(prev => ({ ...prev, is_admin: e.target.checked }))}
            className="h-4 w-4 rounded border-[rgba(64,66,77,0.55)] bg-[#1E1E24] accent-[#D3D6E0]"
          />
          <Shield className="h-4 w-4 text-[#D3D6E0]" />
          <span className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">Administrator</span>
        </label>

        <label htmlFor="is_manager" className="clbr-list-item flex cursor-pointer items-center gap-3 p-3">
          <input
            type="checkbox"
            id="is_manager"
            checked={formData.is_manager}
            onChange={(e) => setFormData(prev => ({ ...prev, is_manager: e.target.checked }))}
            className="h-4 w-4 rounded border-[rgba(64,66,77,0.55)] bg-[#1E1E24] accent-[#D3D6E0]"
          />
          <Users className="h-4 w-4 text-[#D3D6E0]" />
          <span className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">Manager</span>
        </label>

        <label htmlFor="is_executive" className="clbr-list-item flex cursor-pointer items-center gap-3 p-3">
          <input
            type="checkbox"
            id="is_executive"
            checked={formData.is_executive}
            onChange={(e) => setFormData(prev => ({ ...prev, is_executive: e.target.checked }))}
            className="h-4 w-4 rounded border-[rgba(64,66,77,0.55)] bg-[#1E1E24] accent-[#D3D6E0]"
          />
          <BarChart2 className="h-4 w-4 text-[#D3D6E0]" />
          <span className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">
            Executive (KPI Dashboard access)
          </span>
        </label>

        <label htmlFor="is_process_editor" className="clbr-list-item flex cursor-pointer items-center gap-3 p-3">
          <input
            type="checkbox"
            id="is_process_editor"
            checked={formData.is_process_editor}
            onChange={(e) => setFormData(prev => ({ ...prev, is_process_editor: e.target.checked }))}
            className="h-4 w-4 rounded border-[rgba(64,66,77,0.55)] bg-[#1E1E24] accent-[#D3D6E0]"
          />
          <GitFork className="h-4 w-4 text-[#D3D6E0]" />
          <span className="text-sm font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">
            Process Editor (create &amp; edit any process)
          </span>
        </label>
      </div>

      {updateProfile.isError && (
        <div className="rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(110,113,128,0.15)] p-3 text-sm text-[#D3D6E0]">
          Failed to update profile. Please try again.
        </div>
      )}

      {updateProfile.isSuccess && (
        <div className="rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(64,66,77,0.24)] p-3 text-sm text-[#D3D6E0]">
          Profile updated successfully!
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={updateProfile.isPending} className="clbr-btn-primary flex-1">
          {updateProfile.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="clbr-btn-secondary">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
