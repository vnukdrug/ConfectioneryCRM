import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, message, Spin, Tag, Input as AntInput } from 'antd';
import { CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
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
    const [searchText, setSearchText] = useState('');
    const user = api.getCurrentUser();

    const loadPlan = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.filialId) {
                const data = await api.getBakerPlan(user.filialId);
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

    const filteredPlan = plan.filter(item =>
        item.product.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleMarkAsDone = async (id: number) => {
        try {
            await api.markAsDone(id);
            message.success('Готово!');
            loadPlan();
        } catch (error) {
            console.error('Ошибка при отметке:', error);
            message.error('Ошибка при отметке');
        }
    };

    // Колонки для отображения на странице (с кнопкой "Готово")
    const displayColumns = [
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

    // Колонки для экспорта (без кнопки "Готово")
    const exportColumns = [
        { title: 'Продукт', dataIndex: 'product' },
        { title: 'План', dataIndex: 'plannedQuantity' },
        { title: 'Сделано', dataIndex: 'producedQuantity' },
        { title: 'Статус', dataIndex: 'status' },
        { title: 'Дата', dataIndex: 'deadline' },
    ];

    // Подготовка данных для экспорта
    const exportData = filteredPlan.map(item => ({
        'Продукт': item.product,
        'План': item.plannedQuantity,
        'Сделано': item.producedQuantity,
        'Статус': item.status === 'completed' ? 'Готово' : item.status === 'in_progress' ? 'В процессе' : 'Запланировано',
        'Дата': item.deadline,
    }));

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h1>План выпечки на сегодня</h1>
                        <ExportButtons
                            data={exportData}
                            columns={exportColumns}
                            filename="Выпечка"
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <AntInput
                            placeholder="Поиск по продукту..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" tip="Загрузка..." />
                        </div>
                    ) : (
                        <Table
                            columns={displayColumns}
                            dataSource={filteredPlan}
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