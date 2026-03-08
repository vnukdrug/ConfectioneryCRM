import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Row, Col, DatePicker, Select, Table, Statistic, Spin, message } from 'antd';
import { DollarOutlined, ShoppingOutlined, RiseOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api/api';
import type { SalesByDay, SalesByFilial, TopProduct, ReportFilter } from '../../types';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportsProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Reports: React.FC<ReportsProps> = ({ collapsed, onCollapse }) => {
    const [loading, setLoading] = useState(false);
    const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
    const [filter, setFilter] = useState<ReportFilter>({
        startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD')
    });
    const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([]);
    const [salesByFilial, setSalesByFilial] = useState<SalesByFilial[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [summary, setSummary] = useState({ totalRevenue: 0, ordersCount: 0, averageCheck: 0 });

    const loadFilials = useCallback(async () => {
        try {
            const data = await api.getFilials();
            setFilials(data.map(f => ({ id: f.id, name: f.name })));
        } catch (error) {
            console.error('Ошибка загрузки филиалов:', error);
            message.error('Ошибка загрузки филиалов');
        }
    }, []);

    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📊 Загрузка отчетов с фильтром:', filter);
            
            const [byDay, byFilial, products, summaryData] = await Promise.all([
                api.getSalesByDay(filter),
                api.getSalesByFilial(filter),
                api.getTopProducts(filter),
                api.getReportSummary(filter)
            ]);
            
            setSalesByDay(byDay);
            setSalesByFilial(byFilial);
            setTopProducts(products);
            setSummary(summaryData);
        } catch (error) {
            console.error('Ошибка загрузки отчетов:', error);
            message.error('Ошибка загрузки отчетов');
        } finally {
            setLoading(false);
        }
    }, [filter]); // 👈 Зависимости от конкретных полей, а не от всего объекта

    useEffect(() => {
        loadFilials();
    }, [loadFilials]);

    useEffect(() => {
        if (filter.startDate && filter.endDate) {
            loadReports();
        }
    }, [filter.startDate, filter.endDate, filter.filialId, loadReports]); // 👈 Зависимости от конкретных полей

    const handleDateChange = (
        _: RangePickerProps['value'], 
        dateStrings: [string, string]
    ) => {
        setFilter(prev => ({
            ...prev,
            startDate: dateStrings[0] || undefined,
            endDate: dateStrings[1] || undefined
        }));
    };

    const handleFilialChange = (value: number | 'all') => {
        setFilter(prev => ({
            ...prev,
            filialId: value === 'all' ? undefined : value
        }));
    };

    const salesByDayColumns = [
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
        },
        {
            title: 'Продажи',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => `${total.toLocaleString()} ₽`,
        },
        {
            title: 'Количество заказов',
            dataIndex: 'ordersCount',
            key: 'ordersCount',
        },
    ];

    const salesByFilialColumns = [
        {
            title: 'Филиал',
            dataIndex: 'filial',
            key: 'filial',
        },
        {
            title: 'Выручка',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => `${total.toLocaleString()} ₽`,
        },
        {
            title: 'Заказы',
            dataIndex: 'ordersCount',
            key: 'ordersCount',
        },
    ];

    const topProductsColumns = [
        {
            title: 'Товар',
            dataIndex: 'product',
            key: 'product',
        },
        {
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Выручка',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => `${total.toLocaleString()} ₽`,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <h1>Отчеты</h1>
                    
                    {/* Фильтры */}
                    <Card style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <RangePicker 
                                    style={{ width: '100%' }} 
                                    onChange={handleDateChange}
                                    defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
                                    placeholder={['Начало периода', 'Конец периода']}
                                />
                            </Col>
                            <Col span={6}>
                                <Select 
                                    placeholder="Все филиалы" 
                                    style={{ width: '100%' }} 
                                    onChange={handleFilialChange}
                                    allowClear
                                >
                                    <Option value="all">Все филиалы</Option>
                                    {filials.map(f => (
                                        <Option key={f.id} value={f.id}>{f.name}</Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>
                    </Card>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" tip="Загрузка отчетов..." />
                        </div>
                    ) : (
                        <>
                            {/* Сводка */}
                            <Row gutter={16} style={{ marginBottom: 24 }}>
                                <Col span={8}>
                                    <Card>
                                        <Statistic
                                            title="Общая выручка"
                                            value={summary.totalRevenue}
                                            precision={2}
                                            prefix={<DollarOutlined />}
                                            suffix="₽"
                                        />
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card>
                                        <Statistic
                                            title="Количество заказов"
                                            value={summary.ordersCount}
                                            prefix={<ShoppingOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card>
                                        <Statistic
                                            title="Средний чек"
                                            value={summary.averageCheck}
                                            precision={2}
                                            prefix={<RiseOutlined />}
                                            suffix="₽"
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* Продажи по дням */}
                            <Card title="Продажи по дням" style={{ marginBottom: 24 }}>
                                <Table 
                                    columns={salesByDayColumns} 
                                    dataSource={salesByDay} 
                                    rowKey="date"
                                    pagination={false}
                                    size="small"
                                />
                            </Card>

                            {/* Две колонки */}
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Card title="Продажи по филиалам">
                                        <Table 
                                            columns={salesByFilialColumns} 
                                            dataSource={salesByFilial} 
                                            rowKey="filial"
                                            pagination={false}
                                            size="small"
                                        />
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card title="Топ-10 товаров">
                                        <Table 
                                            columns={topProductsColumns} 
                                            dataSource={topProducts} 
                                            rowKey="product"
                                            pagination={false}
                                            size="small"
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Reports;