import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Typography, Button, Select, message, Row, Col, Tooltip } from 'antd';
import { 
  DashboardOutlined, 
  ShopOutlined, 
  TeamOutlined, 
  InboxOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  AppstoreOutlined,
  TagsOutlined,
  CalendarOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/api';
import type { AuthResponse } from '../types';
import '../style/App.css'; 

const { Sider } = Layout;
const { Text } = Typography;
const { Option } = Select;

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [user, setUser] = useState<AuthResponse | null>(() => {
    return api.getCurrentUser();
  });

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const loadFilials = async () => {
      try {
        const data = await api.getFilials();
        setFilials(data);
      } catch (error) {
        console.error('Ошибка загрузки филиалов:', error);
      }
    };
    
    if (user?.role === 'Admin') {
      loadFilials();
    }
  }, [user?.role]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [user, collapsed, filials]);

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/filials')) return 'filials';
    if (path.includes('/employees')) return 'employees';
    if (path.includes('/warehouse')) return 'warehouse';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/production')) return 'production';
    if (path.includes('/sales')) return 'sales';
    if (path.includes('/products')) return 'products';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/planning')) return 'planning';
    return 'dashboard';
  };

  const handleFilialChange = async (value: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await api.updateUserFilial(user.id, value);
      
      const updatedUser = { ...user, filialId: value };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      message.success(`Филиал изменен на ${filials.find(f => f.id === value)?.name}`);
      window.location.reload();
      
    } catch (error) {
      console.error('Ошибка при смене филиала:', error);
      message.error('Ошибка при смене филиала');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilial = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await api.updateUserFilial(user.id, null);
      
      const updatedUser = { ...user, filialId: undefined };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      message.success('Филиал сброшен (все филиалы)');
      window.location.reload();
      
    } catch (error) {
      console.error('Ошибка при сбросе филиала:', error);
      message.error('Ошибка при сбросе филиала');
    } finally {
      setLoading(false);
    }
  };

  const getMenuItems = () => {
    const items = [];

    items.push({
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Главная',
      onClick: () => navigate('/dashboard')
    });

    if (user?.role === 'Admin') {
      items.push(
        {
          key: 'products',
          icon: <AppstoreOutlined />,
          label: 'Товары',
          onClick: () => navigate('/products')
        },
        {
          key: 'categories',
          icon: <TagsOutlined />,
          label: 'Категории',
          onClick: () => navigate('/categories')
        },
        {
          key: 'filials',
          icon: <ShopOutlined />,
          label: 'Филиалы',
          onClick: () => navigate('/filials')
        },
        {
          key: 'employees',
          icon: <TeamOutlined />,
          label: 'Сотрудники',
          onClick: () => navigate('/employees')
        },
        {
          key: 'warehouse',
          icon: <InboxOutlined />,
          label: 'Склад',
          onClick: () => navigate('/warehouse')
        },
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: 'Отчеты',
          onClick: () => navigate('/reports')
        },
        {
          key: 'planning',
          icon: <CalendarOutlined />,
          label: 'Планирование',
          onClick: () => navigate('/planning')
        },
        {
          key: 'production',
          icon: <ToolOutlined />,
          label: 'Выпечка',
          onClick: () => navigate('/production')
        },
        {
          key: 'sales',
          icon: <ShoppingCartOutlined />,
          label: 'Касса',
          onClick: () => navigate('/sales')
        }
      );
    }

    if (user?.role === 'Director') {
      items.push(
        {
          key: 'warehouse',
          icon: <InboxOutlined />,
          label: 'Склад',
          onClick: () => navigate('/warehouse')
        },
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: 'Отчеты',
          onClick: () => navigate('/reports')
        },
        {
          key: 'planning',
          icon: <CalendarOutlined />,
          label: 'Планирование',
          onClick: () => navigate('/planning')
        }
      );
    }

    if (user?.role === 'Baker') {
      items.push({
        key: 'production',
        icon: <ToolOutlined />,
        label: 'Выпечка',
        onClick: () => navigate('/production')
      });
    }

    if (user?.role === 'Cashier') {
      items.push({
        key: 'sales',
        icon: <ShoppingCartOutlined />,
        label: 'Касса',
        onClick: () => navigate('/sales')
      });
    }

    return items;
  };

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      Admin: 'Администратор',
      Director: 'Директор филиала',
      Baker: 'Повар',
      Cashier: 'Кассир'
    };
    return roles[role] || role;
  };

  const currentFilialName = user?.filialId 
    ? filials.find(f => f.id === user.filialId)?.name 
    : 'Все филиалы';

  const toggleCollapse = () => {
    if (onCollapse) {
      onCollapse(!collapsed);
    }
  };

  return (
    <Sider 
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="light"
      trigger={null}
      width={280}
      collapsedWidth={80}
      style={{ 
        height: '100vh', 
        position: 'sticky', 
        top: 0, 
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
      }}
    >
      <div 
        ref={headerRef}
        style={{ 
          padding: collapsed ? '16px 8px' : '24px 20px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0
        }}
      >
        <Row align="middle" justify="space-between" wrap={false} gutter={[8, 0]}>
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 16 }}>
              <Avatar 
                size={collapsed ? 40 : 56} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  flexShrink: 0
                }} 
              />
              {!collapsed && user && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>
                    {user.fullName}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    {getRoleName(user.role)}
                  </Text>
                </div>
              )}
            </div>
          </Col>
          
          <Col>
            <Tooltip title={collapsed ? 'Развернуть' : 'Свернуть'}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleCollapse}
                size="large"
                style={{ 
                  width: 40, 
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
          </Col>
        </Row>

        {!collapsed && user && user?.role === 'Admin' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ 
              backgroundColor: '#f0f5ff', 
              padding: '8px 12px', 
              borderRadius: 6,
              border: '1px solid #d9e6ff',
              marginBottom: 12
            }}>
              <Text style={{ fontSize: 14, color: '#2f54eb', display: 'block', textAlign: 'center' }}>
                📍 Текущий филиал: <strong>{currentFilialName}</strong>
              </Text>
            </div>
            
            <Select
              placeholder="Выберите филиал"
              style={{ width: '100%' }}
              onChange={handleFilialChange}
              onClear={handleClearFilial}
              value={user.filialId}
              loading={loading}
              allowClear
              size="large"
              suffixIcon={<DownOutlined />}
            >
              {filials.map(f => (
                <Option key={f.id} value={f.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <ShopOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                    <span style={{ fontSize: 15 }}>{f.name}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        )}

        {!collapsed && !user && (
          <div style={{ marginTop: 8 }}>
            <Text strong>Загрузка...</Text>
          </div>
        )}
      </div>
      
      {}
      <div 
        className="sidebar-scroll-container"
        style={{ 
          height: `calc(100vh - ${headerHeight}px - 80px)`,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          padding: '8px 0'
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={getMenuItems()}
          style={{ 
            borderRight: 0,
            fontSize: 15
          }}
          inlineCollapsed={collapsed}
        />
      </div>
      
      <div style={{ 
        padding: collapsed ? '12px 8px' : '20px', 
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        flexShrink: 0,
        height: 80
      }}>
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          danger
          block={!collapsed}
          onClick={handleLogout}
          size="large"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            height: 48,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 500
          }}
        >
          {!collapsed && 'Выйти из системы'}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;