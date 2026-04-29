import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Input as AntInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
import { api } from '../../api/api';
import type { Employee } from '../../types';

const { Content } = Layout;
const { Option } = Select;

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

    const [searchText, setSearchText] = useState('');
    const [selectedFilial, setSelectedFilial] = useState<string>('all');

    const user = api.getCurrentUser();
    const isAdmin = user?.role === 'Admin';
    const isDirector = user?.role === 'Director';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, fils] = await Promise.all([
                api.getEmployees(),
                api.getFilials()
            ]);

            if (isDirector && user?.filialId) {
                const directorFilial = fils.find(f => f.id === user.filialId);
                const filteredEmps = emps.filter(e => e.filial === directorFilial?.name);
                setEmployees(filteredEmps);
            } else {
                setEmployees(emps);
            }

            setFilials(fils.map(f => ({ id: f.id, name: f.name })));
        } catch {
            message.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    }, [isDirector, user?.filialId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch = employee.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            employee.login.toLowerCase().includes(searchText.toLowerCase());
        let matchesFilial = true;
        if (isAdmin && selectedFilial !== 'all') {
            matchesFilial = employee.filial === selectedFilial;
        }
        return matchesSearch && matchesFilial;
    });

    const filialOptions = isAdmin
        ? Array.from(new Set(employees.map(e => e.filial))).filter(f => f)
        : [];

    const currentFilialName = isDirector && user?.filialId
        ? filials.find(f => f.id === user.filialId)?.name
        : null;

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
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Удалить сотрудника"
                        description="Вы уверены?"
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
        try {
            await api.deleteEmployee(id);
            message.success('Сотрудник удален');
            loadData();
        } catch {
            message.error('Ошибка при удалении');
        }
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h1>Сотрудники</h1>
                        <Space>
                            <ExportButtons
                                data={filteredEmployees}
                                columns={columns}
                                filename="Сотрудники"
                            />
                            {isAdmin && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                    Добавить сотрудника
                                </Button>
                            )}
                        </Space>
                    </div>

                    {isAdmin && (
                        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <AntInput
                                placeholder="Поиск по ФИО или логину..."
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: 300 }}
                                allowClear
                            />
                            <Select
                                placeholder="Все филиалы"
                                value={selectedFilial}
                                onChange={setSelectedFilial}
                                style={{ width: 200 }}
                                allowClear
                            >
                                <Option value="all">Все филиалы</Option>
                                {filialOptions.map(filial => (
                                    <Option key={filial} value={filial}>{filial}</Option>
                                ))}
                            </Select>
                            {(searchText || selectedFilial !== 'all') && (
                                <Button onClick={() => { setSearchText(''); setSelectedFilial('all'); }}>
                                    Сбросить фильтры
                                </Button>
                            )}
                        </div>
                    )}

                    {isDirector && currentFilialName && (
                        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#e6f7ff', borderRadius: 6 }}>
                            <span>📋 Показаны сотрудники филиала: <strong>{currentFilialName}</strong></span>
                        </div>
                    )}

                    <Table
                        columns={columns}
                        dataSource={filteredEmployees}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />

                    {isAdmin && (
                        <Modal
                            title={editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
                            open={isModalOpen}
                            onOk={handleSave}
                            onCancel={() => setIsModalOpen(false)}
                            okText="Сохранить"
                            cancelText="Отмена"
                        >
                            <Form form={form} layout="vertical">
                                <Form.Item name="fullName" label="ФИО" rules={[{ required: true }]}>
                                    <Input placeholder="Иванов Иван Иванович" />
                                </Form.Item>
                                <Form.Item name="login" label="Логин" rules={[{ required: true }]}>
                                    <Input placeholder="ivanov" />
                                </Form.Item>
                                {!editingEmployee && (
                                    <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
                                        <Input.Password placeholder="******" />
                                    </Form.Item>
                                )}
                                <Form.Item name="role" label="Роль" rules={[{ required: true }]}>
                                    <Select>
                                        <Option value="Admin">Администратор</Option>
                                        <Option value="Director">Директор филиала</Option>
                                        <Option value="Baker">Повар</Option>
                                        <Option value="Cashier">Кассир</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="filialId" label="Филиал">
                                    <Select allowClear placeholder="Выберите филиал">
                                        {filials.map(f => (
                                            <Option key={f.id} value={f.id}>{f.name}</Option>
                                        ))}
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

export default Employees;