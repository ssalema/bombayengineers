import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AppShellSkeleton, LoginSkeleton } from '../common/Skeletons';
import { ROUTES } from '../../config/constants';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AppShellSkeleton />;
  if (status === 'guest') return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoginSkeleton />;
  if (status === 'authenticated') {
    const from = location.state?.from;
    const target = from ? `${from.pathname}${from.search ?? ''}` : ROUTES.DASHBOARD;
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
