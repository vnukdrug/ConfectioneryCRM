import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Card, Statistic, Row, Col, Table, Typography, Spin, Button, Space, Tooltip, message } from 'antd';
import {
    DollarOutlined,
    ShopOutlined,
    TeamOutlined,
    ShoppingOutlined,
    WarningOutlined,
    FileExcelOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api';
import type { DashboardStats, LowStockItem, RecentSale, SalesByDay, SalesByFilial } from '../../types';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const { Content } = Layout;
const { Title, Text } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

interface AdminDashboardProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ collapsed, onCollapse }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
    const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([]);
    const [salesByFilial, setSalesByFilial] = useState<SalesByFilial[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const filter = {};
            const [statsData, lowStockData, recentSalesData, byDayData, byFilialData] = await Promise.all([
                api.getDashboardStats(),
                api.getLowStock(),
                api.getRecentSales(),
                api.getSalesByDay(filter),
                api.getSalesByFilial(filter)
            ]);
            setStats(statsData);
            setLowStock(lowStockData);
            setRecentSales(recentSalesData);
            setSalesByDay(byDayData);
            setSalesByFilial(byFilialData);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Экспорт в PDF
    const exportToPDF = async () => {
        if (!dashboardRef.current) return;

        setExporting(true);
        try {
            const element = dashboardRef.current;
            const opt = {
                margin: [10, 10, 10, 10] as [number, number, number, number],
                filename: `SweetCRM_Отчет_${new Date().toLocaleDateString('ru-RU')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(element).save();
            message.success('Отчёт успешно сохранён в PDF');
        } catch (error) {
            console.error('Ошибка экспорта в PDF:', error);
            message.error('Ошибка при создании PDF');
        } finally {
            setExporting(false);
        }
    };

    // Экспорт в Excel
    const exportToExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();

            // 1. Лист с продажами по дням
            const salesByDayData = salesByDay.map(item => ({
                'Дата': new Date(item.date).toLocaleDateString('ru-RU'),
                'Выручка (₽)': item.total,
                'Количество заказов': item.ordersCount
            }));
            const salesByDaySheet = XLSX.utils.json_to_sheet(salesByDayData);
            XLSX.utils.book_append_sheet(workbook, salesByDaySheet, 'Продажи по дням');

            // 2. Лист с продажами по филиалам
            const salesByFilialData = salesByFilial.map(item => ({
                'Филиал': item.filial,
                'Выручка (₽)': item.total,
                'Количество заказов': item.ordersCount
            }));
            const salesByFilialSheet = XLSX.utils.json_to_sheet(salesByFilialData);
            XLSX.utils.book_append_sheet(workbook, salesByFilialSheet, 'Продажи по филиалам');

            // 3. Лист с критическими остатками
            const lowStockData = lowStock.map(item => ({
                'Филиал': item.filial,
                'Товар': item.product,
                'Остаток': `${item.quantity} ${item.unit}`,
                'Мин. остаток': `${item.minStock} ${item.unit}`
            }));
            const lowStockSheet = XLSX.utils.json_to_sheet(lowStockData);
            XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Критические остатки');

            // 4. Лист с последними продажами
            const recentSalesData = recentSales.map(item => ({
                'Филиал': item.filial,
                'Сумма (₽)': item.amount,
                'Кассир': item.cashier,
                'Время': new Date(item.date).toLocaleString('ru-RU')
            }));
            const recentSalesSheet = XLSX.utils.json_to_sheet(recentSalesData);
            XLSX.utils.book_append_sheet(workbook, recentSalesSheet, 'Последние продажи');

            // 5. Лист со сводной статистикой
            const statsData = [{
                'Показатель': 'Выручка сегодня (₽)',
                'Значение': stats?.todayRevenue || 0
            }, {
                'Показатель': 'Выручка за неделю (₽)',
                'Значение': stats?.weekRevenue || 0
            }, {
                'Показатель': 'Выручка за месяц (₽)',
                'Значение': stats?.monthRevenue || 0
            }, {
                'Показатель': 'Количество филиалов',
                'Значение': stats?.filialsCount || 0
            }, {
                'Показатель': 'Количество сотрудников',
                'Значение': stats?.employeesCount || 0
            }, {
                'Показатель': 'Товары на складе',
                'Значение': stats?.totalProducts || 0
            }, {
                'Показатель': 'Позиций с низким остатком',
                'Значение': stats?.lowStockCount || 0
            }];
            const statsSheet = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'Сводная статистика');

            XLSX.writeFile(workbook, `SweetCRM_Данные_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
            message.success('Данные успешно экспортированы в Excel');
        } catch (error) {
            console.error('Ошибка экспорта в Excel:', error);
            message.error('Ошибка при экспорте данных');
        }
    };

    const lowStockColumns = [
        {
            title: 'Филиал',
            dataIndex: 'filial',
            key: 'filial',
        },
        {
            title: 'Товар',
            dataIndex: 'product',
            key: 'product',
        },
        {
            title: 'Остаток',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number, record: LowStockItem) => (
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                    {quantity} {record.unit} / мин. {record.minStock} {record.unit}
                </span>
            ),
        },
    ];

    const recentSalesColumns = [
        {
            title: 'Филиал',
            dataIndex: 'filial',
            key: 'filial',
        },
        {
            title: 'Сумма',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `${amount.toLocaleString()} ₽`,
        },
        {
            title: 'Кассир',
            dataIndex: 'cashier',
            key: 'cashier',
        },
        {
            title: 'Время',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleString('ru-RU'),
        },
    ];

    const salesChartData = salesByDay.map(item => ({
        date: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        sales: item.total,
        orders: item.ordersCount
    }));

    const pieData = salesByFilial.map(item => ({
        name: item.filial,
        value: item.total
    }));

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
                <Layout style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" tip="Загрузка данных..." />
                </Layout>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={2}>Главная</Title>
                        <Space>
                            <Tooltip title="Экспорт в PDF (с графиками)">
                                <Button
                                    icon={<FilePdfOutlined />}
                                    onClick={exportToPDF}
                                    loading={exporting}
                                    style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                                >
                                    PDF
                                </Button>
                            </Tooltip>
                            <Tooltip title="Экспорт в Excel (только данные)">
                                <Button
                                    icon={<FileExcelOutlined />}
                                    onClick={exportToExcel}
                                    style={{ color: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Excel
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>

                    {/* Контент для экспорта в PDF */}
                    <div ref={dashboardRef}>
                        {/* Карточки со статистикой */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic
                                        title="Выручка сегодня"
                                        value={stats?.todayRevenue || 0}
                                        precision={2}
                                        valueStyle={{ color: '#3f8600' }}
                                        prefix={<DollarOutlined />}
                                        suffix="₽"
                                    />
                                    <Text type="secondary">За неделю: {stats?.weekRevenue.toLocaleString()} ₽</Text>
                                    <br />
                                    <Text type="secondary">За месяц: {stats?.monthRevenue.toLocaleString()} ₽</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic
                                        title="Филиалы"
                                        value={stats?.filialsCount || 0}
                                        valueStyle={{ color: '#1890ff' }}
                                        prefix={<ShopOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic
                                        title="Сотрудники"
                                        value={stats?.employeesCount || 0}
                                        valueStyle={{ color: '#722ed1' }}
                                        prefix={<TeamOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Statistic
                                        title="Товары на складе"
                                        value={stats?.totalProducts || 0}
                                        prefix={<ShoppingOutlined />}
                                    />
                                    {stats?.lowStockCount ? (
                                        <Text type="danger">
                                            <WarningOutlined /> {stats.lowStockCount} позиций с низким остатком
                                        </Text>
                                    ) : null}
                                </Card>
                            </Col>
                        </Row>

                        {/* График продаж по дням */}
                        <Card title="Динамика продаж" style={{ marginBottom: 24 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" name="Выручка (₽)" />
                                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Кол-во заказов" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Продажи по филиалам и топ товаров */}
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <Card title="Продажи по филиалам">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={(entry) => `${entry.name}: ${entry.value.toLocaleString()} ₽`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text type="secondary">Нет данных</Text>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="Топ товаров">
                                    {salesByFilial.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={salesByFilial.slice(0, 5)}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="filial" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar dataKey="total" fill="#8884d8" name="Выручка" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text type="secondary">Нет данных</Text>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* Критические остатки и последние продажи */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Card
                                    title="Критические остатки"
                                    extra={lowStock.length > 0 ? <Text type="danger">{lowStock.length} позиций</Text> : null}
                                >
                                    <Table
                                        columns={lowStockColumns}
                                        dataSource={lowStock}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="Последние продажи">
                                    <Table
                                        columns={recentSalesColumns}
                                        dataSource={recentSales}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;