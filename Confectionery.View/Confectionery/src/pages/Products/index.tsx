import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api'; // должен быть правильный путь
import type { Product, Category } from '../../types';

const { Content } = Layout;
const { Option } = Select;

interface ProductsProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Products: React.FC<ProductsProps> = ({ collapsed, onCollapse }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form] = Form.useForm();

const loadData = async () => {
    setLoading(true);
    try {
        // Заменяем getProducts на getAllProducts
        const [productsData, categoriesData] = await Promise.all([
            api.getAllProducts(),  // 👈 ИСПРАВЛЕНО
            api.getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
    } catch {
        message.error('Ошибка загрузки данных');
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        loadData();
    }, []);

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
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
            render: (type: string) => (
                <Tag color={type === 'product' ? 'green' : 'blue'}>
                    {type === 'product' ? 'Готовая продукция' : 'Ингредиент'}
                </Tag>
            ),
        },
        {
            title: 'Ед. измерения',
            dataIndex: 'unit',
            key: 'unit',
        },
        {
            title: 'Мин. остаток',
            dataIndex: 'minStock',
            key: 'minStock',
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `${price} ₽`,
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: Product) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Удалить товар"
                        description="Вы уверены?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        form.setFieldsValue(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteProduct(id);
            message.success('Товар удален');
            loadData();
        } catch {
            message.error('Ошибка при удалении');
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, values);
                message.success('Товар обновлен');
            } else {
                await api.createProduct(values);
                message.success('Товар добавлен');
            }
            
            setIsModalOpen(false);
            form.resetFields();
            loadData();
        } catch {
            message.error('Проверьте заполнение полей');
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h1>Товары</h1>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Добавить товар
                        </Button>
                    </div>

                    <Table 
                        columns={columns} 
                        dataSource={products} 
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />

                    <Modal
                        title={editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                        open={isModalOpen}
                        onOk={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        okText="Сохранить"
                        cancelText="Отмена"
                        width={600}
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>

                            <Form.Item name="categoryId" label="Категория" rules={[{ required: true }]}>
                                <Select placeholder="Выберите категорию">
                                    {categories.map(cat => (
                                        <Option key={cat.id} value={cat.id}>
                                            {cat.name} ({cat.type === 'product' ? 'Продукция' : 'Ингредиент'})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="unit" label="Ед. измерения" rules={[{ required: true }]}>
                                <Input placeholder="кг, шт, л" />
                            </Form.Item>

                            <Form.Item name="price" label="Цена" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item name="minStock" label="Мин. остаток" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Products;