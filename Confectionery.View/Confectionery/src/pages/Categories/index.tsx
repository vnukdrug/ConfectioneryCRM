import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, Input as AntInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
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
    const [searchText, setSearchText] = useState('');
    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'Admin';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch {
            message.error('Ошибка загрузки категорий');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchText.toLowerCase())
    );

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
        } catch {
            message.error('Ошибка при удалении');
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
        } catch {
            message.error('Проверьте заполнение полей');
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h1>Категории</h1>
                        <Space>
                            <ExportButtons
                                data={filteredCategories}
                                columns={columns}
                                filename="Категории"
                            />
                            {isAdmin && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                    Добавить категорию
                                </Button>
                            )}
                        </Space>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <AntInput
                            placeholder="Поиск по названию..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredCategories}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                    />

                    {isAdmin && (
                        <Modal
                            title={editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
                            open={isModalOpen}
                            onOk={handleSave}
                            onCancel={() => setIsModalOpen(false)}
                            okText="Сохранить"
                            cancelText="Отмена"
                        >
                            <Form form={form} layout="vertical">
                                <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                                    <Input placeholder="Торты" />
                                </Form.Item>
                                <Form.Item name="type" label="Тип" rules={[{ required: true }]}>
                                    <Select placeholder="Выберите тип">
                                        <Option value="product">Готовая продукция</Option>
                                        <Option value="ingredient">Ингредиент</Option>
                                    </Select>
                                </Form.Item>
                            </Form>
                        </Modal>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Categories;