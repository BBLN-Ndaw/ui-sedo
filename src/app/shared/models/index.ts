export interface User {
  id?: number;
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

export interface RegisterUser {
  userName: string;
  firstName: string;
  lastName: string;
  address: Address;
  numTel: string
  email: string;
}

// ===== INTERFACES =====
export interface UserListResponse {
  content: User[];
  totalElements: number;
  pageSize: number;
  size: number;
}

export interface UserFilterOptions {
  search?: string;
  isActive?: boolean;
  hasOrders?: boolean;
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
  ADMIN = 'ADMIN',        
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER'
}

// ===== INTERFACES FOURNISSEURS =====
export interface Supplier {
  id?: string;
  name: string;
  contactPersonName?: string;
  category?: string;
  email: string;
  phone: string;
  address: Address;
  isActive: boolean;
}

export interface SupplierListResponse {
  content: Supplier[];
  totalElements: number;
  pageSize: number;
  size: number;
}

export interface SupplierFilterOptions {
  search?: string;
  isActive?: boolean;
  category?: string;
}

export interface Product {
  id?: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  sellingPrice: number; // prix HT
  taxRate: number; // 20% par défaut
  purchasePrice: number;
  stockQuantity: number;
  minStock: number;
  unit: string;
  expirationDate?: Date | null;
  imageUrls: string[];
  isActive: boolean;
  isOnPromotion: boolean;
  promotionPrice?: number; // prix promo HT
  promotionEndDate?: Date;
}

export interface ProductWithCategoryListResponse {
  content: ProductWithCategoryDto[];
  totalElements: number;
  pageSize: number;
  size: number;
}

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  isActive?: boolean;
  isOnPromotion?: boolean;
  minPrice?: number;
  maxPrice?: number;
  isLowStock?: boolean;
  isInStock?: boolean;
  isOutOfStock?: boolean;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
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
  purchasePrice?: number | null;
  taxRate: number
  stockQuantity: number;
  minStock: number;
  expirationDate?: Date |null;
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
  id: string;
  productId: number;
  productName: string;
  productSku: string;
  productUnitPriceHT: number; // Prix unitaire HT
  productTaxRate: number; // Taux de TVA du produit
  quantity: number;
  productMaxQuantity: number; // Stock disponible
  imageUrl?: string;
  categoryName: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number; // Nombre total d'articles
  discount: number; // Montant des remises
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
  totalTTC: number;
}

//ORDERS
export interface OrderItem {
  productId: number;
  productName: string;
  image?: string;
  quantity: number;
  productUnitPrice: number;
  productTaxRate: number;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  customerName?: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  shippingAddress?: Address; //a remplir apres le capture de paypal
  billingAddress?: Address; //a remplir apres le capture de paypal
  estimatedDeliveryDate?: Date; //a remplir apres le capture de paypal
  note?: string;
  items: OrderItem[];
  paymentOrderId?: string, //ID de la transaction de paiement associée
  pickupDate?: Date;
  processedByUser?: string;
  paymentMethod?: PaymentMethod;//a remplir apres le capture de paypal
  paymentStatus: PaymentStatus;//a update apres le capture de paypal
  createdAt?: Date;

}

export interface OrderListResponse {
  content: Order[];
  totalElements: number;
  pageSize: number;
  size: number;
}

export interface OrderFilterOptions {
  search?: string;
  status?: OrderStatus;
  period?: string;
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


// Favoris
export interface FavoriteItem {
  productId: number;
  name: string;
  imageUrl?: string;
  price: number;
  availability: 'in-stock' | 'out-of-stock' | 'low-stock';

}

//Paypal

export interface PaypalCapturedResponse {
  id: string;
  orderNumber: string;
  status: string;
  payment_source: PaymentSource;
  purchase_units: PurchaseUnit[];
  payer: Payer;
}

export interface PaymentSource {
  paypal: PaypalAccount;
}

export interface PaypalAccount {
  email_address: string;
  name: Name;
  address: PaypalCustomerAddress;
}

export interface Name {
  given_name?: string;
  surname?: string;
  full_name?: string;
}

export interface PaypalCustomerAddress {
  address_line_1?: string;
  admin_area_2?: string;
  postal_code?: string;
  country_code: string;
}

export interface PurchaseUnit {
  shipping: Shipping;
  payments: Payments;
}

export interface Shipping {
  name: Name;
  address: PaypalCustomerAddress;
}

export interface Payments {
  captures: Capture[];
}

export interface Capture {
  amount: Amount;
}

export interface Amount {
  currency_code: string;
  value: string;
}

export interface Payer {
  name: Name;
  email_address: string;
  address: PaypalCustomerAddress;
}

export interface TopSellingProductDto {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  numberOfOrders: number;
}

export interface DailySalesResponseDto {
  value: string;
}

export interface DailySalesRequestDto {
  date: string;
}

export interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  description?: string;
  route?: string;
}

export interface RequestPasswordResetRequestDto{
  email: string;
}

export interface RequestPasswordResetResponseDto{
  value: string;
}