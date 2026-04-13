import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api';
import type { Category } from '../../types';

const { Content } = Layout;
const { Option } = Select;

interface CategoriesProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Categories: React.FC<CategoriesProps> = ({ collapsed, onCollapse }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch {
            message.error('Ошибка загрузки категорий');
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
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'product' ? 'green' : 'blue'}>
                    {type === 'product' ? 'Готовая продукция' : 'Ингредиент'}
                </Tag>
            ),
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: Category) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Удалить категорию"
                        description="Вы уверены? Товары в этой категории тоже будут удалены."
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleAdd = () => {
        setEditingCategory(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        form.setFieldsValue(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteCategory(id);
            message.success('Категория удалена');
            loadData();
        } catch (error: unknown) { 
            if (error instanceof Error) {
                message.error(error.message || 'Ошибка при удалении');
            } else {
                message.error('Ошибка при удалении');
            }
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, values);
                message.success('Категория обновлена');
            } else {
                await api.createCategory(values);
                message.success('Категория добавлена');
            }
            
            setIsModalOpen(false);
            form.resetFields();
            loadData();
        } catch (error: unknown) { 
            if (error instanceof Error) {
                message.error(error.message || 'Проверьте заполнение полей');
            } else {
                message.error('Проверьте заполнение полей');
            }
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h1>Категории товаров</h1>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Добавить категорию
                        </Button>
                    </div>

                    <Table 
                        columns={columns} 
                        dataSource={categories} 
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                    />

                    <Modal
                        title={editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
                        open={isModalOpen}
                        onOk={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        okText="Сохранить"
                        cancelText="Отмена"
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item 
                                name="name" 
                                label="Название" 
                                rules={[{ required: true, message: 'Введите название' }]}
                            >
                                <Input placeholder="Торты" />
                            </Form.Item>

                            <Form.Item 
                                name="type" 
                                label="Тип" 
                                rules={[{ required: true, message: 'Выберите тип' }]}
                            >
                                <Select placeholder="Выберите тип">
                                    <Option value="product">Готовая продукция</Option>
                                    <Option value="ingredient">Ингредиент</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Categories;