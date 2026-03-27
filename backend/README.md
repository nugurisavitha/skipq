# SkipQ - Backend API

A complete, production-quality backend for a food ordering platform (Swiggy/Zomato style) built with Node.js, Express, MongoDB, Socket.IO, and Razorpay integration.

## Features

- **User Management**: Registration, login, profile management, address management
- **Multi-role Access Control**: Super Admin, Admin, Restaurant Admin, Delivery Admin, Customer
- **Restaurant Management**: Create, update, verify restaurants with opening hours and tables
- **Menu Management**: Manage food items with categories, prices, customizations, and availability
- **Order Management**: Complete order lifecycle from placement to delivery
- **Real-time Updates**: Socket.IO for real-time order tracking and notifications
- **Payment Integration**: Razorpay payment gateway with webhook support
- **QR Code Generation**: Generate and track QR codes for dine-in orders
- **Delivery Management**: Assign delivery persons, track delivery status, analytics
- **Admin Dashboard**: Revenue analytics, user management, order tracking
- **Geospatial Queries**: Find nearby restaurants and delivery persons

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs for password hashing
- **Payment**: Razorpay API
- **QR Code**: qrcode library
- **Validation**: express-validator
- **Logging**: Morgan

## Installation

1. **Clone the repository**
   ```bash
   cd foodie-app/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```
   MONGO_URI=mongodb://localhost:27017/skipq_app
   JWT_SECRET=your_super_secret_jwt_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the server**

   Development:
   ```bash
   npm run dev
   ```

   Production:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `PUT /profile` - Update profile (protected)
- `POST /address` - Add delivery address (protected)
- `DELETE /address/:addressId` - Delete address (protected)
- `POST /logout` - Logout (protected)

### Restaurants (`/api/restaurants`)
- `GET /` - Get all restaurants with filters
- `GET /id/:id` - Get restaurant by ID
- `GET /slug/:slug` - Get restaurant by slug
- `POST /` - Create restaurant (admin only)
- `PUT /:id` - Update restaurant (owner only)
- `PATCH /:id/toggle-active` - Toggle restaurant status
- `PATCH /:id/verify` - Verify restaurant (admin only)
- `POST /:id/tables` - Manage tables (owner only)
- `GET /my/restaurant` - Get my restaurant (restaurant_admin)

### Menu (`/api/menu`)
- `GET /` - Get menu items for restaurant
- `GET /categories` - Get menu categories
- `GET /:id` - Get menu item details
- `POST /` - Create menu item (restaurant_admin only)
- `PUT /:id` - Update menu item (owner only)
- `DELETE /:id` - Delete menu item (owner only)
- `PATCH /:id/toggle-availability` - Toggle item availability

### Orders (`/api/orders`)
- `POST /` - Create order (customer only)
- `GET /` - Get orders (filtered by role)
- `GET /:id` - Get order details
- `PATCH /:id/status` - Update order status
- `PATCH /:id/assign-delivery` - Assign delivery person (admin only)
- `PATCH /:id/cancel` - Cancel order (customer only)

### Payments (`/api/payments`)
- `POST /create-order` - Create Razorpay order
- `POST /verify` - Verify payment
- `POST /webhook` - Razorpay webhook
- `GET /:orderId` - Get payment status

### QR Codes (`/api/qr`)
- `POST /generate` - Generate QR code (restaurant_admin)
- `GET /restaurant/:restaurantId` - Get all QR codes for restaurant
- `GET /:id` - Get QR code details
- `GET /:id/download` - Download QR code image
- `POST /:id/scan` - Track QR scan
- `PATCH /:id/toggle` - Toggle QR code status
- `DELETE /:id` - Delete QR code

### Admin (`/api/admin`)
- `GET /dashboard` - Dashboard statistics
- `GET /users` - Get all users
- `PATCH /users/:id/role` - Update user role (super_admin only)
- `PATCH /users/:id/toggle-status` - Deactivate/activate user
- `GET /orders` - Get all orders
- `GET /analytics/revenue` - Revenue analytics
- `GET /restaurants/pending` - Pending restaurant verification
- `POST /create-admin` - Create admin user (super_admin only)

### Delivery (`/api/delivery`)
- `GET /orders` - Get assigned orders (delivery_admin)
- `PATCH /orders/:id/status` - Update delivery status
- `GET /history` - Get delivery history
- `PATCH /availability` - Toggle availability
- `PATCH /location` - Update delivery location
- `GET /stats` - Get delivery statistics
- `GET /nearby` - Get nearby delivery persons (admin only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## User Roles

1. **super_admin** - Full system access
2. **admin** - Restaurant and order management
3. **restaurant_admin** - Manage own restaurant and menu
4. **delivery_admin** - Handle deliveries
5. **customer** - Place and track orders

## Socket.IO Events

### Client to Server
- `user_join` - User connects to socket
- `join_order_room` - Join order tracking room
- `join_restaurant_room` - Restaurant joins order room
- `join_delivery_room` - Delivery person joins room

### Server to Client
- `order_status_updated` - Order status changed
- `new_order` - New order received
- `order_assigned` - Delivery assigned

## Database Models

### User
- Basic info: name, email, phone, password
- Role-based access
- Addresses for delivery
- Current location for delivery persons

### Restaurant
- Owner reference
- Cuisine types, opening hours
- Location (geospatial)
- Tables for dine-in
- Rating and verification status

### MenuItem
- Restaurant reference
- Category, name, price
- Customizations with options
- Availability and preparation time

### Order
- Customer and restaurant references
- Items with quantities
- Order type: delivery, takeaway, dine_in
- Payment information
- Status tracking with history
- Delivery assignment

### QRCode
- Restaurant and table reference
- QR code data and image
- Scan tracking

## Error Handling

All errors are handled globally with consistent response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Validation

- Email format validation
- Phone number format (Indian: 10 digits starting with 6-9)
- Password hashing with bcryptjs
- Input sanitization with helmet
- Request validation with express-validator

## Security Features

- **Helmet**: HTTP headers security
- **CORS**: Cross-origin resource sharing
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: express-validator
- **Rate Limiting**: Can be added with express-rate-limit
- **Signature Verification**: Razorpay webhook signature verification

## Development Guidelines

1. **Environment Setup**: Always set NODE_ENV appropriately
2. **Error Handling**: Use asyncHandler wrapper for async endpoints
3. **Validation**: Validate all inputs before processing
4. **Authorization**: Always check user role/ownership before operations
5. **Logging**: Use morgan for request logging
6. **Socket Events**: Emit socket events for real-time updates

## Testing

To test the API:

1. Use Postman or similar tools
2. Start with authentication endpoints
3. Create restaurants and menu items
4. Place orders and track status
5. Test payment verification
6. Monitor socket events

## Production Deployment

1. Set `NODE_ENV=production`
2. Use environment variables for all secrets
3. Set up MongoDB Atlas or managed MongoDB
4. Configure proper CORS origins
5. Enable HTTPS
6. Set up proper logging and monitoring
7. Use process manager (PM2, systemd)
8. Configure rate limiting
9. Set up webhooks for Razorpay
10. Monitor Socket.IO connections

## Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check MONGO_URI in .env

**JWT Errors**
- Verify JWT_SECRET is set
- Check token hasn't expired
- Ensure token is in Authorization header

**Socket.IO Connection Issues**
- Check CLIENT_URL matches frontend URL
- Verify CORS settings
- Check socket.io version compatibility

## License

ISC

## Support

For issues and questions, contact support or create an issue in the repository.
