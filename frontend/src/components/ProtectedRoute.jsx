import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * @param {React.ReactNode} children
 * @param {string[]} [allowedRoles] - Si défini, redirige vers /my-missions (ou /) si user.role n'est pas dans la liste.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-gray-600 dark:text-slate-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/my-missions" replace />;
  }

  return children;
}

export default ProtectedRoute;
