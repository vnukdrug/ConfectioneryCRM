import { Navigate } from 'react-router-dom';
import { api } from '../api/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireFilial?: boolean; // нужна ли привязка к филиалу
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

  // Проверка роли
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Если роль не подходит - на главную
    return <Navigate to="/dashboard" replace />;
  }

  // Проверка привязки к филиалу (для Director, Baker, Cashier)
  if (requireFilial && !user.filialId) {
    // Если нет филиала - на страницу ошибки
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;