# SkipQ Backend - Quick Start Guide

## Overview

This is a complete, production-ready backend for a food ordering platform with features like:
- Multi-role authentication (Super Admin, Admin, Restaurant Admin, Delivery Admin, Customer)
- Restaurant and menu management
- Order processing with complete lifecycle
- Real-time order tracking via Socket.IO
- Payment integration with Razorpay
- QR code generation for dine-in orders
- Delivery person management
- Admin dashboard with analytics

## Files Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── socket.js          # Socket.IO setup
├── models/
│   ├── User.js            # User schema with auth methods
│   ├── Restaurant.js      # Restaurant schema
│   ├── MenuItem.js        # Menu item schema
│   ├── Order.js           # Order schema
│   └── QRCode.js          # QR code schema
├── middleware/
│   ├── auth.js            # JWT auth & role-based access
│   └── errorHandler.js    # Global error handling
├── controllers/
│   ├── authController.js        # Auth endpoints
│   ├── restaurantController.js  # Restaurant CRUD
│   ├── menuController.js        # Menu item CRUD
│   ├── orderController.js       # Order management
│   ├── paymentController.js     # Payment processing
│   ├── qrController.js          # QR code generation
│   ├── adminController.js       # Admin operations
│   └── deliveryController.js    # Delivery management
├── routes/
│   ├── authRoutes.js
│   ├── restaurantRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   ├── paymentRoutes.js
│   ├── qrRoutes.js
│   ├── adminRoutes.js
│   └── deliveryRoutes.js
├── services/
│   └── razorpayService.js       # Razorpay integration
├── utils/
│   └── helpers.js               # Utility functions
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example           # Environment template
└── README.md              # Full documentation
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `RAZORPAY_KEY_ID` - Razorpay account ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL for CORS

### 3. Start MongoDB
```bash
mongod
```

### 4. Run Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will be available at: `http://localhost:5000`

## Key Features Implemented

### Authentication & Authorization
- User registration (customers self-register)
- JWT-based login
- Role-based access control (5 roles)
- Password hashing with bcryptjs
- Protected routes with middleware

### Restaurant Management
- Create and manage restaurants
- Opening hours configuration
- Table management for dine-in
- Verification workflow
- Geospatial queries for nearby restaurants

### Menu Management
- Add/edit/delete menu items
- Customization options (size, spice level, etc.)
- Availability toggle
- Category-based filtering
- Discount pricing

### Order Processing
- Order placement with validation
- Cart total calculation with tax/delivery fee
- Multiple order types: delivery, takeaway, dine-in
- Status tracking with history
- Order cancellation with refunds

### Payment Processing
- Razorpay integration
- Order creation for payment
- Payment signature verification
- Webhook handling
- Refund processing

### Real-time Features
- Socket.IO connections
- Order status updates to customers
- New order notifications to restaurants
- Delivery assignment notifications
- Delivery person tracking

### QR Code Generation
- Generate QR codes for restaurant tables
- Deep linking to dine-in menu
- Scan tracking and analytics
- QR code download functionality

### Admin Dashboard
- Overview statistics
- Revenue analytics by period/payment method
- User management
- Order tracking
- Restaurant verification
- Delivery person management

### Delivery Management
- Order assignment to delivery persons
- Status updates (out for delivery, delivered)
- Location tracking
- Delivery history and earnings
- Availability toggle
- Nearby delivery person queries

## API Usage Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "secure_password",
  "passwordConfirm": "secure_password"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

### Create Restaurant (Admin only)
```bash
POST /api/restaurants
Authorization: Bearer <token>
Content-Type: application/json

{
  "ownerId": "user_id",
  "name": "Pizza Palace",
  "description": "Delicious pizzas",
  "cuisine": ["Italian", "Continental"],
  "address": "123 Main St, City",
  "phone": "9876543210",
  "email": "restaurant@example.com",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  }
}
```

### Create Menu Item
```bash
POST /api/menu
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": "restaurant_id",
  "category": "Pizza",
  "name": "Margherita",
  "description": "Fresh mozzarella and basil",
  "price": 300,
  "discountPrice": 250,
  "isVeg": true,
  "preparationTime": 20,
  "customizations": [
    {
      "name": "Size",
      "required": true,
      "options": [
        { "name": "Small", "price": 0 },
        { "name": "Large", "price": 100 }
      ]
    }
  ]
}
```

### Create Order
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": "restaurant_id",
  "items": [
    {
      "menuItemId": "item_id",
      "quantity": 2,
      "customizations": [
        {
          "name": "Size",
          "option": "Large"
        }
      ]
    }
  ],
  "orderType": "delivery",
  "paymentMethod": "razorpay",
  "deliveryAddress": {
    "address": "456 Oak Ave, City",
    "lat": 28.6200,
    "lng": 77.2100
  },
  "specialInstructions": "No onions please"
}
```

## Socket.IO Events

### Emitted by Client
```javascript
socket.emit('user_join', userId);
socket.emit('join_order_room', orderId);
socket.emit('join_restaurant_room', restaurantId);
socket.emit('join_delivery_room', deliveryPersonId);
```

### Received by Client
```javascript
socket.on('order_status_updated', (data) => {
  console.log('Order status:', data.status);
});

socket.on('new_order', (orderData) => {
  console.log('New order received:', orderData);
});

socket.on('order_assigned', (orderData) => {
  console.log('Order assigned:', orderData);
});
```

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **super_admin** | Full system access, create admins, verify restaurants |
| **admin** | Manage users, restaurants, orders, analytics |
| **restaurant_admin** | Manage own restaurant, menu, orders |
| **delivery_admin** | View assigned orders, update delivery status |
| **customer** | Browse restaurants, place orders, track delivery |

## Database Models

### User
- Authentication (email, password, JWT)
- Profile (name, phone, avatar)
- Addresses for delivery
- Geolocation for delivery persons
- Role-based access

### Restaurant
- Basic info (name, description, cuisine)
- Opening hours
- Tables for dine-in
- Geolocation for search
- Verification status
- Bank details

### MenuItem
- Category and basic info
- Pricing with discounts
- Customization options
- Availability status
- Tags (popular, new, bestseller)

### Order
- Items with quantities
- Order type (delivery/takeaway/dine_in)
- Complete pricing breakdown
- Payment details (Razorpay)
- Status tracking with history
- Delivery assignment

### QRCode
- Restaurant and table reference
- QR code image and deep link
- Scan tracking

## Error Handling

All errors return consistent JSON response:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common status codes:
- 400 - Bad request (validation error)
- 401 - Unauthorized (missing/invalid token)
- 403 - Forbidden (insufficient permissions)
- 404 - Not found
- 500 - Server error

## Security Features

- **Helmet**: HTTP security headers
- **CORS**: Cross-origin resource sharing
- **JWT**: Secure token authentication
- **Password Hashing**: bcryptjs with 10 salt rounds
- **Input Validation**: express-validator
- **Error Messages**: Don't expose sensitive data
- **Signature Verification**: Razorpay webhook validation

## Testing Checklist

- [ ] Register new user
- [ ] Login with credentials
- [ ] Create restaurant
- [ ] Add menu items
- [ ] Place order with delivery
- [ ] Verify Razorpay payment
- [ ] Track order status in real-time
- [ ] Test order cancellation
- [ ] Generate QR code
- [ ] Check admin dashboard
- [ ] Test delivery assignment
- [ ] Verify socket events

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure MongoDB is running and MONGO_URI is correct |
| JWT token invalid | Check JWT_SECRET in .env matches token creation |
| CORS errors | Verify CLIENT_URL in .env matches frontend URL |
| Socket.IO not connecting | Check client URL and socket.io version |
| Payment verification failed | Verify Razorpay keys and signature in .env |

## Performance Optimization

- Database indices on frequently queried fields
- Geospatial indexing for location-based queries
- Pagination for large result sets
- Socket.IO room-based broadcasting
- Request logging with Morgan
- Error handling with global middleware

## Next Steps

1. Setup frontend to consume these APIs
2. Configure production MongoDB
3. Set up proper environment variables
4. Configure Razorpay credentials
5. Deploy to production server
6. Set up monitoring and logging
7. Configure rate limiting
8. Enable HTTPS

## Support & Documentation

See `README.md` for:
- Complete API documentation
- Detailed setup instructions
- Production deployment guide
- Advanced configuration options
