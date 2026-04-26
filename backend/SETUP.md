# HOA App Backend Setup Guide

## ✅ What's Been Created

Your backend is ready with:
- ✅ Express server with CORS
- ✅ MongoDB models (User, Announcement, Calendar Event, Feedback, Payment, Notification)
- ✅ JWT Authentication (with admin role support)
- ✅ API endpoints for all features
- ✅ QPay payment placeholder (ready for real integration)

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create `.env` file (copy from `.env.example`)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hoa-app
JWT_SECRET=your_super_secret_key_change_this_in_production
PORT=5000
NODE_ENV=development

QPAY_MERCHANT_ID=your_merchant_id
QPAY_INVOICE_RECEIVER_CODE=your_receiver_code
QPAY_API_KEY=your_api_key
QPAY_CALLBACK_URL=http://localhost:5000/api/payments/qpay-callback
```

### 3. Get MongoDB Connection String

**Free option (MongoDB Atlas):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account
3. Create free cluster
4. Get connection string like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hoa-app
   ```
5. Replace `username` and `password` with your credentials
6. Paste in `.env` as `MONGO_URI`

**Local option:**
- Install MongoDB locally
- Use: `mongodb://localhost:27017/hoa-app`

### 4. Start Backend Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user (requires token)
```

### Announcements (Admin)
```
GET    /api/announcements              - Get all announcements
POST   /api/announcements              - Create (admin only)
PUT    /api/announcements/:id          - Update (admin only)
DELETE /api/announcements/:id          - Delete (admin only)
```

### Calendar Events (Admin)
```
GET    /api/events                     - Get all events
POST   /api/events                     - Create (admin only)
PUT    /api/events/:id                 - Update (admin only)
DELETE /api/events/:id                 - Delete (admin only)
```

### Feedback (User & Admin)
```
POST   /api/feedback                   - Submit feedback (user)
GET    /api/feedback/my-feedback       - Get my feedback (user)
GET    /api/feedback/admin/all         - Get all feedback (admin)
PUT    /api/feedback/admin/:id/respond - Respond to feedback (admin)
PUT    /api/feedback/admin/:id/status  - Update status (admin)
```

### Payments
```
POST   /api/payments/request           - Request payment (user)
GET    /api/payments/my-payments       - Get my payments (user)
GET    /api/payments/history           - Get payment history (user)
GET    /api/payments/admin/all         - Get all payments (admin)
POST   /api/payments/qpay-callback     - QPay webhook (public)
```

## 🔑 How Authentication Works

### Login Flow:
1. User sends `POST /api/auth/login` with email & password
2. Backend returns JWT token
3. User stores token in localStorage
4. User includes token in all requests: `Authorization: Bearer <token>`

### Example:
```javascript
const token = localStorage.getItem('token')
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## 👤 Creating Test Users

Use Postman or curl to test:

### Register Admin:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hoa.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Register Regular User:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resident@hoa.com",
    "password": "user123",
    "firstName": "John",
    "lastName": "Resident",
    "apartmentNumber": "101"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hoa.com",
    "password": "admin123"
  }'
```

Response will include token:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@hoa.com",
    "role": "admin"
  }
}
```

## 🚀 Next Steps

1. **Set up MongoDB** (Atlas or local)
2. **Copy `.env` file** from `.env.example`
3. **Install dependencies**: `npm install`
4. **Run backend**: `npm run dev`
5. **Test endpoints** with Postman or curl
6. **Connect frontend** to this backend (next step)
7. **Build admin panel** in React frontend
8. **Integrate QPay** with real credentials later

## ⚙️ Frontend Integration

Your React app needs to:
1. Call `POST /api/auth/login` on Login page
2. Store token in localStorage
3. Include token in all API requests
4. Add `/admin` routes for admin panel
5. Call payment endpoints to create payments & redirect to QPay

More details coming in the next setup! 🎯
