import { useState } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { Navigate } from '../lib/router-shim'
import { usePageTitle } from '../hooks/usePageTitle'
import { DepartmentManager } from '../components/admin/DepartmentManager'
import { UserManagement } from '../components/admin/UserManagement'
import { LogoUpload } from '../components/admin/LogoUpload'
import { Button } from '../components/ui/button'
import { Building2, Users, Palette } from 'lucide-react'

type Tab = 'departments' | 'users' | 'branding'


export default function AdminPanel() {
  usePageTitle('Admin Panel')
  const { isAdmin, isLoading } = usePermissions()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  if (isLoading) {
    return (
      <div className="clbr-page-wrap">
        <div className="clbr-page-content">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-[#D3D6E0]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="clbr-page-wrap">
      <div className="clbr-page-content max-w-6xl">
      <h1 className="clbr-page-title">Admin Panel</h1>

      <div className="mb-6 flex gap-2 border-b border-[rgba(64,66,77,0.4)] pb-3">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'clbr-btn-secondary' : 'clbr-btn-minimal'}
        >
          <Users className="mr-2 h-4 w-4" />
          Users
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('departments')}
          className={activeTab === 'departments' ? 'clbr-btn-secondary' : 'clbr-btn-minimal'}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Departments
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('branding')}
          className={activeTab === 'branding' ? 'clbr-btn-secondary' : 'clbr-btn-minimal'}
        >
          <Palette className="mr-2 h-4 w-4" />
          Branding
        </Button>
      </div>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'departments' && <DepartmentManager />}
      {activeTab === 'branding' && <LogoUpload />}
      </div>
    </div>
  )
}
