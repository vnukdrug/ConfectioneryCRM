import type { 
    Employee, 
    CreateEmployeeDto, 
    Filial, 
    WarehouseItem, 
    Product, 
    Category,
    StockMovement, 
    AuthResponse, 
    DashboardStats, 
    LowStockItem, 
    RecentSale, 
    SalesByDay, 
    SalesByFilial, 
    TopProduct, 
    ReportFilter,
    PlanItem,
    SaleDto,
    CreatePlanDto,
    CashierProduct
} from '../types';

const API_BASE_URL = 'https://localhost:7239/api';

// Функция для добавления токена в заголовки
const getHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token ? token.substring(0, 20) + '...' : '❌ No token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    // 👥 СОТРУДНИКИ (добавляем метод для обновления филиала)
updateUserFilial: async (userId: number, filialId: number | null): Promise<void> => {
    console.log('👥 Обновление филиала пользователя:', { userId, filialId });
    const response = await fetch(`${API_BASE_URL}/users/${userId}/filial`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ filialId })
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении филиала');
    }
},
    // 🔐 АВТОРИЗАЦИЯ
    login: async (login: string, password: string): Promise<AuthResponse> => {
        console.log('🔐 Попытка входа:', login);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка входа');
        }
        
        const data = await response.json();
        console.log('✅ Успешный вход:', data);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    },
    
    logout: () => {
        console.log('🚪 Выход из системы');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuth');
    },
    
    getCurrentUser: (): AuthResponse | null => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        console.log('👤 Текущий пользователь:', user);
        return user;
    },

    // 👥 СОТРУДНИКИ
    getEmployees: async (): Promise<Employee[]> => {
        console.log('👥 Запрос к /employees');
        const response = await fetch(`${API_BASE_URL}/employees`, {
            headers: getHeaders()
        });
        console.log('👥 Ответ от /employees:', response.status);
        if (!response.ok) throw new Error('Ошибка загрузки сотрудников');
        const data = await response.json();
        console.log('👥 Данные сотрудников:', data);
        return data;
    },

    createEmployee: async (data: CreateEmployeeDto): Promise<Employee> => {
        console.log('👥 Создание сотрудника:', data);
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.message || 'Логин уже занят');
        }
        
        if (!response.ok) {
            throw new Error('Ошибка при создании сотрудника');
        }
        
        const result = await response.json();
        console.log('👥 Сотрудник создан:', result);
        return result;
    },

    updateEmployee: async (id: number, data: CreateEmployeeDto): Promise<void> => {
        console.log('👥 Обновление сотрудника ID:', id, data);
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении сотрудника');
        }
        console.log('👥 Сотрудник обновлен');
    },

    deleteEmployee: async (id: number): Promise<void> => {
        console.log('👥 Удаление сотрудника ID:', id);
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении сотрудника');
        }
        console.log('👥 Сотрудник удален');
    },

    // 🏢 ФИЛИАЛЫ
    getFilials: async (): Promise<Filial[]> => {
        console.log('🏢 Запрос к /filials');
        const response = await fetch(`${API_BASE_URL}/filials`, {
            headers: getHeaders()
        });
        console.log('🏢 Ответ от /filials:', response.status);
        if (!response.ok) {
            throw new Error('Ошибка загрузки филиалов');
        }
        const data = await response.json();
        console.log('🏢 Данные филиалов:', data);
        return data;
    },

    createFilial: async (data: Omit<Filial, 'id' | 'employeesCount'>): Promise<Filial> => {
        console.log('🏢 Создание филиала:', data);
        const response = await fetch(`${API_BASE_URL}/filials`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.message || 'Филиал с таким названием уже существует');
        }
        
        if (!response.ok) {
            throw new Error('Ошибка при создании филиала');
        }
        
        const result = await response.json();
        console.log('🏢 Филиал создан:', result);
        return result;
    },

    updateFilial: async (id: number, data: Partial<Filial>): Promise<void> => {
        console.log('🏢 Обновление филиала ID:', id, data);
        const response = await fetch(`${API_BASE_URL}/filials/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.message || 'Филиал с таким названием уже существует');
        }
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении филиала');
        }
        console.log('🏢 Филиал обновлен');
    },

    deleteFilial: async (id: number): Promise<void> => {
        console.log('🏢 Удаление филиала ID:', id);
        const response = await fetch(`${API_BASE_URL}/filials/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.status === 400) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при удалении');
        }
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении филиала');
        }
        console.log('🏢 Филиал удален');
    },

    // 📦 ТОВАРЫ (общие)
    getAllProducts: async (): Promise<Product[]> => {
        console.log('📦 Запрос к /products');
        const response = await fetch(`${API_BASE_URL}/products`, {
            headers: getHeaders()
        });
        console.log('📦 Ответ от /products:', response.status);
        if (!response.ok) throw new Error('Ошибка загрузки товаров');
        const data = await response.json();
        console.log('📦 Данные товаров:', data);
        return data;
    },

    getCategories: async (): Promise<Category[]> => {
        console.log('🏷️ Запрос к /categories');
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: getHeaders()
        });
        console.log('🏷️ Ответ от /categories:', response.status);
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        const data = await response.json();
        console.log('🏷️ Данные категорий:', data);
        return data;
    },

    createProduct: async (data: Omit<Product, 'id'>): Promise<Product> => {
        console.log('📦 Создание товара:', data);
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Ошибка при создании товара');
        const result = await response.json();
        console.log('📦 Товар создан:', result);
        return result;
    },

    updateProduct: async (id: number, data: Partial<Product>): Promise<void> => {
        console.log('📦 Обновление товара ID:', id, data);
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Ошибка при обновлении товара');
        console.log('📦 Товар обновлен');
    },

    deleteProduct: async (id: number): Promise<void> => {
        console.log('📦 Удаление товара ID:', id);
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Ошибка при удалении товара');
        console.log('📦 Товар удален');
    },

    // 🏷️ КАТЕГОРИИ
    createCategory: async (data: Omit<Category, 'id'>): Promise<Category> => {
        console.log('🏷️ Создание категории:', data);
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Ошибка при создании категории');
        const result = await response.json();
        console.log('🏷️ Категория создана:', result);
        return result;
    },

    updateCategory: async (id: number, data: Partial<Category>): Promise<void> => {
        console.log('🏷️ Обновление категории ID:', id, data);
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Ошибка при обновлении категории');
        console.log('🏷️ Категория обновлена');
    },

    deleteCategory: async (id: number): Promise<void> => {
        console.log('🏷️ Удаление категории ID:', id);
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при удалении');
        }
        console.log('🏷️ Категория удалена');
    },

    // 📦 СКЛАД
    getWarehouse: async (filialId?: number): Promise<WarehouseItem[]> => {
        const url = filialId 
            ? `${API_BASE_URL}/stock/balances?filialId=${filialId}`
            : `${API_BASE_URL}/stock/balances`;
        console.log('📦 Запрос к складу:', url);
        const response = await fetch(url, {
            headers: getHeaders()
        });
        console.log('📦 Ответ от склада:', response.status);
        if (!response.ok) {
            throw new Error('Ошибка загрузки остатков');
        }
        const data = await response.json();
        console.log('📦 Данные склада:', data);
        return data;
    },

    getStockProducts: async (): Promise<Product[]> => {
        console.log('📦 Запрос к /stock/products');
        const response = await fetch(`${API_BASE_URL}/stock/products`, {
            headers: getHeaders()
        });
        console.log('📦 Ответ от /stock/products:', response.status);
        if (!response.ok) {
            throw new Error('Ошибка загрузки товаров');
        }
        const data = await response.json();
        console.log('📦 Данные товаров склада:', data);
        return data;
    },

    createStockMovement: async (data: Omit<StockMovement, 'id' | 'createdAt'>): Promise<void> => {
        console.log('📦 Создание движения товара:', data);
        const response = await fetch(`${API_BASE_URL}/stock/movement`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при оформлении прихода');
        }
        console.log('📦 Движение товара создано');
    },

   // 📊 ГЛАВНАЯ
getDashboardStats: async (filialId?: number): Promise<DashboardStats> => {
    const url = filialId 
        ? `${API_BASE_URL}/dashboard/stats?filialId=${filialId}`
        : `${API_BASE_URL}/dashboard/stats`;
    console.log('📊 Запрос к /dashboard/stats для филиала:', filialId || 'все');
    const response = await fetch(url, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки статистики');
    return response.json();
},

getLowStock: async (filialId?: number): Promise<LowStockItem[]> => {
    const url = filialId 
        ? `${API_BASE_URL}/dashboard/low-stock?filialId=${filialId}`
        : `${API_BASE_URL}/dashboard/low-stock`;
    console.log('⚠️ Запрос к /dashboard/low-stock для филиала:', filialId || 'все');
    const response = await fetch(url, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки критических остатков');
    return response.json();
},

getRecentSales: async (filialId?: number): Promise<RecentSale[]> => {
    const url = filialId 
        ? `${API_BASE_URL}/dashboard/recent-sales?filialId=${filialId}`
        : `${API_BASE_URL}/dashboard/recent-sales`;
    console.log('🛒 Запрос к /dashboard/recent-sales для филиала:', filialId || 'все');
    const response = await fetch(url, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки последних продаж');
    return response.json();
},
   // 📈 ОТЧЕТЫ
getSalesByDay: async (filter: ReportFilter): Promise<SalesByDay[]> => {
    console.log('📈 Запрос к /reports/sales-by-day с фильтром:', filter);
    const response = await fetch(`${API_BASE_URL}/reports/sales-by-day`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(filter)
    });
    console.log('📈 Ответ от /reports/sales-by-day:', response.status);
    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Ошибка:', error);
        throw new Error('Ошибка загрузки отчета по дням');
    }
    const data = await response.json();
    console.log('📈 Данные:', data);
    return data;
},

getSalesByFilial: async (filter: ReportFilter): Promise<SalesByFilial[]> => {
    console.log('📈 Запрос к /reports/sales-by-filial с фильтром:', filter);
    const response = await fetch(`${API_BASE_URL}/reports/sales-by-filial`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(filter)
    });
    console.log('📈 Ответ от /reports/sales-by-filial:', response.status);
    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Ошибка:', error);
        throw new Error('Ошибка загрузки отчета по филиалам');
    }
    const data = await response.json();
    console.log('📈 Данные:', data);
    return data;
},

getTopProducts: async (filter: ReportFilter): Promise<TopProduct[]> => {
    console.log('📈 Запрос к /reports/top-products с фильтром:', filter);
    const response = await fetch(`${API_BASE_URL}/reports/top-products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(filter)
    });
    console.log('📈 Ответ от /reports/top-products:', response.status);
    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Ошибка:', error);
        throw new Error('Ошибка загрузки топ товаров');
    }
    const data = await response.json();
    console.log('📈 Данные:', data);
    return data;
},

getReportSummary: async (filter: ReportFilter): Promise<{ totalRevenue: number; ordersCount: number; averageCheck: number }> => {
    console.log('📈 Запрос к /reports/summary с фильтром:', filter);
    const response = await fetch(`${API_BASE_URL}/reports/summary`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(filter)
    });
    console.log('📈 Ответ от /reports/summary:', response.status);
    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Ошибка:', error);
        throw new Error('Ошибка загрузки сводки');
    }
    const data = await response.json();
    console.log('📈 Данные:', data);
    return data;
},

    // 🧑‍🍳 ДЛЯ ПОВАРА (Baker)
    getAvailableProducts: async (filialId: number): Promise<Product[]> => {
        console.log('🧑‍🍳 Запрос к /baker/available-products/${filialId}');
        const response = await fetch(`${API_BASE_URL}/baker/available-products/${filialId}`, {
            headers: getHeaders()
        });
        console.log('🧑‍🍳 Ответ от /baker/available-products:', response.status);
        if (!response.ok) throw new Error('Ошибка загрузки товаров для выпечки');
        const data = await response.json();
        console.log('🧑‍🍳 Данные товаров для выпечки:', data);
        return data;
    },

    createPlan: async (data: CreatePlanDto): Promise<void> => {
        console.log('📅 Создание плана выпечки:', data);
        const response = await fetch(`${API_BASE_URL}/baker/create-plan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        console.log('📅 Ответ от /baker/create-plan:', response.status);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при создании плана');
        }
        console.log('📅 План создан успешно');
    },

    getBakerPlan: async (filialId: number): Promise<PlanItem[]> => {
        console.log('📅 Запрос к /baker/plan/${filialId}');
        const response = await fetch(`${API_BASE_URL}/baker/plan/${filialId}`, {
            headers: getHeaders()
        });
        console.log('📅 Ответ от /baker/plan:', response.status);
        if (!response.ok) throw new Error('Ошибка загрузки плана выпечки');
        const data = await response.json();
        console.log('📅 Данные плана выпечки:', data);
        return data;
    },

    markAsDone: async (planId: number): Promise<void> => {
        console.log('✅ Отметка выполнения плана ID:', planId);
        const response = await fetch(`${API_BASE_URL}/baker/done/${planId}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        console.log('✅ Ответ от /baker/done:', response.status);
        if (!response.ok) throw new Error('Ошибка при отметке выполнения');
        console.log('✅ План отмечен как выполненный');
    },

   // 💰 ДЛЯ КАССИРА (Cashier)
getCashierProducts: async (filialId: number): Promise<CashierProduct[]> => {
    console.log('💰 Запрос к /cashier/products/${filialId}');
    const response = await fetch(`${API_BASE_URL}/cashier/products/${filialId}`, {
        headers: getHeaders()
    });
    console.log('💰 Ответ от /cashier/products:', response.status);
    if (!response.ok) throw new Error('Ошибка загрузки товаров');
    const data = await response.json();
    console.log('💰 Данные товаров для кассы:', data);
    return data;
},

createSale: async (data: SaleDto): Promise<void> => {  // 👈 Заменяем any на SaleDto
    console.log('💰 Отправка продажи:', data);
    const response = await fetch(`${API_BASE_URL}/cashier/sale`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при оформлении продажи');
    }
    console.log('💰 Продажа оформлена');
},

    // 👨‍💼 ДЛЯ ДИРЕКТОРА (Director)
    getDirectorData: async (filialId: number): Promise<{ filialName: string; stats: unknown }> => {
        console.log('👨‍💼 Запрос к /director/${filialId}');
        const response = await fetch(`${API_BASE_URL}/director/${filialId}`, {
            headers: getHeaders()
        });
        console.log('👨‍💼 Ответ от /director:', response.status);
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const data = await response.json();
        console.log('👨‍💼 Данные директора:', data);
        return data;
    }
};