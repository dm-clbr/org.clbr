import { usePermissions } from '../hooks/usePermissions'
import { Navigate } from '../lib/router-shim'
import { ManagerUserManagement } from '../components/manager/ManagerUserManagement'
import { usePageTitle } from '../hooks/usePageTitle'
import { LoadingSquare } from '../components/ui/loading-square'

export default function ManagerPanel() {
  usePageTitle('Manager Panel')
  const { isManager, isLoading } = usePermissions()

  if (isLoading) {
    return (
      <div className="clbr-page-wrap">
        <div className="clbr-page-content">
        <div className="flex items-center justify-center">
          <LoadingSquare />
          </div>
        </div>
      </div>
    )
  }

  if (!isManager) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="clbr-page-wrap">
      <div className="clbr-page-content max-w-6xl">
      <h1 className="clbr-page-title">Manager Panel</h1>
      <p className="clbr-page-description">
        Manage your team members. You can edit team member details and invite new employees to your team.
      </p>

      <ManagerUserManagement />
      </div>
    </div>
  )
}
