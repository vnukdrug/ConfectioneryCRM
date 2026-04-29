import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, Modal, Form, Input, message, Space, Popconfirm, Input as AntInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
import { api } from '../../api/api';
import type { Filial } from '../../types';

const { Content } = Layout;

interface FilialsProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Filials: React.FC<FilialsProps> = ({ collapsed, onCollapse }) => {
    const [filials, setFilials] = useState<Filial[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'Admin';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFilials();
            setFilials(data);
        } catch {
            message.error('Ошибка загрузки филиалов');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredFilials = filials.filter(filial =>
        filial.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Адрес',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: 'Телефон',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Сотрудников',
            dataIndex: 'employeesCount',
            key: 'employeesCount',
            sorter: (a: Filial, b: Filial) => a.employeesCount - b.employeesCount,
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: Filial) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Удалить филиал"
                        description="Вы уверены, что хотите удалить этот филиал?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const handleAdd = () => {
        setEditingFilial(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (filial: Filial) => {
        setEditingFilial(filial);
        form.setFieldsValue(filial);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteFilial(id);
            message.success('Филиал удален');
            loadData();
        } catch {
            message.error('Ошибка при удалении');
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            if (editingFilial) {
                await api.updateFilial(editingFilial.id, values);
                message.success('Филиал обновлен');
            } else {
                await api.createFilial(values);
                message.success('Филиал добавлен');
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
                        <h1>Филиалы</h1>
                        <Space>
                            <ExportButtons
                                data={filteredFilials}
                                columns={columns}
                                filename="Филиалы"
                            />
                            {isAdmin && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                    Добавить филиал
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
                        dataSource={filteredFilials}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />

                    {isAdmin && (
                        <Modal
                            title={editingFilial ? 'Редактировать филиал' : 'Добавить филиал'}
                            open={isModalOpen}
                            onOk={handleSave}
                            onCancel={() => setIsModalOpen(false)}
                            okText="Сохранить"
                            cancelText="Отмена"
                        >
                            <Form form={form} layout="vertical">
                                <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                                    <Input placeholder="Центральный" />
                                </Form.Item>
                                <Form.Item name="address" label="Адрес" rules={[{ required: true }]}>
                                    <Input placeholder="ул. Ленина, 10" />
                                </Form.Item>
                                <Form.Item name="phone" label="Телефон" rules={[{ required: true }]}>
                                    <Input placeholder="+7 (123) 456-78-90" />
                                </Form.Item>
                            </Form>
                        </Modal>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Filials;