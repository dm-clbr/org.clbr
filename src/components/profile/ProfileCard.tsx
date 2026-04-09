import DOMPurify from 'dompurify'
import type { Profile } from '../../types'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { getInitials, formatDateOnly } from '../../lib/utils'
import { Mail, Phone, MapPin, Calendar, Cake, Linkedin, Instagram, Facebook, Pencil } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { useProfile } from '../../hooks/useProfile'

interface ProfileCardProps {
  profile: Profile
  showContactInfo?: boolean
  onEdit?: () => void
}

export function ProfileCard({ profile, showContactInfo = true, onEdit }: ProfileCardProps) {
  const { isAdmin, isManager, getTeamMembers } = usePermissions()
  const { data: currentProfile } = useProfile()
  const teamMembers = getTeamMembers()
  // Admins can see all phone numbers, users can see their own, or managers can see their team members' phone numbers
  const canViewPhone = 
    isAdmin ||
    currentProfile?.id === profile.id || 
    (isManager && teamMembers.some(member => member.id === profile.id))
  return (
    <Card className="border-0 bg-transparent text-[#F2F2F2] shadow-none">
      <CardHeader className="border-b border-[rgba(64,66,77,0.45)] px-5 py-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-[rgba(64,66,77,0.55)] bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F]">
            {profile.profile_photo_url && (
              <AvatarImage src={profile.profile_photo_url} alt={profile.full_name} />
            )}
            <AvatarFallback className="bg-transparent text-[14px] font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-[24px] leading-[1.05] font-black tracking-[-0.02em] text-[#F2F2F2]">{profile.full_name}</h2>
            <p className="text-[12px] font-semibold uppercase tracking-[0.3px] text-[#9DA2B3]">{profile.job_title}</p>
            {profile.department && (
              <Badge 
                className="mt-2 rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px] text-[#F2F2F2]"
                style={{ backgroundColor: profile.department.color, color: 'white' }}
              >
                {profile.department.name}
              </Badge>
            )}
          </div>

          {isAdmin && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="clbr-btn-minimal h-9 shrink-0 px-3"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        {profile.job_description && (
          <div>
            <h3 className="clbr-label mb-2">About</h3>
            <div
              className="job-description-content text-sm text-[#D3D6E0]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(profile.job_description) }}
            />
          </div>
        )}

        {showContactInfo && (
          <div className="space-y-2">
            <div className="clbr-list-item flex items-center gap-2 p-2 text-sm text-[#D3D6E0]">
              <Mail className="h-4 w-4 text-[#9DA2B3]" />
              <a href={`mailto:${profile.email}`} className="text-[#D3D6E0] hover:text-[#F2F2F2] hover:underline">
                {profile.email}
              </a>
            </div>

            {profile.phone && canViewPhone && (
              <div className="clbr-list-item flex items-center gap-2 p-2 text-sm text-[#D3D6E0]">
                <Phone className="h-4 w-4 text-[#9DA2B3]" />
                <a href={`tel:${profile.phone}`} className="text-[#D3D6E0] hover:text-[#F2F2F2] hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}

            {profile.location && (
              <div className="clbr-list-item flex items-center gap-2 p-2 text-sm text-[#D3D6E0]">
                <MapPin className="h-4 w-4 text-[#9DA2B3]" />
                <span>{profile.location}</span>
              </div>
            )}

            <div className="clbr-list-item flex items-center gap-2 p-2 text-sm text-[#D3D6E0]">
              <Calendar className="h-4 w-4 text-[#9DA2B3]" />
              <span>Started {formatDateOnly(profile.start_date)}</span>
            </div>

            {profile.birthday && (
              <div className="clbr-list-item flex items-center gap-2 p-2 text-sm text-[#D3D6E0]">
                <Cake className="h-4 w-4 text-[#9DA2B3]" />
                <span>Birthday {formatDateOnly(profile.birthday)}</span>
              </div>
            )}
          </div>
        )}

        {profile.social_links && (
          <div className="flex gap-3 pt-1">
            {profile.social_links.linkedin && (
              <a
                href={profile.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9DA2B3] hover:text-[#F2F2F2]"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {profile.social_links.instagram && (
              <a
                href={profile.social_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9DA2B3] hover:text-[#F2F2F2]"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {profile.social_links.facebook && (
              <a
                href={profile.social_links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9DA2B3] hover:text-[#F2F2F2]"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>
        )}

        {profile.manager && (
          <div>
            <h3 className="clbr-label mb-2">Reports To</h3>
            <p className="text-sm text-[#D3D6E0]">
              {profile.manager.full_name} - {profile.manager.job_title}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
