import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Authorization from './pages/Authorization';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import Employees from './pages/Employees';
import Filials from './pages/Filials';
import Warehouse from './pages/Warehouse';
import Reports from './pages/Reports';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Products from './pages/Products';
import ProtectedRoute from './components/ProtectedRoute';
import Planning from './pages/Planning';
import Categories from './pages/Categories';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Authorization />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        

        <Route path="/products" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Products collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
                
        <Route path="/employees" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Employees collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        
        <Route path="/filials" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Filials collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        <Route path="/categories" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Categories collapsed={collapsed} onCollapse={setCollapsed} />
            </ProtectedRoute>
        } />
        
        {/* Admin и Director */}
        <Route path="/warehouse" element={
          <ProtectedRoute allowedRoles={['Admin', 'Director']}>
            <Warehouse collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['Admin', 'Director']}>
            <Reports collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        <Route path="/planning" element={
        <ProtectedRoute allowedRoles={['Admin', 'Director']}>
            <Planning collapsed={collapsed} onCollapse={setCollapsed} />
        </ProtectedRoute>
        } />
        
        {/* Admin и Baker */}
        <Route path="/production" element={
          <ProtectedRoute allowedRoles={['Admin', 'Baker']}>
            <Production collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        
        {/* Admin и Cashier */}
        <Route path="/sales" element={
          <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
            <Sales collapsed={collapsed} onCollapse={setCollapsed} />
          </ProtectedRoute>
        } />
        
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;