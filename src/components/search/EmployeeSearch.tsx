import { useState, useMemo } from 'react'
import type { Profile, Department } from '../../types'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { getInitials } from '../../lib/utils'
import { Search, X, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { buildDepartmentTree, getDepartmentDescendantIds } from '../../lib/queries'
import { cn } from '../../lib/utils'

interface EmployeeSearchProps {
  profiles: Profile[]
  /** Full flat list of all departments (for hierarchy display + cascading filter) */
  departments?: Department[]
  onSelectEmployee: (profileId: string) => void
  currentUserDepartmentId?: string
  selectedDepartment?: string | null
  onDepartmentChange?: (departmentId: string | null) => void
  onSearchChange?: (query: string) => void
}

interface FlatFilterNode {
  dept: Department
  depth: number
  hasEmployees: boolean
}

function buildFilterNodes(
  nodes: Department[],
  depth: number,
  employeeDeptIds: Set<string>,
  flat: Department[],
  result: FlatFilterNode[],
) {
  for (const node of nodes) {
    // A node "has employees" if it or any of its descendants contains someone
    const descendantIds = getDepartmentDescendantIds(node.id, flat)
    const hasEmployees = descendantIds.some((id) => employeeDeptIds.has(id))
    result.push({ dept: node, depth, hasEmployees })
    if (node.children && node.children.length > 0) {
      buildFilterNodes(node.children, depth + 1, employeeDeptIds, flat, result)
    }
  }
}

export function EmployeeSearch({
  profiles,
  departments = [],
  onSelectEmployee,
  currentUserDepartmentId,
  selectedDepartment: propSelectedDepartment,
  onDepartmentChange,
  onSearchChange,
}: EmployeeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  const selectedDepartment =
    propSelectedDepartment !== undefined ? propSelectedDepartment : currentUserDepartmentId || null

  const handleDepartmentChange = (departmentId: string | null) => {
    onDepartmentChange?.(departmentId)
  }

  // Build tree from the departments prop
  const tree = useMemo(() => buildDepartmentTree(departments), [departments])

  // Set of dept IDs that have at least one employee
  const employeeDeptIds = useMemo(() => {
    const ids = new Set<string>()
    profiles.forEach((p) => {
      if (p.department_id) ids.add(p.department_id)
    })
    return ids
  }, [profiles])

  // Flat ordered list for rendering filter badges
  const filterNodes = useMemo(() => {
    const result: FlatFilterNode[] = []
    buildFilterNodes(tree, 0, employeeDeptIds, departments, result)
    return result.filter((n) => n.hasEmployees)
  }, [tree, employeeDeptIds, departments])

  // Cascading filter: when a department is selected, include all descendants
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === '' ||
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesDepartment = true
      if (selectedDepartment) {
        const descendantIds = new Set(getDepartmentDescendantIds(selectedDepartment, departments))
        matchesDepartment = !!profile.department_id && descendantIds.has(profile.department_id)
      }

      return matchesSearch && matchesDepartment
    })
  }, [profiles, searchQuery, selectedDepartment, departments])

  return (
    <div className="org-employee-search space-y-4 h-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9DA2B3]" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-[44px] rounded-[2px] border-[rgba(64,66,77,0.5)] bg-[#1E1E24] pl-10 text-[14px] text-[#F2F2F2] placeholder:text-[#9DA2B3] focus-visible:ring-[#D3D6E0] focus-visible:ring-offset-0"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-[2px] text-[#9DA2B3] hover:bg-[#40424D]/30 hover:text-[#F2F2F2]"
            onClick={() => handleSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filterNodes.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.3px] text-[#BCBFCC]">Filter by Department</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer rounded-[2px] border-[rgba(64,66,77,0.55)] bg-transparent px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px] text-[#EDEFF7] transition-colors hover:bg-[#40424D]/40 hover:text-[#F2F2F2]',
                selectedDepartment === null && 'border-[rgba(64,66,77,0.7)] bg-[#414141] text-[#F2F2F2]'
              )}
              onClick={() => handleDepartmentChange(null)}
            >
              All
            </Badge>
            {filterNodes.map(({ dept, depth }) => {
              const isSelected = selectedDepartment === dept.id
              return (
                <Badge
                  key={dept.id}
                  variant="outline"
                  className={cn(
                    'cursor-pointer flex items-center gap-1 rounded-[2px] border-[rgba(64,66,77,0.55)] bg-transparent px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px] text-[#EDEFF7] transition-colors hover:bg-[#40424D]/40 hover:text-[#F2F2F2]',
                    depth > 0 && 'pl-1',
                    isSelected && 'border-transparent text-[#F2F2F2]'
                  )}
                  style={isSelected ? { backgroundColor: dept.color, color: '#F2F2F2' } : undefined}
                  onClick={() => handleDepartmentChange(isSelected ? null : dept.id)}
                >
                  {depth > 0 && (
                    <span className="flex items-center opacity-50">
                      {Array.from({ length: depth }).map((_, i) => (
                        <ChevronRight key={i} className="h-3 w-3 -mx-0.5" />
                      ))}
                    </span>
                  )}
                  {dept.name}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 h-full overflow-y-auto">
        {filteredProfiles.length === 0 ? (
          <p className="py-4 text-center text-[12px] font-semibold uppercase tracking-[0.3px] text-[#9DA2B3]">No employees found</p>
        ) : (
          filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-start gap-3 rounded-[2px] border border-[rgba(64,66,77,0.45)] bg-[rgba(30,30,36,0.5)] p-3 cursor-pointer transition-colors hover:border-[rgba(64,66,77,0.7)] hover:bg-[rgba(65,65,65,0.5)]"
              onClick={() => onSelectEmployee(profile.id)}
            >
              <Avatar className="shrink-0 mt-0.5 h-10 w-10 bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F]">
                {profile.profile_photo_url && (
                  <AvatarImage src={profile.profile_photo_url} alt={profile.full_name} />
                )}
                <AvatarFallback className="bg-transparent text-[#F2F2F2] text-[11px] font-bold uppercase tracking-[0.3px]">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-bold text-[#F2F2F2]">{profile.full_name}</p>
                <p className="truncate text-[13px] text-[#9DA2B3]">{profile.job_title}</p>
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
          ))
        )}
      </div>
    </div>
  )
}
