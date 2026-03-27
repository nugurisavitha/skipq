# SkipQ - Online Food Ordering Platform

A modern, full-stack food ordering and delivery platform built with Node.js, React, MongoDB, and Socket.IO. Inspired by popular platforms like Swiggy and Zomato.

## Features

### Customer Features
- Browse restaurants and menu items
- Search and filter by cuisine, rating, and price
- Add items to cart and place orders
- Multiple delivery address management
- Real-time order tracking with live location updates
- QR code scanning for dine-in ordering
- Table reservation system
- Payment integration with Razorpay
- Order history and ratings
- User authentication and profile management

### Restaurant Admin Features
- Restaurant dashboard and analytics
- Menu management (add, edit, delete items)
- Order management and status updates
- Table management for dine-in orders
- Bank details and payout management
- Real-time order notifications
- Operating hours management
- Ratings and reviews management

### Delivery Admin Features
- Real-time delivery order assignments
- Live location tracking
- Delivery route optimization
- Order status updates
- Earnings and trip history

### Super Admin & Admin Features
- Platform-wide analytics and reporting
- User management (customers, restaurants, delivery partners)
- Order management across all restaurants
- Payment settlement tracking
- Dispute resolution
- Platform configuration

## Tech Stack

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.IO
- **State Management**: React Query
- **Routing**: React Router DOM
- **UI Components**: Lucide React, React Icons
- **QR Code**: html5-qrcode
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB 7
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Real-time**: Socket.IO
- **Payment Gateway**: Razorpay
- **QR Code Generation**: qrcode
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Development**: Nodemon

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (production frontend)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         ▼
         ┌───────────────────────────────────┐
         │       Nginx (Production)          │
         │  - Serve React SPA                │
         │  - Proxy /api to backend          │
         │  - Gzip compression               │
         │  - Caching headers                │
         └────────┬────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  ▼
    ┌──────────────────────────────────────┐
    │     Express.js Backend Server        │
    │  - REST API endpoints                │
    │  - WebSocket events (Socket.IO)      │
    │  - Authentication & Authorization    │
    │  - Business logic & validation       │
    └────────┬─────────────────────────────┘
             │
             │ Mongoose ODM
             ▼
    ┌──────────────────────────────────────┐
    │      MongoDB Database                │
    │  - Collections: Users, Orders, etc.  │
    │  - Indexes for performance           │
    │  - Replication & backup              │
    └──────────────────────────────────────┘
```

## Prerequisites

### Local Development
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v7.0 or higher
- **Git**: for version control

### Docker Deployment
- **Docker**: v20.10 or higher
- **Docker Compose**: v2.0 or higher

## Getting Started

### Option 1: Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodie-app
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database seeder**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

6. **View logs**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

7. **Stop services**
   ```bash
   docker-compose down
   ```

### Option 2: Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodie-app
   ```

2. **Install MongoDB** (if not already installed)
   - macOS: `brew install mongodb-community`
   - Ubuntu: Follow [official MongoDB guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)

3. **Start MongoDB**
   ```bash
   # macOS/Linux
   mongod

   # Windows
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
   ```

4. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run seed  # Seed database with test data
   npm run dev   # Start development server
   ```

5. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev   # Start development server
   ```

6. **Access the application**
   - Frontend: http://localhost:5173 (Vite dev server)
   - Backend API: http://localhost:5000

## Environment Variables

### Root .env (for Docker Compose)

| Variable | Default | Description |
|----------|---------|-------------|
| MONGO_URI | mongodb://mongodb:27017/skipq_app | MongoDB connection string |
| MONGO_ROOT_USER | admin | MongoDB root username |
| MONGO_ROOT_PASSWORD | password | MongoDB root password |
| JWT_SECRET | your_jwt_secret_change_in_production_12345 | JWT signing secret |
| JWT_EXPIRE | 7d | JWT token expiration |
| PORT | 5000 | Backend server port |
| FRONTEND_PORT | 3000 | Frontend port |
| NODE_ENV | development | Environment (development/production) |
| CLIENT_URL | http://localhost:3000 | Frontend client URL |
| APP_URL | https://skipq.com | Application URL for production |
| RAZORPAY_KEY_ID | your_razorpay_key | Razorpay API key ID |
| RAZORPAY_KEY_SECRET | your_razorpay_secret | Razorpay API secret |
| SOCKET_IO_CORS_ORIGIN | http://localhost:3000 | Socket.IO CORS origin |
| MAX_FILE_SIZE | 5242880 | Max file upload size (bytes) |
| VITE_API_BASE_URL | http://localhost:5000 | API base URL for frontend |
| VITE_SOCKET_URL | http://localhost:5000 | Socket.IO URL for frontend |

### Backend .env (for local development)

Copy from `.env.example` and customize:

```bash
cp backend/.env.example backend/.env
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add address
- `GET /api/users/addresses` - Get all addresses
- `DELETE /api/users/addresses/:id` - Delete address

### Restaurants
- `GET /api/restaurants` - List all restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/restaurants/:id/menu` - Get restaurant menu

### Menu Items
- `GET /api/menu-items` - List menu items
- `GET /api/menu-items/:id` - Get menu item details

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/:id/track` - Track order

### QR Codes
- `GET /api/qr-codes/:restaurantId` - Get QR codes for restaurant
- `POST /api/qr-codes/scan` - Scan QR code

### Payments
- `POST /api/payments/razorpay/create` - Create Razorpay order
- `POST /api/payments/razorpay/verify` - Verify payment

## User Roles & Permissions

| Role | Permissions | Access |
|------|-----------|--------|
| **super_admin** | Full platform access, user management, analytics | Admin dashboard |
| **admin** | Order management, restaurant management, disputes | Admin dashboard |
| **restaurant_admin** | Own restaurant management, menu, orders | Restaurant dashboard |
| **delivery_admin** | Delivery orders, route optimization, earnings | Delivery app |
| **customer** | Browse, order, track, review | Customer app |

## Seed Data Credentials

### Test Accounts

**Super Admin**
- Email: `superadmin@skipq.com`
- Password: `Admin@123`

**Admin**
- Email: `admin@skipq.com`
- Password: `Admin@123`

**Restaurant Admin (Spice Haven)**
- Email: `raj@spicehaven.com`
- Password: `Admin@123`

**Restaurant Admin (Pizza Fino)**
- Email: `maria@pizzafino.com`
- Password: `Admin@123`

**Delivery Admin**
- Email: `akshay@delivery.com` / `priya@delivery.com`
- Password: `Admin@123`

**Customer**
- Email: `john@example.com` (and others)
- Password: `User@123`

### Sample Data

**Restaurants Created:**
1. **Spice Haven** - Indian cuisine with 12 menu items
2. **Dragon Palace** - Chinese cuisine with 10 menu items
3. **Pizza Fino** - Italian cuisine with 12 menu items

**Features in Seed Data:**
- Each restaurant has 3-4 tables with QR codes
- 15-20 realistic menu items with prices in INR
- Menu items categorized (Appetizers, Main Course, Desserts, Beverages, etc.)
- Sample orders in various statuses (placed, confirmed, delivered, etc.)
- 5 customer accounts with addresses

**Running the Seeder**

```bash
# Using Docker
docker-compose exec backend npm run seed

# Or locally
cd backend
npm run seed

# Clear database only
npm run seed -- --destroy
```

## Folder Structure

```
foodie-app/
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── components/                # Reusable components
│   │   ├── pages/                     # Page components
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── services/                  # API services
│   │   ├── context/                   # Context API
│   │   ├── styles/                    # Global styles
│   │   └── App.jsx
│   ├── public/                        # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                           # Express backend
│   ├── models/                        # Mongoose schemas
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   └── QRCode.js
│   ├── routes/                        # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── restaurants.js
│   │   ├── orders.js
│   │   └── ...
│   ├── controllers/                   # Route handlers
│   ├── middleware/                    # Custom middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── config/                        # Configuration files
│   │   ├── db.js
│   │   └── socket.js
│   ├── utils/                         # Utility functions
│   ├── services/                      # Business logic services
│   ├── server.js                      # Entry point
│   ├── seed.js                        # Database seeder
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml                 # Docker Compose configuration
├── .env                               # Root environment variables
├── .gitignore
├── README.md
└── LICENSE
```

## Screenshots

_Add screenshots here for:_
- Customer app home page
- Restaurant menu page
- Order tracking
- Restaurant admin dashboard
- Delivery admin live tracking

## Common Issues & Solutions

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker-compose up -d mongodb
```

### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in .env
PORT=5001
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Build Issues
```bash
# Rebuild images
docker-compose build --no-cache

# Remove all volumes
docker-compose down -v
```

## Database Models

### User
- name, email, phone, password
- role (super_admin, admin, restaurant_admin, delivery_admin, customer)
- addresses, isActive, isVerified
- currentLocation (for delivery partners)

### Restaurant
- owner (reference to User)
- name, description, cuisine, address, phone, email
- location (GeoJSON point for mapping)
- rating, totalRatings
- openingHours, preparationTime, minimumOrder, deliveryFee, taxRate
- tables, bankDetails

### MenuItem
- restaurant (reference)
- category, name, description, price, discountPrice
- image, isVeg, isAvailable, preparationTime
- tags, customizations

### Order
- customer, restaurant (references)
- items, orderType (delivery, takeaway, dine_in)
- tableNumber (for dine-in), scheduledFor
- subtotal, tax, deliveryFee, discount, total
- paymentMethod, paymentStatus, razorpayOrderId
- status, statusHistory
- deliveryAddress, deliveryPerson, estimatedDeliveryTime

### QRCode
- restaurant, tableNumber (references)
- qrCodeUrl, qrCodeData
- isActive, scanCount, lastScannedAt

## Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for list endpoints
- Caching strategies for menu items and restaurant data
- Image optimization and CDN-ready URLs
- Gzip compression in Nginx
- Socket.IO namespaces for real-time features
- Connection pooling for database

## Security Measures

- JWT-based authentication
- Password hashing with bcryptjs (10 salt rounds)
- CORS configuration
- Helmet security headers
- Input validation with express-validator
- Rate limiting (recommended for production)
- SQL injection prevention (using MongoDB with Mongoose)
- XSS protection in frontend
- Secure password storage

## Testing

_Add testing commands and guidelines:_

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run e2e
```

## Deployment

### Using Docker Compose (Recommended)
```bash
# Set production environment
NODE_ENV=production

# Build and start
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment
```bash
# Backend
cd backend
npm ci --only=production
npm start

# Frontend (requires build)
cd frontend
npm ci
npm run build
# Serve dist folder with Nginx or Apache
```

### Environment Setup for Production
- Change JWT_SECRET to a strong random string
- Set NODE_ENV=production
- Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
- Set up MongoDB with authentication and backups
- Configure email services for notifications
- Set up SSL certificates
- Configure CDN for static assets

## API Documentation

Full API documentation available at `/api/docs` (requires Swagger setup).

For now, refer to the routes files in `backend/routes/` for endpoint details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint for JavaScript linting
- Follow REST API conventions
- Add comments for complex logic
- Write meaningful commit messages

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation
- Contact development team

## Roadmap

- [ ] Order scheduling
- [ ] Loyalty points system
- [ ] Restaurant promotions and coupons
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (native iOS/Android)
- [ ] Subscription meal plans
- [ ] AI-powered recommendations
- [ ] Advanced payment options (Apple Pay, Google Pay)
- [ ] Restaurant ratings and reviews with photos

## Team

- **Frontend Lead**: React/Vite expertise
- **Backend Lead**: Node.js/Express expertise
- **DevOps Lead**: Docker/Cloud deployment
- **Database Admin**: MongoDB optimization

## Acknowledgments

- Inspired by Swiggy and Zomato platforms
- Built with modern web technologies
- Community feedback and contributions

---

**Last Updated**: March 2024
**Version**: 1.0.0
**Status**: Development
