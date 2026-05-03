export interface Admin {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT';
    totpEnabled: boolean;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface DashboardStats {
    kpis: {
        totalOrders: number;
        confirmedOrders: number;
        totalRevenue: number;
        pendingOrders: number;
        totalServices: number;
        openTickets: number;
    };
    recentOrders: Order[];
    dailyRevenue: { date: string; total: number }[];
}

export interface Service {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    _count?: { plans: number; orders: number };
}

export interface Plan {
    id: string;
    serviceId: string;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    originalPrice: string | null;
    durationDays: number;
    displayOrder: number;
    isActive: boolean;
    _count?: { inventory: number };
}

export interface Order {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    amountPaid: string;
    paymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
    fulfillmentStatus: 'PENDING' | 'FULFILLED' | 'MANUAL_PENDING' | 'MANUAL_FULFILLED';
    deliveredAt: string | null;
    createdAt: string;
    service: { name: string; slug: string };
    plan: { name: string };
    serviceCredentials?: Record<string, any>;
}

export interface SupportTicket {
    id: string;
    customerName: string;
    customerEmail: string;
    orderId: string | null;
    subject: string;
    message: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    autoReplySent: boolean;
    createdAt: string;
}

export interface AuditLog {
    id: string;
    adminId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue: any;
    newValue: any;
    ipAddress: string | null;
    createdAt: string;
}

export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
