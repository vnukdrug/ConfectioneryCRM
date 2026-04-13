import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api';
import type { Employee } from '../../types';

const { Content } = Layout;

interface EmployeesProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Employees: React.FC<EmployeesProps> = ({ collapsed, onCollapse }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            const [emps, fils] = await Promise.all([
                api.getEmployees(),
                api.getFilials()
            ]);
            setEmployees(emps);
            setFilials(fils.map(f => ({ id: f.id, name: f.name })));
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
            title: 'ФИО',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'Логин',
            dataIndex: 'login',
            key: 'login',
        },
        {
            title: 'Роль',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                const roleMap: Record<string, string> = {
                    Admin: 'Администратор',
                    Director: 'Директор филиала',
                    Baker: 'Повар',
                    Cashier: 'Кассир',
                };
                return roleMap[role] || role;
            },
        },
        {
            title: 'Филиал',
            dataIndex: 'filial',
            key: 'filial',
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: Employee) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            ),
        },
    ];

    const handleAdd = () => {
        setEditingEmployee(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        form.setFieldsValue({
            fullName: employee.fullName,
            login: employee.login,
            role: employee.role,
            filialId: filials.find(f => f.name === employee.filial)?.id
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Подтверждение',
            content: 'Вы уверены, что хотите удалить сотрудника?',
            onOk: async () => {
                try {
                    await api.deleteEmployee(id);
                    message.success('Сотрудник удален');
                    loadData();
                } catch {
                    message.error('Ошибка при удалении');
                }
            },
        });
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            if (editingEmployee) {
                await api.updateEmployee(editingEmployee.id, values);
                message.success('Сотрудник обновлен');
            } else {
                await api.createEmployee(values);
                message.success('Сотрудник добавлен');
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
                        <h1>Сотрудники</h1>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Добавить сотрудника
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={employees}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />

                    <Modal
                        title={editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
                        open={isModalOpen}
                        onOk={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        okText="Сохранить"
                        cancelText="Отмена"
                    >
                        <Form
                            form={form}
                            layout="vertical"
                        >
                            <Form.Item
                                name="fullName"
                                label="ФИО"
                                rules={[{ required: true, message: 'Введите ФИО' }]}
                            >
                                <Input placeholder="Иванов Иван Иванович" />
                            </Form.Item>

                            <Form.Item
                                name="login"
                                label="Логин"
                                rules={[{ required: true, message: 'Введите логин' }]}
                            >
                                <Input placeholder="ivanov" />
                            </Form.Item>

                            {!editingEmployee && (
                                <Form.Item
                                    name="password"
                                    label="Пароль"
                                    rules={[{ required: true, message: 'Введите пароль' }]}
                                >
                                    <Input.Password placeholder="******" />
                                </Form.Item>
                            )}

                            <Form.Item
                                name="role"
                                label="Роль"
                                rules={[{ required: true, message: 'Выберите роль' }]}
                            >
                                <Select>
                                    <Select.Option value="Admin">Администратор</Select.Option>
                                    <Select.Option value="Director">Директор филиала</Select.Option>
                                    <Select.Option value="Baker">Повар</Select.Option>
                                    <Select.Option value="Cashier">Кассир</Select.Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="filialId"
                                label="Филиал"
                            >
                                <Select allowClear placeholder="Выберите филиал">
                                    {filials.map(f => (
                                        <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
};

export default Employees;