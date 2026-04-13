import { Navigate } from 'react-router-dom';
import { api } from '../api/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireFilial?: boolean; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireFilial = false 
}) => {
  const user = api.getCurrentUser();
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (requireFilial && !user.filialId) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;