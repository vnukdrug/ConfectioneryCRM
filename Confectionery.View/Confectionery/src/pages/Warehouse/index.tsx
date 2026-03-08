import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, Select, Input, Tag, Modal, Form, InputNumber, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api';
import type { WarehouseItem, Product } from '../../types';

const { Content } = Layout;
const { Option } = Select;

interface WarehouseProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Warehouse: React.FC<WarehouseProps> = ({ collapsed, onCollapse }) => {
    const [warehouse, setWarehouse] = useState<WarehouseItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFilial, setSelectedFilial] = useState<number | 'all'>('all');
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const loadData = useCallback(async () => {
    setLoading(true);
    try {
        const [stockData, productsData, filialsData] = await Promise.all([
            api.getWarehouse(selectedFilial === 'all' ? undefined : selectedFilial),
            api.getStockProducts(),
            api.getFilials()
        ]);
        setWarehouse(stockData);
        setProducts(productsData);
        setFilials(filialsData.map(f => ({ id: f.id, name: f.name })));
    } catch (error: unknown) {
        if (error instanceof Error) {
            message.error(error.message || 'Ошибка загрузки данных');
        } else {
            message.error('Ошибка загрузки данных');
        }
    } finally {
        setLoading(false);
    }
}, [selectedFilial]); // добавили зависимость

useEffect(() => {
    loadData();
}, [loadData]); // теперь loadData стабильна

    const filteredData = warehouse.filter(item => 
        item.product.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Филиал',
            dataIndex: 'filial',
            key: 'filial',
        },
        {
            title: 'Продукт',
            dataIndex: 'product',
            key: 'product',
            sorter: (a: WarehouseItem, b: WarehouseItem) => a.product.localeCompare(b.product),
        },
        {
            title: 'Категория',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Тип',
            dataIndex: 'categoryType',
            key: 'categoryType',
            render: (type: string) => {
                const color = type === 'product' ? 'green' : 'blue';
                const text = type === 'product' ? 'Готовая продукция' : 'Ингредиент';
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: (a: WarehouseItem, b: WarehouseItem) => a.quantity - b.quantity,
            render: (quantity: number, record: WarehouseItem) => (
                <span style={{ 
                    color: quantity <= record.minStock ? '#ff4d4f' : 'inherit',
                    fontWeight: quantity <= record.minStock ? 'bold' : 'normal'
                }}>
                    {quantity} {record.unit}
                    {quantity <= record.minStock && ' ⚠️'}
                </span>
            ),
        },
        {
            title: 'Ед. измерения',
            dataIndex: 'unit',
            key: 'unit',
        },
    ];

    const handleAddStock = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            await api.createStockMovement({
                filialId: values.filialId,
                productId: values.productId,
                quantity: values.quantity,
                movementType: 'income'
            });
            message.success('Приход товара оформлен');
            setIsModalOpen(false);
            loadData();
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error(error.message || 'Ошибка при оформлении прихода');
            } else {
                message.error('Ошибка при оформлении прихода');
            }
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h1>Склад</h1>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStock}>
                            Оформить приход
                        </Button>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                        <Select 
                            value={selectedFilial} 
                            onChange={setSelectedFilial}
                            style={{ width: 200 }}
                            placeholder="Все филиалы"
                        >
                            <Option value="all">Все филиалы</Option>
                            {filials.map(f => (
                                <Option key={f.id} value={f.id}>{f.name}</Option>
                            ))}
                        </Select>
                        
                        <Input
                            placeholder="Поиск по названию"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                    </div>

                    <Table 
                        columns={columns} 
                        dataSource={filteredData} 
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />

                    <Modal
                        title="Оформить приход товара"
                        open={isModalOpen}
                        onOk={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        okText="Оформить"
                        cancelText="Отмена"
                    >
                        <Form
                            form={form}
                            layout="vertical"
                        >
                            <Form.Item
                                name="filialId"
                                label="Филиал"
                                rules={[{ required: true, message: 'Выберите филиал' }]}
                            >
                                <Select placeholder="Выберите филиал">
                                    {filials.map(f => (
                                        <Option key={f.id} value={f.id}>{f.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="productId"
                                label="Товар"
                                rules={[{ required: true, message: 'Выберите товар' }]}
                            >
                                <Select placeholder="Выберите товар">
                                    {products.map(p => (
                                        <Option key={p.id} value={p.id}>
                                            {p.name} ({p.category}) - {p.unit}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="quantity"
                                label="Количество"
                                rules={[{ required: true, message: 'Введите количество' }]}
                            >
                                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Warehouse;