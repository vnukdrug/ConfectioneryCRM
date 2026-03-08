import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { api } from '../api/api';

const { Title, Text } = Typography;

// Тип для данных формы
interface LoginForm {
    login: string;
    password: string;
}

const Authorization = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Заменяем any на LoginForm
    const onFinish = async (values: LoginForm) => {
        setLoading(true);
        try {
            const user = await api.login(values.login, values.password);
            message.success(`Добро пожаловать, ${user.fullName}!`);
            
            if (user.role === 'Admin') {
                navigate('/dashboard');
            } else if (user.role === 'Director') {
                navigate('/dashboard');
            } else if (user.role === 'Baker') {
                navigate('/production');
            } else if (user.role === 'Cashier') {
                navigate('/sales');
            } else {
                navigate('/dashboard');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error(error.message || 'Ошибка входа');
            } else {
                message.error('Ошибка входа');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2}>Кондитерская сеть</Title>
                    <Text type="secondary">Вход в систему</Text>
                </div>

                <Form onFinish={onFinish} size="large" layout="vertical">
                    <Form.Item 
                        name="login" 
                        rules={[{ required: true, message: 'Введите логин' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Логин" />
                    </Form.Item>

                    <Form.Item 
                        name="password" 
                        rules={[{ required: true, message: 'Введите пароль' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Authorization;