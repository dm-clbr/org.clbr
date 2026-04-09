import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { OrgChartProfile } from '../../types'
import { Badge } from '../ui/badge'
import { getInitials } from '../../lib/utils'
import { Mail } from 'lucide-react'

interface EmployeeNodeData {
  profile: OrgChartProfile
}

export const EmployeeNode = memo(({ data }: NodeProps<EmployeeNodeData>) => {
  const { profile } = data

  return (
    <div className="w-[220px] overflow-hidden rounded-[2px] border border-[rgba(64,66,77,0.65)] bg-[rgba(30,30,36,0.95)] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-colors hover:border-[rgba(64,66,77,0.9)]">
      <Handle type="target" position={Position.Top} className="!bg-[#D3D6E0]" />

      {/* Full-width photo */}
      <div className="w-full h-[150px] flex-shrink-0 border-b border-[rgba(64,66,77,0.4)] bg-[#1E1E24]">
        {profile.profile_photo_url ? (
          <img
            src={profile.profile_photo_url}
            alt={profile.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F] text-4xl font-bold uppercase tracking-[0.3px] text-[#D3D6E0]">
            {getInitials(profile.full_name)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="truncate text-[16px] font-bold text-[#F2F2F2]">{profile.full_name}</h3>
        <p className="mb-2 truncate text-[13px] text-[#9DA2B3]">{profile.job_title}</p>

        {profile.department && (
          <Badge
            className="mb-2 rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px] text-[#F2F2F2]"
            style={{
              backgroundColor: profile.department.color,
              color: '#F2F2F2',
            }}
          >
            {profile.department.name}
          </Badge>
        )}

        {profile.email && (
          <div className="flex items-center gap-2 text-[12px] text-[#9DA2B3]">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{profile.email}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#D3D6E0]" />
    </div>
  )
})

EmployeeNode.displayName = 'EmployeeNode'
