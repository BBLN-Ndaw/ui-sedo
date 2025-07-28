# UI-SEDO - Angular Application with Authentication

## Description
Modern Angular application with JWT authentication system, using Angular Material for the user interface.

## Features

### ✨ Authentication
- Secure login page with form validation
- API POST call to `http://localhost:8080/api/login`
- Secure storage of JWT token in localStorage
- Automatic redirection after login

### 🎨 Design
- Modern interface with Angular Material
- Custom theme with main colors:
  - **Primary Green**: #2E7D32
  - **Accent Orange**: #FF6F00
- Responsive design and smooth animations
- Gradient backgrounds and visual effects

### 🔒 Security
- Route guards to protect pages
- Automatic HTTP interceptor for authentication headers
- Error handling and user notifications

### 🚀 Navigation
- Protected routing with automatic redirections
- Home page (Hello) after login
- Logout with token cleanup

## Installation & Startup

### Prerequisites
- Node.js (version 18+)
- Angular CLI (version 19+)

### Installation
```bash
npm install
```

### Development Startup
```bash
npm start
# or
ng serve
```

The app will be available at `http://localhost:4200`

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

## Backend API

### Login Endpoint
```
POST http://localhost:8080/api/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Expected Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Usage

### Login
1. Go to the login page
2. Enter your credentials (username and password)
3. The form automatically validates the fields
4. After successful login, you are redirected to the Hello page

### After Login
- The token is automatically added to HTTP request headers
- Access the Hello page with session information
- Option to logout

### Hello Page Features
- Real-time clock display
- Information about the current JWT token
- Button to test API calls with authentication
- Secure logout

## Customization

### Change Colors
Edit the `src/styles.scss` file to change the main colors:
```scss
$primary-color: #2E7D32; // Green
$accent-color: #FF6F00;   // Orange
```

### API Configuration
Edit the API URL in `src/app/services/auth.service.ts`:
```typescript
private apiUrl = 'http://localhost:8080/api';
```

## Technologies Used
- **Angular 19** - Main framework
- **Angular Material** - UI components
- **RxJS** - Reactive programming
- **TypeScript** - Development language
- **SCSS** - Styles and themes

## Security
- Client-side validation with Angular Reactive Forms
- Route protection with Guards
- Secure JWT token management
- Automatic cleanup of sensitive data on logout

---
Developed with ❤️ for UI-SEDO
