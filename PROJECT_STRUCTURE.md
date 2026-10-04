# HOA App - Project Structure

```
СӨХ-app/
├── src/                          (React Frontend - User App)
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Announcements.jsx      ← Will show admin announcements
│   │   ├── Calendar.jsx           ← Will show admin events
│   │   ├── Payments.jsx           ← Will integrate QPay
│   │   ├── Feedback.jsx           ← Will submit feedback to admin
│   │   ├── Contact.jsx
│   │   ├── Profile.jsx
│   │   ├── Rules.jsx
│   │   ├── Notifications.jsx
│   │   └── Requests.jsx (skipped - prototype)
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   └── ...
│
├── backend/                       (Express.js Backend API)
│   ├── models/
│   │   ├── User.js               ← User with roles (admin/user)
│   │   ├── Announcement.js       ← Admin creates
│   │   ├── CalendarEvent.js      ← Admin creates
│   │   ├── Feedback.js           ← Users submit
│   │   ├── Payment.js            ← Payment history
│   │   └── Notification.js       ← System notifications
│   ├── routes/
│   │   ├── authRoutes.js         ← Login/Register
│   │   ├── announcementRoutes.js ← Admin create, Users read
│   │   ├── eventRoutes.js        ← Admin create, Users read
│   │   ├── feedbackRoutes.js     ← User submit, Admin read
│   │   └── paymentRoutes.js      ← Users request & pay
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── announcementController.js
│   │   ├── eventController.js
│   │   ├── feedbackController.js
│   │   └── paymentController.js
│   ├── middleware/
│   │   └── auth.js               ← JWT + role check
│   ├── config/
│   │   └── db.js                 ← MongoDB connection
│   ├── server.js                 ← Main Express app
│   ├── package.json
│   ├── .env.example              ← Copy to .env
│   └── SETUP.md                  ← Installation guide
│
├── package.json                   (Frontend)
├── vite.config.js
├── tailwind.config.js
└── ...
```

## Data Flow

### User Registration/Login:
```
React Login Page → POST /api/auth/login → Backend validates → Returns JWT token
Frontend stores token → Can now make authenticated requests
```

### Viewing Announcements:
```
Admin Panel → POST /api/announcements → Stored in DB
User App → GET /api/announcements → Displays in Announcements page
```

### Payment Flow:
```
User clicks "Pay" → POST /api/payments/:id/pay on an admin-generated bill → Backend starts the QPay payment
                                                 ↓ returns deeplink
                → Redirect to QPay deeplink
                                 ↓
                        User pays via QPay app
                                 ↓
                        QPay → POST /api/payments/qpay-callback
                                 ↓
                        Backend updates payment status to "completed"
                → Frontend shows payment in history
```

### Feedback Flow:
```
User submits feedback → POST /api/feedback → Stored in DB
Admin sees in admin panel → GET /api/feedback/admin/all
Admin responds → PUT /api/feedback/admin/:id/respond
User sees response in their feedback list
```

## Environment Setup Checklist

- [ ] Install Node.js (if not already)
- [ ] Install MongoDB (Atlas or local)
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Add MongoDB connection string to `.env`
- [ ] Run `cd backend && npm install`
- [ ] Run `npm run dev` to start backend
- [ ] Test endpoints with Postman
- [ ] Create `.env` file in frontend root (for API URL)
- [ ] Connect React frontend to backend API
- [ ] Build admin panel routes
- [ ] Deploy (optional - or just demo locally)

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Can register new user
- [ ] Can login with user
- [ ] Token is returned
- [ ] Admin can create announcements
- [ ] Users can view announcements
- [ ] Admin can create events
- [ ] Users can view events
- [ ] Users can submit feedback
- [ ] Admin can respond to feedback
- [ ] Payment request creates record
- [ ] Payment shows in history
- [ ] QPay deeplink is generated
