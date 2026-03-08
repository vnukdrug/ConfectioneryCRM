export interface AuthResponse {
    id: number;
    fullName: string;
    login: string;
    role: 'Admin' | 'Director' | 'Baker' | 'Cashier';
    filialId?: number;
    token: string;
}
export interface DashboardStats {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    filialsCount: number;
    employeesCount: number;
    totalProducts: number;
    lowStockCount: number;
}

export interface LowStockItem {
    id: number;
    filial: string;
    product: string;
    quantity: number;
    unit: string;
    minStock: number;
}
export interface ReportFilter {
    startDate?: string;
    endDate?: string;
    filialId?: number;
}

export interface SalesByDay {
    date: string;
    total: number;
    ordersCount: number;
}

export interface SalesByFilial {
    filial: string;
    total: number;
    ordersCount: number;
}

export interface TopProduct {
    product: string;
    quantity: number;
    total: number;
}
export interface RecentSale {
    id: number;
    filial: string;
    amount: number;
    date: string;
    cashier: string;
}
export interface Employee {
  id: number;
  fullName: string;
  login: string;
  role: 'Admin' | 'Director' | 'Baker' | 'Cashier';
  filial: string;
}

export interface CreateEmployeeDto {
  fullName: string;
  login: string;
  password: string;
  role: string;
  filialId?: number;
}

export interface Filial {
    id: number;
    name: string;
    address: string;
    phone: string;
    employeesCount: number;
}

export interface WarehouseItem {
    id: number;
    filial: string;
    product: string;
    category: string;
    categoryType: 'product' | 'ingredient';
    quantity: number;
    unit: string;
    minStock: number;
}

export interface StockMovement {
    id?: number;
    filialId: number;
    productId: number;
    quantity: number;
    movementType: 'income' | 'outcome' | 'transfer';
    createdAt?: string;
}
// Добавь в файл types/index.ts

export interface PlanItem {
    id: number;
    product: string;
    plannedQuantity: number;
    producedQuantity: number;
    status: 'planned' | 'in_progress' | 'completed';
    deadline: string;
}

// Добавляем или обновляем эти интерфейсы

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
}

export interface SaleDto {
    filialId: number;
    items: {
        productId: number;
        quantity: number;
        price: number;
        total: number;
    }[];
    total: number;
}
export interface Category {
    id: number;
    name: string;
    type: 'product' | 'ingredient';
}

export interface Product {
    id: number;
    name: string;
    categoryId: number;
    category: string;
    categoryType: 'product' | 'ingredient';
    unit: string;
    price: number;
    minStock: number;
    quantity?: number; // Добавляем опциональное поле для остатка
}

// Добавляем отдельный интерфейс для товаров в кассе
export interface CashierProduct {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export interface CreatePlanDto {
    filialId: number;
    productId: number;
    quantity: number;
    planDate: string;  // или Date
}