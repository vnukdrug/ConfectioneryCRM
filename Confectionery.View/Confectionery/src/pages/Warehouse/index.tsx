import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, Select, Input, Tag, Modal, Form, InputNumber, message, Space, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
import { api } from '../../api/api';
import type { WarehouseItem } from '../../types';

const { Content } = Layout;
const { Option } = Select;

interface WarehouseProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Warehouse: React.FC<WarehouseProps> = ({ collapsed, onCollapse }) => {
    const [warehouse, setWarehouse] = useState<WarehouseItem[]>([]);
    const [products, setProducts] = useState<{ id: number; name: string; categoryType: string; unit: string }[]>([]);
    const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFilial, setSelectedFilial] = useState<number | 'all'>('all');
    const [searchText, setSearchText] = useState('');

    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [incomeForm] = Form.useForm();

    const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
    const [outcomeForm] = Form.useForm();
    const [selectedProduct, setSelectedProduct] = useState<WarehouseItem | null>(null);

    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'Admin';
    const isDirector = user?.role === 'Director';
    const canEdit = isAdmin || isDirector;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [stockData, productsData, filialsData] = await Promise.all([
                api.getWarehouse(selectedFilial === 'all' ? undefined : selectedFilial),
                api.getAllProducts(),
                api.getFilials()
            ]);
            setWarehouse(stockData);
            setProducts(productsData);
            setFilials(filialsData.map(f => ({ id: f.id, name: f.name })));
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            message.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, [selectedFilial]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredData = warehouse.filter(item =>
        item.product.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleWriteOff = (record: WarehouseItem) => {
        setSelectedProduct(record);
        outcomeForm.setFieldsValue({
            quantity: 1,
            reason: 'production'
        });
        setIsOutcomeModalOpen(true);
    };

    const handleWriteOffSubmit = async () => {
        try {
            const values = await outcomeForm.validateFields();
            if (!selectedProduct) return;
            if (values.quantity > selectedProduct.quantity) {
                message.error(`Недостаточно товара на складе. Доступно: ${selectedProduct.quantity} ${selectedProduct.unit}`);
                return;
            }
            await api.createStockMovement({
                filialId: filials.find(f => f.name === selectedProduct.filial)?.id || 0,
                productId: selectedProduct.productId,
                quantity: -values.quantity,
                movementType: 'outcome',
                reason: values.reason,
                description: values.description
            });
            message.success(`Списано ${values.quantity} ${selectedProduct.unit} товара "${selectedProduct.product}"`);
            setIsOutcomeModalOpen(false);
            outcomeForm.resetFields();
            loadData();
        } catch (error) {
            console.error('Ошибка при списании:', error);
            message.error('Ошибка при списании товара');
        }
    };

    const handleIncomeSubmit = async () => {
        try {
            const values = await incomeForm.validateFields();
            await api.createStockMovement({
                filialId: values.filialId,
                productId: values.productId,
                quantity: values.quantity,
                movementType: 'income',
                reason: 'purchase',
                description: values.description
            });
            message.success(`Приход товара оформлен`);
            setIsIncomeModalOpen(false);
            incomeForm.resetFields();
            loadData();
        } catch (error) {
            console.error('Ошибка при оформлении прихода:', error);
            message.error('Ошибка при оформлении прихода');
        }
    };

    const columns = [
        {
            title: 'Филиал',
            dataIndex: 'filial',
            key: 'filial',
        },
        {
            title: 'Товар',
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
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: WarehouseItem) => (
                <Space>
                    <Popconfirm
                        title="Списание товара"
                        description={`Списать ${record.quantity} ${record.unit}?`}
                        onConfirm={() => handleWriteOff(record)}
                        okText="Списать"
                        cancelText="Отмена"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<MinusOutlined />}
                            disabled={record.quantity === 0 || !canEdit}
                        >
                            Списать
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Подготовка данных для экспорта
    const exportData = filteredData.map(item => ({
        'Филиал': item.filial,
        'Товар': item.product,
        'Категория': item.category,
        'Тип': item.categoryType === 'product' ? 'Готовая продукция' : 'Ингредиент',
        'Количество': `${item.quantity} ${item.unit}`,
        'Ед. измерения': item.unit,
        'Мин. остаток': item.minStock
    }));

    const exportColumns = [
        { title: 'Филиал', dataIndex: 'Филиал' },
        { title: 'Товар', dataIndex: 'Товар' },
        { title: 'Категория', dataIndex: 'Категория' },
        { title: 'Тип', dataIndex: 'Тип' },
        { title: 'Количество', dataIndex: 'Количество' },
        { title: 'Ед. измерения', dataIndex: 'Ед. измерения' },
        { title: 'Мин. остаток', dataIndex: 'Мин. остаток' }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h1>Склад</h1>
                        <Space>
                            <ExportButtons
                                data={exportData}
                                columns={exportColumns}
                                filename="Склад"
                            />
                            {canEdit && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsIncomeModalOpen(true)}>
                                    Оформить приход
                                </Button>
                            )}
                        </Space>
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

                    <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                        <span style={{ marginRight: 16 }}>📦 <strong>Приход</strong> — добавление товара на склад</span>
                        <span style={{ color: '#ff4d4f' }}>➖ <strong>Списание</strong> — расход товара (производство, порча, инвентаризация)</span>
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
                        open={isIncomeModalOpen}
                        onOk={handleIncomeSubmit}
                        onCancel={() => setIsIncomeModalOpen(false)}
                        okText="Оформить"
                        cancelText="Отмена"
                        width={500}
                    >
                        <Form form={incomeForm} layout="vertical">
                            <Form.Item name="filialId" label="Филиал" rules={[{ required: true }]}>
                                <Select placeholder="Выберите филиал">
                                    {filials.map(f => (
                                        <Option key={f.id} value={f.id}>{f.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="productId" label="Товар" rules={[{ required: true }]}>
                                <Select placeholder="Выберите товар" showSearch optionFilterProp="children">
                                    {products.map(p => (
                                        <Option key={p.id} value={p.id}>
                                            {p.name} ({p.categoryType === 'product' ? 'Готовая продукция' : 'Ингредиент'}) - {p.unit}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="quantity" label="Количество" rules={[{ required: true }]}>
                                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="description" label="Примечание">
                                <Input.TextArea rows={2} placeholder="Накладная №, поставщик и т.д." />
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="Списание товара"
                        open={isOutcomeModalOpen}
                        onOk={handleWriteOffSubmit}
                        onCancel={() => setIsOutcomeModalOpen(false)}
                        okText="Списать"
                        cancelText="Отмена"
                        width={500}
                    >
                        {selectedProduct && (
                            <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 6 }}>
                                <p><strong>Товар:</strong> {selectedProduct.product}</p>
                                <p><strong>Филиал:</strong> {selectedProduct.filial}</p>
                                <p><strong>Доступно:</strong> {selectedProduct.quantity} {selectedProduct.unit}</p>
                                <p><strong>Тип:</strong> {selectedProduct.categoryType === 'product' ? 'Готовая продукция' : 'Ингредиент'}</p>
                            </div>
                        )}
                        <Form form={outcomeForm} layout="vertical">
                            <Form.Item name="quantity" label="Количество для списания" rules={[{ required: true }]}>
                                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="reason" label="Причина списания" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="production">Производство</Option>
                                    <Option value="damage">Порча товара</Option>
                                    <Option value="inventory">Инвентаризация</Option>
                                    <Option value="expired">Истек срок годности</Option>
                                    <Option value="other">Другое</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="description" label="Примечание">
                                <Input.TextArea rows={2} placeholder="Дополнительная информация" />
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Warehouse;