import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Login } from './auth/Login';
import { AdminDashboard } from './ui/AdminDashboard';
import { SetPassword } from './auth/SetPassword';
import { ConfirmProvider } from './modal/ConfirmModalContext';
import { AdminDataProvider } from './publish/useAdminData';
import { AdminStatusProvider } from './publish/useAdminStatus';
import { AdminStaticProvider } from './publish/useAdminStatic';
import { DeploymentProvider } from './publish/useDeploymentData';
import { AdminPageNavigationProvider } from './nav/useAdminPageNav';

export default function AdminApp() {
  return (
    <AuthProvider>
      <Content />
    </AuthProvider>
  );
}

function Content() {
  const { user, isLoading } = useAuth();
  console.log('ADMIN APP RERENDERR');

  const urlParams = new URLSearchParams(window.location.search);
  const isSetPassword =
    urlParams.get('setmp') === 'true' &&
    urlParams.get('mode') === 'resetPassword' &&
    urlParams.get('oobCode') !== null;

  if (isLoading) return null;
  if (isSetPassword) return <SetPassword />;
  if (user)
    return (
      <AdminStaticProvider>
        <AdminPageNavigationProvider>
          <AdminDataProvider>
            <DeploymentProvider>
              <AdminStatusProvider>
                <ConfirmProvider>
                  <AdminDashboard />
                </ConfirmProvider>
              </AdminStatusProvider>
            </DeploymentProvider>
          </AdminDataProvider>
        </AdminPageNavigationProvider>
      </AdminStaticProvider>
    );
  return <Login />;
}
