# SkipQ - Complete API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication Header
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

## Response Format
Success response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

Error response:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication Endpoints (`/auth`)

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "passwordConfirm": "password123"
}

Response: 201
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token"
  }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "user": { /* full user object */ }
  }
}
```

### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "9876543211",
  "avatar": "https://avatar-url.com/image.jpg"
}

Response: 200
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user */ }
  }
}
```

### Add Address
```
POST /auth/address
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "home",
  "address": "123 Main St, City, State 12345",
  "lat": 28.6139,
  "lng": 77.2090,
  "isDefault": true
}

Response: 201
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "user": { /* user with new address */ }
  }
}
```

### Delete Address
```
DELETE /auth/address/:addressId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Address deleted successfully",
  "data": {
    "user": { /* updated user */ }
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Restaurant Endpoints (`/restaurants`)

### List Restaurants (Public)
```
GET /restaurants?page=1&limit=10&search=pizza&cuisine=Italian&sortBy=rating&lat=28.6139&lng=77.2090

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string (search in name/description)
- cuisine: comma-separated (Italian,Chinese)
- sortBy: 'rating' or 'distance' (default: rating)
- lat: number (for distance sorting)
- lng: number (for distance sorting)

Response: 200
{
  "success": true,
  "data": {
    "restaurants": [ /* array of restaurant objects */ ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

### Get Restaurant by ID
```
GET /restaurants/id/:restaurantId

Response: 200
{
  "success": true,
  "data": {
    "restaurant": { /* restaurant object */ }
  }
}
```

### Get Restaurant by Slug
```
GET /restaurants/slug/:slug

Response: 200
{
  "success": true,
  "data": {
    "restaurant": { /* restaurant object */ }
  }
}
```

### Create Restaurant (Admin/Super Admin)
```
POST /restaurants
Authorization: Bearer <token>
Content-Type: application/json

{
  "ownerId": "user_id",
  "name": "Pizza Palace",
  "description": "Best pizzas in town",
  "cuisine": ["Italian", "Continental"],
  "address": "123 Main St, City",
  "phone": "9876543210",
  "email": "pizza@example.com",
  "logo": "https://logo-url.com",
  "coverImage": "https://cover-url.com",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "preparationTime": 30,
  "minimumOrder": 200,
  "deliveryFee": 50,
  "taxRate": 5
}

Response: 201
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {
    "restaurant": { /* created restaurant */ }
  }
}
```

### Update Restaurant (Owner)
```
PUT /restaurants/:restaurantId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "phone": "9876543211",
  "preparationTime": 35,
  "openingHours": [
    {
      "day": "Monday",
      "open": "10:00",
      "close": "23:00",
      "isClosed": false
    }
    /* ... more days */
  ]
}

Response: 200
{
  "success": true,
  "message": "Restaurant updated successfully",
  "data": {
    "restaurant": { /* updated restaurant */ }
  }
}
```

### Toggle Restaurant Active Status
```
PATCH /restaurants/:restaurantId/toggle-active
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Restaurant activated/deactivated",
  "data": {
    "restaurant": { /* updated restaurant */ }
  }
}
```

### Verify Restaurant (Admin/Super Admin)
```
PATCH /restaurants/:restaurantId/verify
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Restaurant verified/unverified",
  "data": {
    "restaurant": { /* updated restaurant */ }
  }
}
```

### Get My Restaurant (Restaurant Admin)
```
GET /restaurants/my/restaurant
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "restaurant": { /* owner's restaurant */ }
  }
}
```

### Manage Restaurant Tables
```
POST /restaurants/:restaurantId/tables
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "add",
  "table": {
    "tableNumber": "A1",
    "seats": 4,
    "isActive": true
  }
}

Actions: add, edit, remove

Response: 200
{
  "success": true,
  "message": "Table added/edited/removed successfully",
  "data": {
    "restaurant": { /* updated restaurant */ }
  }
}
```

---

## Menu Endpoints (`/menu`)

### Get Menu Items for Restaurant (Public)
```
GET /menu?restaurantId=xxx&category=Pizza&page=1&limit=20

Query Parameters:
- restaurantId: required
- category: optional
- page: number (default: 1)
- limit: number (default: 20)

Response: 200
{
  "success": true,
  "data": {
    "menuItems": [ /* array of menu items */ ],
    "pagination": { /* pagination object */ }
  }
}
```

### Get Menu Categories
```
GET /menu/categories?restaurantId=xxx

Response: 200
{
  "success": true,
  "data": {
    "categories": ["Pizza", "Appetizers", "Desserts"]
  }
}
```

### Get Menu Item Details
```
GET /menu/:menuItemId

Response: 200
{
  "success": true,
  "data": {
    "menuItem": { /* menu item object */ }
  }
}
```

### Create Menu Item (Restaurant Admin)
```
POST /menu
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": "xxx",
  "category": "Pizza",
  "name": "Margherita",
  "description": "Fresh mozzarella and basil",
  "price": 300,
  "discountPrice": 250,
  "image": "https://image-url.com",
  "isVeg": true,
  "preparationTime": 20,
  "tags": ["Popular", "Bestseller"],
  "customizations": [
    {
      "name": "Size",
      "required": true,
      "options": [
        { "name": "Small", "price": 0 },
        { "name": "Medium", "price": 50 },
        { "name": "Large", "price": 100 }
      ]
    }
  ]
}

Response: 201
{
  "success": true,
  "message": "Menu item created successfully",
  "data": {
    "menuItem": { /* created item */ }
  }
}
```

### Update Menu Item
```
PUT /menu/:menuItemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 350,
  "description": "Updated description"
}

Response: 200
{
  "success": true,
  "message": "Menu item updated successfully",
  "data": {
    "menuItem": { /* updated item */ }
  }
}
```

### Delete Menu Item
```
DELETE /menu/:menuItemId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

### Toggle Item Availability
```
PATCH /menu/:menuItemId/toggle-availability
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Menu item available/unavailable",
  "data": {
    "menuItem": { /* updated item */ }
  }
}
```

---

## Order Endpoints (`/orders`)

### Create Order
```
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": "xxx",
  "items": [
    {
      "menuItemId": "item1",
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
  "specialInstructions": "No onions"
}

Order Types: delivery, takeaway, dine_in
Payment Methods: razorpay, cash

Response: 201
{
  "success": true,
  "message": "Order created. Proceed to payment.",
  "data": {
    "order": { /* order object */ },
    "razorpayOrderId": "order_xxx",
    "razorpayKeyId": "key_xxx"
  }
}
```

### Get Orders (Filtered by Role)
```
GET /orders?page=1&limit=10&status=placed

Query Parameters:
- page: number
- limit: number
- status: placed/confirmed/preparing/ready/out_for_delivery/delivered/completed/cancelled
- restaurantId: for restaurant admin

Response: 200
{
  "success": true,
  "data": {
    "orders": [ /* array of orders */ ],
    "pagination": { /* pagination */ }
  }
}
```

### Get Order Details
```
GET /orders/:orderId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "order": { /* complete order object */ }
  }
}
```

### Update Order Status
```
PATCH /orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing",
  "note": "Starting preparation"
}

Valid statuses by role:
- Restaurant Admin: confirmed, preparing, ready
- Delivery Admin: out_for_delivery, delivered
- Customer: cancelled (only for placed orders)

Response: 200
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "order": { /* updated order */ }
  }
}
```

### Assign Delivery Person (Admin)
```
PATCH /orders/:orderId/assign-delivery
Authorization: Bearer <token>
Content-Type: application/json

{
  "deliveryPersonId": "delivery_user_id"
}

Response: 200
{
  "success": true,
  "message": "Delivery person assigned",
  "data": {
    "order": { /* updated order */ }
  }
}
```

### Cancel Order (Customer)
```
PATCH /orders/:orderId/cancel
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": { /* cancelled order */ }
  }
}
```

---

## Payment Endpoints (`/payments`)

### Create Razorpay Order
```
POST /payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id"
}

Response: 200
{
  "success": true,
  "message": "Razorpay order created",
  "data": {
    "razorpayOrderId": "order_xxx",
    "amount": 5000,
    "currency": "INR",
    "razorpayKeyId": "key_xxx"
  }
}
```

### Verify Payment
```
POST /payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}

Response: 200
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "order": { /* updated order with paid status */ }
  }
}
```

### Get Payment Status
```
GET /payments/:orderId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-123-ABC",
    "amount": 5000,
    "paymentStatus": "paid",
    "razorpayPaymentId": "pay_xxx"
  }
}
```

### Webhook
```
POST /payments/webhook

{
  "event": "payment.authorized|payment.failed|refund.created",
  "payload": { /* webhook payload */ }
}
```

---

## QR Code Endpoints (`/qr`)

### Generate QR Code
```
POST /qr/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": "xxx",
  "tableNumber": "A1"
}

Response: 201
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qrCode": {
      "_id": "qr_id",
      "restaurant": "xxx",
      "tableNumber": "A1",
      "qrCodeUrl": "data:image/png;base64,...",
      "qrCodeData": "https://skipq.com/scan?restaurant=slug&table=A1",
      "isActive": true,
      "scanCount": 0
    }
  }
}
```

### Get QR Codes for Restaurant
```
GET /qr/restaurant/:restaurantId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "qrCodes": [ /* array of QR codes */ ]
  }
}
```

### Get QR Code
```
GET /qr/:qrCodeId

Response: 200
{
  "success": true,
  "data": {
    "qrCode": { /* QR code object */ }
  }
}
```

### Download QR Code
```
GET /qr/:qrCodeId/download

Response: 200 (PNG image file)
```

### Track QR Scan
```
POST /qr/:qrCodeId/scan

Response: 200
{
  "success": true,
  "message": "Scan tracked",
  "data": {
    "qrCode": { /* updated with scan count */ }
  }
}
```

### Toggle QR Code Status
```
PATCH /qr/:qrCodeId/toggle
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "QR code activated/deactivated",
  "data": {
    "qrCode": { /* updated QR code */ }
  }
}
```

### Delete QR Code
```
DELETE /qr/:qrCodeId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "QR code deleted successfully"
}
```

---

## Admin Endpoints (`/admin`)

### Get Dashboard Statistics
```
GET /admin/dashboard
Authorization: Bearer <token> (admin/super_admin)

Response: 200
{
  "success": true,
  "data": {
    "stats": {
      "totalOrders": 500,
      "totalRestaurants": 25,
      "totalUsers": 1000,
      "totalRevenue": 500000
    },
    "ordersByStatus": [ /* breakdown by status */ ],
    "revenueByMonth": [ /* last 12 months */ ],
    "topRestaurants": [ /* top 5 by revenue */ ]
  }
}
```

### Get All Users
```
GET /admin/users?page=1&limit=10&role=customer&search=john

Query Parameters:
- page, limit
- role: super_admin/admin/restaurant_admin/delivery_admin/customer
- search: name/email/phone

Response: 200
{
  "success": true,
  "data": {
    "users": [ /* array of users */ ],
    "pagination": { /* pagination */ }
  }
}
```

### Update User Role
```
PATCH /admin/users/:userId/role
Authorization: Bearer <token> (super_admin)
Content-Type: application/json

{
  "role": "restaurant_admin"
}

Response: 200
{
  "success": true,
  "message": "User role updated",
  "data": {
    "user": { /* updated user */ }
  }
}
```

### Toggle User Status
```
PATCH /admin/users/:userId/toggle-status
Authorization: Bearer <token> (admin/super_admin)

Response: 200
{
  "success": true,
  "message": "User activated/deactivated",
  "data": {
    "user": { /* updated user */ }
  }
}
```

### Get All Orders
```
GET /admin/orders?page=1&limit=10&status=placed&restaurantId=xxx
Authorization: Bearer <token> (admin/super_admin)

Response: 200
{
  "success": true,
  "data": {
    "orders": [ /* all orders */ ],
    "pagination": { /* pagination */ }
  }
}
```

### Get Revenue Analytics
```
GET /admin/analytics/revenue?startDate=2024-01-01&endDate=2024-12-31&restaurantId=xxx
Authorization: Bearer <token> (admin/super_admin)

Response: 200
{
  "success": true,
  "data": {
    "totalRevenue": 500000,
    "revenueByPaymentMethod": [ /* breakdown */ ],
    "revenueByOrderType": [ /* breakdown */ ],
    "avgOrderValue": { /* statistics */ }
  }
}
```

### Get Pending Restaurants
```
GET /admin/restaurants/pending?page=1&limit=10
Authorization: Bearer <token> (admin/super_admin)

Response: 200
{
  "success": true,
  "data": {
    "restaurants": [ /* unverified restaurants */ ],
    "pagination": { /* pagination */ }
  }
}
```

### Create Admin User
```
POST /admin/create-admin
Authorization: Bearer <token> (super_admin)
Content-Type: application/json

{
  "name": "John Admin",
  "email": "admin@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "admin"
}

Valid roles: admin, restaurant_admin, delivery_admin

Response: 201
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": { /* created admin */ },
    "token": "jwt_token"
  }
}
```

---

## Delivery Endpoints (`/delivery`)

### Get Assigned Orders
```
GET /delivery/orders?page=1&limit=10&status=out_for_delivery
Authorization: Bearer <token> (delivery_admin)

Response: 200
{
  "success": true,
  "data": {
    "orders": [ /* assigned orders */ ],
    "pagination": { /* pagination */ }
  }
}
```

### Update Delivery Status
```
PATCH /delivery/orders/:orderId/status
Authorization: Bearer <token> (delivery_admin)
Content-Type: application/json

{
  "status": "out_for_delivery",
  "lat": 28.6200,
  "lng": 77.2100,
  "note": "On the way"
}

Valid statuses: out_for_delivery, delivered

Response: 200
{
  "success": true,
  "message": "Delivery status updated",
  "data": {
    "order": { /* updated order */ }
  }
}
```

### Get Delivery History
```
GET /delivery/history?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token> (delivery_admin)

Response: 200
{
  "success": true,
  "data": {
    "orders": [ /* completed deliveries */ ],
    "stats": {
      "totalDeliveries": 100,
      "totalEarnings": 5000,
      "avgDeliveryTime": 45
    },
    "pagination": { /* pagination */ }
  }
}
```

### Toggle Availability
```
PATCH /delivery/availability
Authorization: Bearer <token> (delivery_admin)

Response: 200
{
  "success": true,
  "message": "You are now available/unavailable for deliveries",
  "data": {
    "isAvailable": true
  }
}
```

### Update Location
```
PATCH /delivery/location
Authorization: Bearer <token> (delivery_admin)
Content-Type: application/json

{
  "lat": 28.6200,
  "lng": 77.2100
}

Response: 200
{
  "success": true,
  "message": "Location updated",
  "data": {
    "location": { /* current location */ }
  }
}
```

### Get Delivery Statistics
```
GET /delivery/stats
Authorization: Bearer <token> (delivery_admin)

Response: 200
{
  "success": true,
  "data": {
    "totalDeliveries": 100,
    "totalEarnings": 5000,
    "activeOrders": 3,
    "avgRating": 4.5
  }
}
```

### Get Nearby Delivery Persons
```
GET /delivery/nearby?lat=28.6139&lng=77.2090&radius=5000
Authorization: Bearer <token> (admin)

Response: 200
{
  "success": true,
  "data": {
    "deliveryPersons": [ /* nearby persons */ ]
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Server Error |

## Notes

- All timestamps are in ISO 8601 format
- All amounts are in currency units (INR)
- Pagination starts at page 1
- Default limit is 10, maximum is 100
- User must be authenticated for protected endpoints
- Role-based access is enforced at endpoint level
