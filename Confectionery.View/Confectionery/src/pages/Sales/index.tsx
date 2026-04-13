import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Table, Button, InputNumber, message, Spin, Row, Col, Statistic } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined } from '@ant-design/icons';
import Sidebar from '../../components/Sidebar';
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
    const user = api.getCurrentUser();

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.filialId) {
                console.log('💰 Загрузка товаров для кассы, филиал:', user.filialId);
                const data = await api.getCashierProducts(user.filialId);
                console.log('💰 Получены товары:', data);
               
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
            console.log('💰 Оформление продажи:', {
                filialId: user.filialId,
                items: cart,
                total: totalAmount
            });

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

    const productColumns = [
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

    const cartColumns = [
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
                                <Card title="Товары в наличии">
                                    <Table 
                                        columns={productColumns} 
                                        dataSource={products} 
                                        rowKey="id"
                                        pagination={false}
                                    />
                                </Card>
                            </Col>
                            <Col span={10}>
                                <Card title="Корзина">
                                    <Table 
                                        columns={cartColumns} 
                                        dataSource={cart} 
                                        rowKey="id"
                                        pagination={false}
                                        locale={{ emptyText: 'Корзина пуста' }}
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