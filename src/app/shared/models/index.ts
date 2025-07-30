// Core interfaces pour le système de gestion de magasin

export interface User {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

export enum UserRole {
  ADMIN = 'ADMIN',        // Administrateur - contrôle total
  EMPLOYEE = 'EMPLOYEE',  // Gestionnaire/Employé unique
  CUSTOMER = 'CUSTOMER'   // Clients du magasin
}

export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  parentId?: number;
  icon?: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum DeliveryType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  IN_STORE = 'IN_STORE'
}

export interface StockMovement {
  id: number;
  productId: number;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: number;
  createdAt: Date;
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

export interface Sale {
  id: number;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashierId: number;
  customerId?: number;
  createdAt: Date;
}

export interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Employee {
  id: number;
  userId: number;
  employeeNumber: string;
  department: string;
  position: string;
  salary: number;
  hireDate: Date;
  isActive: boolean;
}

export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalProducts: number;
  totalCustomers: number;
  totalEmployees: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
