// Core interfaces pour le système de gestion de magasin

export interface User {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  address: Address;
  numTel: string
  email: string;
  createdAt?: Date;
  isActive: boolean;
  roles: string[];
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
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
  isOnPromotion?: boolean;
  promotionPrice?: number;
  promotionEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Category {
  id?: number;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface ProductWithCategoryDto {
  id: number;
  name: string;
  description?: string | null;
  sku: string;
  category: Category;
  supplierId: string;
  sellingPrice: number;
  stockQuantity: number;
  minStock: number;
  expirationDate: Date;
  unit: string;
  isActive: boolean;
  imageUrls: string[];
  isOnPromotion: boolean;
  promotionPrice?: number | null;
  promotionEndDate?: Date | null; 
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

// ===== INTERFACES PANIER =====

export interface CartItem {
  id: string; // ID unique pour l'item dans le panier
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number; // Stock disponible
  imageUrl?: string;
  category: string;
  total: number; // quantity * unitPrice
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number; // Nombre total d'articles
  subtotal: number; // Sous-total avant taxes et remises
  tax: number; // Montant des taxes
  discount: number; // Montant des remises
  total: number; // Total final
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: string;
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  total: number;
}

//ORDERS
export interface OrderItem {
  productId: number;
  productName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  estimatedDeliveryDate?: Date;
  note?: string;
  items: OrderItem[];
  pickupDate?: Date;
  processedByUser?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt?: Date;

}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum DeliveryType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  IN_STORE = 'IN_STORE'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}
