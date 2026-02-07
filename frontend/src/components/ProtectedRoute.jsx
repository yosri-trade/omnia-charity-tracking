import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * @param {React.ReactNode} children
 * @param {string[]} [allowedRoles] - Si défini, redirige vers /my-missions (ou /) si user.role n'est pas dans la liste.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Chargement...</p>
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
