import { useState, useMemo, useEffect, useRef } from 'react'
import { useProfiles, useProfile } from '../hooks/useProfile'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { OrgChartCanvas } from '../components/org-chart/OrgChartCanvas'
import { EmployeeSearch } from '../components/search/EmployeeSearch'
import { ProfileCard } from '../components/profile/ProfileCard'
import { AdminUserEditorDialog } from '../components/admin/AdminUserEditorDialog'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { LoadingSquare } from '../components/ui/loading-square'
import { X, SlidersHorizontal } from 'lucide-react'
import { useDepartments, getDepartmentDescendantIds, useOrgChartPositions } from '../lib/queries'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: currentProfile } = useProfile()
  const { isAdmin, isLoading: permissionsLoading } = usePermissions()
  usePageTitle('Org Chart')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const hasInitializedDepartment = useRef(false)

  const { data: allProfiles, isLoading: allProfilesLoading, error: allProfilesError } = useProfiles()
  const { data: allDepartments } = useDepartments()
  const { data: savedPositions } = useOrgChartPositions()

  // Set initial department filter when currentProfile loads (only once)
  useEffect(() => {
    if (!hasInitializedDepartment.current && currentProfile?.department_id) {
      setSelectedDepartment(currentProfile.department_id)
      hasInitializedDepartment.current = true
    }
  }, [currentProfile?.department_id])

  console.log('Dashboard: user:', user?.id)
  console.log('Dashboard: currentProfile:', currentProfile)
  console.log('Dashboard: isAdmin:', isAdmin, 'permissionsLoading:', permissionsLoading)

  const profiles = useMemo(() => {
    if (!allProfiles) return []
    if (!selectedDepartment) return allProfiles
    const matchingIds = new Set(
      getDepartmentDescendantIds(selectedDepartment, allDepartments || []),
    )
    return allProfiles.filter((profile) => profile.department_id && matchingIds.has(profile.department_id))
  }, [allProfiles, selectedDepartment, allDepartments])

  const isLoading = permissionsLoading || allProfilesLoading

  console.log('Dashboard: allProfiles:', allProfiles, 'loading:', allProfilesLoading, 'error:', allProfilesError)
  console.log('Dashboard: Final - profiles:', profiles, 'isLoading:', isLoading)

  const selectedProfile = allProfiles?.find((p) => p.id === selectedProfileId)
  const profileBeingEdited = allProfiles?.find((p) => p.id === editingProfile) ?? null

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <LoadingSquare />
        </div>
      </div>
    )
  }

  if (!allProfiles || allProfiles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Employees Found</h2>
          <p className="text-muted-foreground mb-4">
            {isAdmin
              ? "Get started by creating employee profiles in the admin panel."
              : "Your org chart is empty. Please contact an administrator."}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="org-chart-page min-h-screen flex flex-col md:flex-row bg-[#000000] text-[#F2F2F2]">
      {/* Mobile: filter toggle bar */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-[rgba(64,66,77,0.4)] bg-[#131313] shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen((v) => !v)}
          className="h-[40px] rounded-[2px] border-[rgba(64,66,77,0.55)] bg-[#414141] px-3 text-[12px] font-bold uppercase tracking-[0.3px] text-[#F2F2F2] hover:bg-[#40424D] hover:text-[#F2F2F2]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {sidebarOpen ? 'Hide Filters' : 'Search & Filter'}
        </Button>
        {selectedDepartment && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.3px] text-[#9DA2B3]">
            Focusing on {profiles.length} employee{profiles.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Sidebar */}
      <div
        className={`
          bg-[#131313] border-b border-[rgba(64,66,77,0.4)] md:border-b-0 md:border-r md:border-r-[rgba(64,66,77,0.4)] md:w-80 p-4 overflow-y-auto shrink-0
          ${sidebarOpen ? 'block' : 'hidden md:block'}
        `}
      >
        <div className="mb-6">
          <h2 className="text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em] text-[#F2F2F2] mb-2">Organization Chart</h2>
          <p className="text-[12px] font-semibold uppercase tracking-[0.3px] text-[#9DA2B3]">
            {selectedDepartment
              ? `Focusing on ${profiles.length} of ${allProfiles?.length || 0} employees`
              : `Browse and search ${allProfiles?.length || 0} employees`}
          </p>
        </div>

        <EmployeeSearch
          profiles={allProfiles || []}
          departments={allDepartments || []}
          onSelectEmployee={(id) => {
            setSelectedProfileId(id)
            setSidebarOpen(false) // Close sidebar on mobile after selecting
          }}
          currentUserDepartmentId={currentProfile?.department_id || undefined}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main content - Org Chart */}
      <div className="flex-1 relative min-h-0 bg-[#000000]">
        {profiles.length === 0 && selectedDepartment ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">No Employees in Selected Department</h2>
              <p className="text-muted-foreground mb-4">
                Try selecting a different department or view all departments.
              </p>
            </Card>
          </div>
        ) : (
          <OrgChartCanvas
            profiles={allProfiles || []}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            currentUserDepartmentId={currentProfile?.department_id || undefined}
            onNodeClick={setSelectedProfileId}
            selectedProfileId={selectedProfileId}
            searchQuery={searchQuery}
            selectedDepartment={selectedDepartment}
            allDepartments={allDepartments || []}
            savedPositions={savedPositions}
          />
        )}

        {/* Selected profile detail */}
        {selectedProfile && (
          <div className="absolute top-2 right-2 left-2 md:left-auto md:top-4 md:right-4 md:w-96 max-h-[calc(100%-1rem)] overflow-y-auto z-10">
            <div className="relative overflow-hidden rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[#131313] text-[#F2F2F2] shadow-[0_16px_36px_rgba(0,0,0,0.55)]">
              <Button
                variant="ghost"
                size="icon"
                className="clbr-btn-minimal absolute right-3 top-3 z-10 h-9 w-9 p-0 text-[#D3D6E0] hover:bg-[rgba(64,66,77,0.24)] hover:text-[#F2F2F2]"
                onClick={() => setSelectedProfileId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <ProfileCard
                profile={selectedProfile}
                onEdit={() => setEditingProfile(selectedProfile.id)}
              />
            </div>
          </div>
        )}

        <AdminUserEditorDialog
          profile={profileBeingEdited}
          open={!!editingProfile}
          onOpenChange={(open) => !open && setEditingProfile(null)}
        />
      </div>
    </div>
  )
}
