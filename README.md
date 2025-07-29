# UI-SEDO - Store Management System

## 🏪 Description
Modern Angular application for comprehensive store management with multi-role access, e-commerce capabilities, and real-time analytics. Built with Angular 19 and Angular Material for a professional user experience.

## ✨ Features

### 🔐 Multi-Role Authentication System
- **Store Owner** - Complete system control and administration
- **Store Employee** - Daily operations and customer service
- **Customers** - Online shopping and order tracking
- Secure JWT authentication with role-based access control

### 🎯 Core Functionalities

#### For Store Owner:
- 📊 Complete dashboard with real-time analytics
- 📈 Financial reports and business insights
- ⚙️ System administration and configuration
- 👥 Customer and employee management
- 📦 Full inventory control

#### For Store Employee:
- 🛒 Point of Sale (POS) system
- 📋 Order management and processing
- 📦 Product and stock management
- 👤 Customer service tools
- 📊 Daily operations dashboard

#### For Customers:
- 🛍️ Online product catalog browsing
- 🛒 Shopping cart and checkout process
- 📦 Order tracking and history
- 👤 Personal profile management
- 💳 Secure payment processing

### 🎨 Modern Design System
- Clean, professional Angular Material interface
- Custom color palette:
  - **Primary Blue**: #2563EB
  - **Success Green**: #10B981  
  - **Accent Orange**: #F59E0B
- Responsive design for all devices
- Intuitive navigation with role-based menus

### 🔒 Security & Performance
- JWT token-based authentication
- Role-based route protection
- Automatic token refresh
- Secure API communication
- Optimized performance with lazy loading

## 🚀 Installation & Setup

### Prerequisites
- Node.js (version 18+)
- Angular CLI (version 19+)
- Spring Boot backend server

### Installation
```bash
# Clone the repository
git clone https://github.com/BBLN-Ndaw/ui-sedo.git
cd ui-sedo

# Install dependencies
npm install
```

### Development Server
```bash
# Start the development server
npm start
# or
ng serve

# The application will be available at http://localhost:4200
```

### Backend Configuration
Make sure your Spring Boot backend is running on `http://localhost:8080` with the following endpoints:
- `POST /api/login` - Authentication
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/products` - Product management
- `GET /api/orders` - Order management

## 🏗️ Architecture

### Project Structure
```
src/app/
├── layout/
│   └── main-layout/         # Main application layout with sidebar
├── pages/
│   ├── dashboard/           # Dashboard with analytics
│   ├── products/            # Product management
│   ├── orders/              # Order management
│   ├── customers/           # Customer management
│   └── pos/                 # Point of Sale system
├── components/
│   ├── login/               # Authentication component
│   └── hello/               # Legacy component
├── services/
│   ├── auth.service.ts      # Authentication service
│   └── dashboard.service.ts # Dashboard data service
├── guards/
│   ├── auth.guard.ts        # Route protection
│   └── login.guard.ts       # Login redirection
├── shared/
│   └── models/              # TypeScript interfaces and models
└── environments/            # Environment configurations
```

### User Roles & Permissions

| Feature | Owner | Employee | Customer |
|---------|-------|----------|----------|
| Dashboard Analytics | ✅ | ✅ | ❌ |
| Product Management | ✅ | ✅ | ❌ |
| Order Management | ✅ | ✅ | ❌ |
| Point of Sale | ✅ | ✅ | ❌ |
| Customer Management | ✅ | ✅ | ❌ |
| Reports & Analytics | ✅ | ❌ | ❌ |
| Store Administration | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Online Shopping | ❌ | ❌ | ✅ |
| Order Tracking | ❌ | ❌ | ✅ |
| Profile Management | ✅ | ✅ | ✅ |

## Architecture

### Folder Structure
```
src/app/
├── components/
│   ├── login/           # Login component
│   └── hello/           # Home page after login
├── services/
│   └── auth.service.ts  # Authentication service
├── guards/
│   ├── auth.guard.ts    # Protected routes
│   └── login.guard.ts   # Redirect if already logged in
├── interceptors/
│   └── auth.interceptor.ts  # Automatic token addition
└── shared/
    └── material.exports.ts  # Angular Material exports
```

### Services
- **AuthService**: Handles authentication, token storage, API calls
- **AuthGuard**: Protects routes requiring authentication
- **LoginGuard**: Redirects if user is already logged in
- **AuthInterceptor**: Automatically adds token to HTTP requests

## 📡 API Integration

### Authentication Endpoint
```
POST http://localhost:8080/api/login
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "owner",
    "role": "OWNER",
    "firstName": "Store",
    "lastName": "Owner"
  }
}
```

### Dashboard APIs
```
GET /api/dashboard/stats        # Dashboard statistics
GET /api/dashboard/activities   # Recent activities
GET /api/dashboard/low-stock    # Low stock alerts
```

### Product Management APIs
```
GET /api/products              # Get all products
POST /api/products             # Create new product
PUT /api/products/{id}         # Update product
DELETE /api/products/{id}      # Delete product
GET /api/products/categories   # Get product categories
```

### Order Management APIs
```
GET /api/orders                # Get all orders
GET /api/orders/{id}           # Get order details
PUT /api/orders/{id}/status    # Update order status
POST /api/orders               # Create new order (POS)
```

## 🎯 Usage Guide

### Getting Started
1. **Login**: Use your credentials to access the system
2. **Dashboard**: View real-time store analytics and alerts
3. **Navigation**: Use the sidebar to access different modules based on your role

### For Store Owners:
1. **Monitor Performance**: Check daily sales, orders, and customer metrics
2. **Manage Inventory**: Add/edit products and monitor stock levels
3. **Review Reports**: Access detailed analytics and financial reports
4. **System Admin**: Configure store settings and manage users

### For Store Employees:
1. **Daily Operations**: Process orders and manage customer requests
2. **POS System**: Handle in-store sales and transactions
3. **Inventory**: Update stock levels and product information
4. **Customer Service**: Manage customer accounts and order issues

### For Customers:
1. **Browse Catalog**: Explore available products and categories
2. **Place Orders**: Add items to cart and complete purchases
3. **Track Orders**: Monitor order status and delivery updates
4. **Manage Profile**: Update personal information and preferences

## ⚙️ Configuration

### Environment Setup
Edit `src/environments/environment.ts` for production:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api'
};
```

### Theme Customization
Modify `src/styles.scss` to customize the design:
```scss
:root {
  --primary-color: #2563EB;    // Main blue
  --success-color: #10B981;    // Success green
  --accent-color: #F59E0B;     // Accent orange
  --warning-color: #F59E0B;    // Warning orange
  --error-color: #EF4444;      // Error red
}
```

## 🛠️ Technologies & Dependencies

### Core Technologies
- **Angular 19** - Main frontend framework
- **Angular Material** - UI component library
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming
- **SCSS** - Advanced styling

### Key Dependencies
```json
{
  "@angular/core": "^19.0.0",
  "@angular/material": "^19.0.0",
  "@angular/cdk": "^19.0.0",
  "rxjs": "~7.8.0",
  "typescript": "~5.6.0"
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for different user types
- **Route Guards**: Protect routes based on authentication and roles
- **HTTP Interceptors**: Automatic token injection and error handling
- **Input Validation**: Client-side and server-side validation
- **Secure Storage**: Safe token storage with automatic cleanup

## 🚀 Performance Optimizations

- **Lazy Loading**: Modules loaded on demand
- **OnPush Change Detection**: Optimized Angular change detection
- **Tree Shaking**: Unused code elimination
- **Bundle Optimization**: Minimized production builds
- **Caching Strategies**: HTTP response caching where appropriate

## 🐛 Development & Debugging

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# Test coverage
npm run test:coverage
```

### Build for Production
```bash
# Production build
npm run build

# Build with specific environment
ng build --configuration production
```

### Debugging Tips
1. Check browser console for errors
2. Verify JWT token in localStorage
3. Monitor Network tab for API calls
4. Use Angular DevTools for component inspection

## 📋 Roadmap & Future Enhancements

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Basic dashboard
- 🔄 Product management
- 🔄 Order management

### Phase 2 (Planned)
- 📋 Advanced reporting
- 📋 Email notifications
- 📋 Barcode scanning
- 📋 Payment integration

### Phase 3 (Future)
- 📋 Mobile app
- 📋 Advanced analytics
- 📋 Multi-location support
- 📋 API marketplace integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: [your-email@domain.com]

---

**UI-SEDO Store Management System** - Streamlining retail operations with modern technology 🚀
