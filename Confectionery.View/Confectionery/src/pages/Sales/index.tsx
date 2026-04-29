import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Table, Button, InputNumber, message, Spin, Row, Col, Statistic, Input } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
import ExportButtons from '../../components/ExportButtons';
import { api } from '../../api/api';
import type { CartItem, CashierProduct } from '../../types';

const { Content } = Layout;

interface SalesProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Sales: React.FC<SalesProps> = ({ collapsed, onCollapse }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<CashierProduct[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearchText, setProductSearchText] = useState('');
    const [cartSearchText, setCartSearchText] = useState('');
    const user = api.getCurrentUser();

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.filialId) {
                const data = await api.getCashierProducts(user.filialId);
                setProducts(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            message.error('Ошибка загрузки товаров');
        } finally {
            setLoading(false);
        }
    }, [user?.filialId]);

    useEffect(() => {
        if (user?.filialId) {
            loadProducts();
        }
    }, [user?.filialId, loadProducts]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(productSearchText.toLowerCase())
    );

    const filteredCart = cart.filter(item =>
        item.name.toLowerCase().includes(cartSearchText.toLowerCase())
    );

    const addToCart = (product: CashierProduct) => {
        if (product.quantity <= 0) {
            message.warning('Товара нет в наличии');
            return;
        }
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity + 1 > product.quantity) {
                message.warning(`Нельзя добавить больше ${product.quantity} шт.`);
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                    : item
            ));
        } else {
            setCart([...cart, {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                total: product.price
            }]);
        }
        message.success(`${product.name} добавлен в корзину`);
    };

    const removeFromCart = (id: number) => {
        const product = cart.find(item => item.id === id);
        setCart(cart.filter(item => item.id !== id));
        if (product) {
            message.info(`${product.name} удален из корзины`);
        }
    };

    const updateQuantity = (id: number, value: number | null) => {
        const newQuantity = value || 1;
        const item = cart.find(item => item.id === id);
        const product = products.find(p => p.id === id);
        if (newQuantity <= 0) {
            removeFromCart(id);
        } else if (item && product) {
            if (newQuantity > product.quantity) {
                message.warning(`Нельзя добавить больше ${product.quantity} шт.`);
                return;
            }
            setCart(cart.map(item =>
                item.id === id
                    ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
                    : item
            ));
        }
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            message.warning('Корзина пуста');
            return;
        }
        if (!user?.filialId) {
            message.error('Филиал не определен');
            return;
        }
        try {
            const saleData = {
                filialId: user.filialId,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })),
                total: totalAmount
            };
            await api.createSale(saleData);
            message.success(`Продажа оформлена на сумму ${totalAmount} ₽!`);
            setCart([]);
            loadProducts();
        } catch (error) {
            console.error('Ошибка при оформлении:', error);
            message.error('Ошибка при оформлении продажи');
        }
    };

    // Колонки для отображения товаров на странице (с кнопкой "Добавить")
    const productDisplayColumns = [
        {
            title: 'Товар',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `${price} ₽`,
        },
        {
            title: 'В наличии',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number) => (
                <span style={{ color: quantity === 0 ? '#ff4d4f' : 'inherit' }}>
                    {quantity}
                </span>
            ),
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: CashierProduct) => (
                <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => addToCart(record)}
                    disabled={record.quantity === 0}
                >
                    Добавить
                </Button>
            ),
        },
    ];

    // Колонки для экспорта товаров (без кнопки "Добавить")
    const productExportColumns = [
        { title: 'Товар', dataIndex: 'Товар' },
        { title: 'Цена', dataIndex: 'Цена' },
        { title: 'В наличии', dataIndex: 'В наличии' },
    ];

    // Колонки для отображения корзины на странице (с кнопками управления)
    const cartDisplayColumns = [
        {
            title: 'Товар',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `${price} ₽`,
        },
        {
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number, record: CartItem) => {
                const maxQuantity = products.find(p => p.id === record.id)?.quantity || 99;
                return (
                    <InputNumber
                        min={1}
                        max={maxQuantity}
                        value={quantity}
                        onChange={(value) => updateQuantity(record.id, value)}
                    />
                );
            },
        },
        {
            title: 'Сумма',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => `${total} ₽`,
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: unknown, record: CartItem) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(record.id)}
                />
            ),
        },
    ];

    // Колонки для экспорта корзины (без кнопок)
    const cartExportColumns = [
        { title: 'Товар', dataIndex: 'Товар' },
        { title: 'Цена', dataIndex: 'Цена' },
        { title: 'Количество', dataIndex: 'Количество' },
        { title: 'Сумма', dataIndex: 'Сумма' },
    ];

    // Подготовка данных для экспорта товаров
    const productExportData = filteredProducts.map(item => ({
        'Товар': item.name,
        'Цена': `${item.price} ₽`,
        'В наличии': item.quantity,
    }));

    // Подготовка данных для экспорта корзины
    const cartExportData = filteredCart.map(item => ({
        'Товар': item.name,
        'Цена': `${item.price} ₽`,
        'Количество': item.quantity,
        'Сумма': `${item.total} ₽`,
    }));

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={onCollapse} />
            <Layout>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <h1>Касса</h1>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" tip="Загрузка товаров..." />
                        </div>
                    ) : (
                        <Row gutter={24}>
                            <Col span={14}>
                                <Card
                                    title="Товары в наличии"
                                    extra={
                                        <ExportButtons
                                            data={productExportData}
                                            columns={productExportColumns}
                                            filename="Товары_в_наличии"
                                        />
                                    }
                                >
                                    <Input
                                        placeholder="Поиск товара..."
                                        prefix={<SearchOutlined />}
                                        value={productSearchText}
                                        onChange={(e) => setProductSearchText(e.target.value)}
                                        style={{ width: '100%', marginBottom: 16 }}
                                        allowClear
                                    />
                                    <Table
                                        columns={productDisplayColumns}
                                        dataSource={filteredProducts}
                                        rowKey="id"
                                        pagination={{ pageSize: 10 }}
                                    />
                                </Card>
                            </Col>
                            <Col span={10}>
                                <Card
                                    title="Корзина"
                                    extra={
                                        cart.length > 0 && (
                                            <ExportButtons
                                                data={cartExportData}
                                                columns={cartExportColumns}
                                                filename="Корзина"
                                            />
                                        )
                                    }
                                >
                                    <Input
                                        placeholder="Поиск в корзине..."
                                        prefix={<SearchOutlined />}
                                        value={cartSearchText}
                                        onChange={(e) => setCartSearchText(e.target.value)}
                                        style={{ width: '100%', marginBottom: 16 }}
                                        allowClear
                                    />
                                    <Table
                                        columns={cartDisplayColumns}
                                        dataSource={filteredCart}
                                        rowKey="id"
                                        pagination={false}
                                        locale={{ emptyText: cartSearchText ? 'Ничего не найдено' : 'Корзина пуста' }}
                                    />
                                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                                        <Statistic
                                            title="Итого"
                                            value={totalAmount}
                                            suffix="₽"
                                        />
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleCheckout}
                                            style={{ marginTop: 16 }}
                                            disabled={cart.length === 0}
                                        >
                                            Оформить продажу
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Sales;