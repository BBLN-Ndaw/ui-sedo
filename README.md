# UI-SEDO

E-commerce platform built with Angular 19 featuring multi-role authentication and store management capabilities.

## Features

### User Management
- **Admin**: Full system administration, user management, and analytics
- **Employee**: Product and order management, customer service
- **Customer**: Product browsing, shopping cart, order tracking, wishlist

### Core Functionality
- Product catalog with categories and search
- Shopping cart and secure checkout with PayPal integration
- Order management and tracking
- User profile management
- Supplier management
- Categories of product management
- Store administration dashboard
- Inventory tracking with stock alerts

### Security
- JWT authentication with role-based access control
- Protected routes with guards
- HTTP interceptors for automatic token handling and refresh token handling

## Tech Stack

- **Angular 19** with Angular Material
- **TypeScript** and RxJS
- **ngx-paypal** for payment processing
- **Angular SSR** for server-side rendering
- **SCSS** for styling

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Application runs on http://localhost:4200
```

## Project Structure

```
src/app/
├── guards/              # Route protection
├── interceptors/        # HTTP interceptors
├── services/           # Business logic services
├── shared/             # Models and common utilities
├── components/         # Feature components
│   ├── login/          # Authentication
│   ├── dashboard/      # Admin dashboard
│   ├── catalog/        # Product catalog
│   ├── cart/           # Shopping cart
│   ├── profile/        # User profiles
│   ├── orders*/        # Order management
│   ├── products*/      # Product management
│   ├── users*/         # User management
│   ├── suppliers*/     # Supplier management
│   └── categories*/    # Category management
└── main-layout/        # Application shell
```

## User Roles & Access

| Feature | Admin | Employee | Customer |
|---------|-------|----------|----------|
| Dashboard | ✅ | ✅ | ❌ |
| Product Management | ✅ | ✅ | ❌ |
| Order Management | ✅ | ✅ | ❌ |
| User Management | ✅ | ✅ | ❌ |
| Supplier Management | ✅ | ✅ | ❌ |
| Store Administration | ✅ | ❌ | ❌ |
| Product Catalog | ✅ | ✅ | ✅ |
| Shopping Cart | ❌ | ❌ | ✅ |
| Order Tracking | ✅ | ✅ | ✅ |
| Profile Management | ✅ | ✅ | ✅ |

## Build & Deploy

```bash
# Development build
npm run build

# Production build with SSR
npm run build && npm run serve:ssr:ui-sedo

```

## Environment Configuration

Configure API endpoints in `src/environments/`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```
