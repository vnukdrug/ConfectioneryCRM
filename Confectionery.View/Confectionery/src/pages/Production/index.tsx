import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, message, Spin, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api';

const { Content } = Layout;

interface ProductionProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

interface PlanItem {
    id: number;
    product: string;
    plannedQuantity: number;
    producedQuantity: number;
    status: 'planned' | 'in_progress' | 'completed';
    deadline: string;
}

const Production: React.FC<ProductionProps> = ({ collapsed, onCollapse }) => {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<PlanItem[]>([]);
    const user = api.getCurrentUser();

    const loadPlan = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.filialId) {
                console.log('📅 Загружаем план для филиала:', user.filialId);
                const data = await api.getBakerPlan(user.filialId);
                console.log('📅 Полученные данные:', data);
                setPlan(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки плана:', error);
            message.error('Ошибка загрузки плана');
        } finally {
            setLoading(false);
        }
    }, [user?.filialId]);

    useEffect(() => {
        if (user?.filialId) {
            loadPlan();
        }
    }, [user?.filialId, loadPlan]);

    const handleMarkAsDone = async (id: number) => {
        try {
            console.log('✅ Отметка выполнения плана ID:', id);
            await api.markAsDone(id);
            message.success('Готово!');
            loadPlan(); // Перезагружаем план
        } catch (error) {
            console.error('Ошибка при отметке:', error);
            message.error('Ошибка при отметке');
        }
    };

    const columns = [
        {
            title: 'Продукт',
            dataIndex: 'product',
            key: 'product',
        },
        {
            title: 'План',
            dataIndex: 'plannedQuantity',
            key: 'plannedQuantity',
        },
        {
            title: 'Сделано',
            dataIndex: 'producedQuantity',
            key: 'producedQuantity',
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const color = status === 'completed' ? 'green' : status === 'in_progress' ? 'orange' : 'blue';
                const text = status === 'completed' ? 'Готово' : status === 'in_progress' ? 'В процессе' : 'Запланировано';
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: PlanItem) => (
                record.status !== 'completed' && (
                    <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />} 
                        onClick={() => handleMarkAsDone(record.id)}
                    >
                        Готово
                    </Button>
                )
            ),
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <h1>План выпечки на сегодня</h1>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" tip="Загрузка..." />
                        </div>
                    ) : (
                        <Table 
                            columns={columns} 
                            dataSource={plan} 
                            rowKey="id"
                            pagination={false}
                        />
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Production;