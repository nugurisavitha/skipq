# SkipQ - Frontend Setup Guide

## Project Overview
Complete React frontend foundation for a food ordering platform with support for multiple user roles (customer, restaurant admin, delivery partner, admin, super_admin).

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── common/              # Shared components
│   │       ├── Navbar.jsx
│   │       ├── Footer.jsx
│   │       ├── ProtectedRoute.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── Modal.jsx
│   │       └── EmptyState.jsx
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── SocketContext.jsx
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   └── useSocket.js
│   ├── services/                # API client
│   │   └── api.js
│   ├── pages/                   # Page components
│   │   ├── auth/               # Authentication pages
│   │   ├── customer/           # Customer pages
│   │   ├── restaurant/         # Restaurant admin pages
│   │   ├── admin/              # Admin pages
│   │   └── delivery/           # Delivery partner pages
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS config
├── postcss.config.js          # PostCSS config
└── package.json               # Dependencies

```

## Features

### Authentication
- Login/Register with email & password
- JWT token storage in localStorage
- Auto-logout on 401 responses
- Role-based redirect after login

### Cart Management
- Single restaurant per order
- Persistent cart with localStorage
- Item quantity management
- Tax & delivery fee calculation

### Real-time Updates
- Socket.io integration
- Order status updates
- Live delivery tracking

### Role-based Access Control
- Customer: Browse restaurants, place orders, track delivery
- Restaurant Admin: Manage menu, orders, tables, QR codes
- Delivery Partner: Accept and manage deliveries
- Admin: Manage restaurants, users, orders, analytics
- Super Admin: Full platform management

## Key Technologies

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with interceptors
- **Socket.io Client** - Real-time communication
- **React Query** - Server state management
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon library (Feather icons)
- **Lucide React** - Additional icons
- **Date-fns** - Date formatting
- **Recharts** - Data visualization

## API Integration

All API calls are centralized in `src/services/api.js` with organized methods:

- `api.auth.*` - Authentication
- `api.restaurants.*` - Restaurant management
- `api.menu.*` - Menu management
- `api.orders.*` - Order operations
- `api.payments.*` - Payment processing
- `api.qr.*` - QR code generation
- `api.admin.*` - Admin operations
- `api.delivery.*` - Delivery operations

## Styling

### Color Scheme
- Primary: #FF6B35 (Orange - Swiggy-inspired)
- Secondary: #004E89 (Dark Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

### Tailwind Configuration
Custom colors and animations defined in `tailwind.config.js`:
- Custom animations: slideInRight, slideInLeft, fadeIn, fadeOut
- Custom components: btn-primary, btn-secondary, input-field, card, badge

## Mobile Responsiveness

All components are fully responsive with:
- Mobile-first design approach
- Responsive grid layouts
- Mobile navigation drawer
- Touch-friendly interactive elements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Environment Variables

Create a `.env` file:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Next Steps

1. Implement actual API integration with backend
2. Add form validation libraries (react-hook-form, zod)
3. Implement payment gateway integration
4. Add image upload functionality
5. Implement search and filtering
6. Add more animations and transitions
7. Set up error logging and monitoring
8. Create unit and integration tests

## Notes

- All pages have placeholder implementations ready for backend integration
- Components follow modern React patterns (hooks, context)
- Consistent styling with utility-first CSS approach
- Proper error handling with toast notifications
- Loading states for async operations
