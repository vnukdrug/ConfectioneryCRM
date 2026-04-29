import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Table, Button, Modal, Form, Select, DatePicker, InputNumber, message, Tag, Input as AntInput, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
import { api } from '../../api/api';
import type { Product, PlanItem } from '../../types';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Option } = Select;

interface PlanningProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Planning: React.FC<PlanningProps> = ({ collapsed, onCollapse }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [plans, setPlans] = useState<PlanItem[]>([]);
    const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'Admin';
    const isDirector = user?.role === 'Director';
    const canCreate = isAdmin || isDirector;

    const loadData = useCallback(async () => {
        console.log('🔄 loadData started');
        setLoading(true);
        try {
            const [productsData, filialsData] = await Promise.all([
                api.getAllProducts(),
                api.getFilials()
            ]);

            const bakeryProducts = productsData.filter(p => p.categoryType === 'product');
            setProducts(bakeryProducts);
            setFilials(filialsData);

            if (user?.filialId) {
                const plansData = await api.getBakerPlan(user.filialId);
                setPlans(plansData);
            } else {
                const plansData = await api.getBakerPlan(1);
                setPlans(plansData);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            message.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, [user?.filialId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredPlans = plans.filter(plan =>
        plan.product.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleCreatePlan = async () => {
        try {
            const values = await form.validateFields();
            await api.createPlan({
                filialId: values.filialId,
                productId: values.productId,
                quantity: values.quantity,
                planDate: values.planDate.toISOString()
            });
            message.success('План создан');
            setIsModalOpen(false);
            form.resetFields();
            loadData();
        } catch (error) {
            console.error('Ошибка создания плана:', error);
            message.error('Ошибка при создании плана');
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
            title: 'Дата',
            dataIndex: 'deadline',
            key: 'deadline',
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h1>Планирование выпечки</h1>
                        <Space>
                            <ExportButtons
                                data={filteredPlans}
                                columns={columns}
                                filename="Планирование_выпечки"
                            />
                            {canCreate && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                                    Создать план
                                </Button>
                            )}
                        </Space>
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

                    <Card title="План на сегодня">
                        <Table
                            columns={columns}
                            dataSource={filteredPlans}
                            rowKey="id"
                            loading={loading}
                            pagination={false}
                        />
                    </Card>

                    <Modal
                        title="Создать план выпечки"
                        open={isModalOpen}
                        onOk={handleCreatePlan}
                        onCancel={() => setIsModalOpen(false)}
                        okText="Создать"
                        cancelText="Отмена"
                        width={500}
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="filialId"
                                label="Филиал"
                                rules={[{ required: true }]}
                                initialValue={user?.filialId}
                            >
                                <Select disabled={!isAdmin}>
                                    {filials.map(f => (
                                        <Option key={f.id} value={f.id}>{f.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="productId"
                                label="Продукт"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Выберите продукт">
                                    {products.length > 0 ? (
                                        products.map(p => (
                                            <Option key={p.id} value={p.id}>
                                                {p.name} ({p.unit}) - {p.price} ₽
                                            </Option>
                                        ))
                                    ) : (
                                        <Option value="" disabled>Нет доступных продуктов</Option>
                                    )}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="quantity"
                                label="Количество"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                name="planDate"
                                label="Дата"
                                rules={[{ required: true }]}
                                initialValue={dayjs()}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Planning;