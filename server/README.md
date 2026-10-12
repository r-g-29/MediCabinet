# ⚙️ MediCabinet Backend (Server)

> The Node.js & Express REST API powering **MediCabinet**. Manages family profiles, medicine inventories, OCR packaging parsing, automated email alert dispatches, and daily cron health audits.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://mongoosejs.com/)
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract.js-blue.svg)](https://tesseract.projectnaptha.com/)
[![Nodemailer](https://img.shields.io/badge/Mailer-Nodemailer-007ACC.svg)](https://nodemailer.com/)

---

## 🏗️ Backend Architecture

The backend follows an MVC-inspired service-layered architecture:

```
server/
├── data/
│   └── medicine_reference.csv  # Drug formulary dataset (imported into DB)
├── src/
│   ├── config/                 # DB connection (db.js)
│   ├── controllers/            # Request handlers and business logic
│   │   ├── authController.js
│   │   ├── medicineController.js
│   │   ├── profileController.js
│   │   ├── scheduleController.js
│   │   ├── doseController.js
│   │   ├── statsController.js
│   │   └── notificationController.js
│   ├── jobs/                   # Background tasks
│   │   └── alertJob.js         # Daily 08:00 AM cron alert watchdog
│   ├── middleware/             # Express middlewares
│   │   ├── auth.js             # JWT verification and user population
│   │   ├── errorHandler.js     # Global error responder
│   │   └── validate.js         # Zod schema validation
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Medicine.js
│   │   ├── Reference.js
│   │   ├── Schedule.js
│   │   ├── DoseLog.js
│   │   └── Notification.js
│   ├── routes/                 # Express router declarations
│   ├── services/               # Reusable business logic
│   │   ├── emailService.js     # Nodemailer email templating & dispatch
│   │   ├── ocrService.js       # Tesseract image processing
│   │   └── parserService.js    # Regex & Fuse.js fuzzy matching
│   └── scripts/                # Database tooling
│       ├── seed.js             # Generates demo user and data
│       └── importReference.js  # Imports reference CSV into MongoDB
├── tests/
│   └── api.test.js             # Jest + Supertest test suite
├── index.js                    # Application entry point
└── package.json
```

---

## 🧠 Core Systems & Engines

### 1. 📸 Packaging OCR & Drug Formulary Parser
- **Image Preprocessing**: Multer manages incoming multipart file uploads in-memory.
- **Tesseract.js**: Performs Optical Character Recognition on blister strips, foil backing, and folded carton labels.
- **Parser Service**:
  - Employs tailored Regular Expressions to isolate **Batch Numbers** (e.g., `B24098`, `LOT-1102`) and **Expiry Timestamps** (e.g., `EXP 10/26`, `08/2027`, `BEST BEFORE 12/26`).
  - Uses **Fuse.js** fuzzy matching against the `Reference` collection to identify brand names and retrieve verified generic salts and indications.
  - Generates uncertainty scores to flag questionable characters for user verification.

### 2. ✉️ Proactive Email Alert Engine
- **Event-Driven Instant Dispatch**: Whenever a medicine is saved or updated with an expired status or low-stock count, `medicineController.js` dispatches an immediate email alert via `emailService.js`.
- **Scheduled Daily Cron Job**: Every morning at 08:00 AM (`alertJob.js`), a cron task scans all medicines across the database, flagging:
  - Items expired past today's date
  - Items expiring within 30 days
  - Items whose remaining quantity is at or below their safety threshold
- **Deduplication & Auditing**:
  - `Medicine` model records `alertEmailSent`, `alertEmailStatus`, `alertEmailRecipient`, and `alertEmailSentAt`.
  - `Notification` model records `emailSent`, `emailRecipient`, and `emailStatus`.

### 3. 🔒 Multi-Tenant Data Isolation
- Every database query automatically scopes to the authenticated user's ID (`userId: req.user._id`).
- It is architecturally impossible for one household to query, modify, or delete another user's medicines, profiles, or dose histories.

---

## 🚀 Environment Variables (`.env`)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Server listening port (default: 5000) | `5000` |
| `NODE_ENV` | No | Environment mode | `development` / `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string | `mongodb://127.0.0.1:27017/medicabinet` |
| `JWT_SECRET` | **Yes** | Secret key for signing JSON Web Tokens | `your_ultra_secure_jwt_secret_key` |
| `JWT_EXPIRES_IN` | No | Token expiration duration | `7d` |
| `CLIENT_URL` | No | Allowed frontend origin for CORS | `http://localhost:5173` |
| `SMTP_HOST` | No | SMTP host for email dispatches | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP port | `587` |
| `SMTP_USER` | No | Email address for SMTP authentication | `your-email@gmail.com` |
| `SMTP_PASS` | No | 16-character App Password (for Gmail) | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | No | From header display name | `MediCabinet Alerts <your-email@gmail.com>` |

---

## 🛠️ Scripts & Commands

```bash
# Start server in development mode (with nodemon auto-restart)
npm run dev

# Start server in production mode
npm start

# Import medicine reference formulary CSV into MongoDB
npm run import

# Seed demo user and sample dataset
npm run seed

# Run automated integration tests with Jest and Supertest
npm test
```

---

## 🌐 API Route Directory

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Create a new user account
- `POST /api/auth/login` — Sign in and receive a signed JWT
- `GET /api/auth/me` — Retrieve current user account details

### Profiles (`/api/profiles`)
- `GET /api/profiles` — List all family profiles for the current user
- `POST /api/profiles` — Create a new family profile
- `PUT /api/profiles/:id` — Update profile info, allergies, or blood group
- `DELETE /api/profiles/:id` — Delete profile

### Medicines (`/api/medicines`)
- `GET /api/medicines` — Fetch cabinet inventory with optional filters (`status`, `profileId`, `search`)
- `POST /api/medicines` — Add new medicine (triggers conflict checks & email alerts)
- `PUT /api/medicines/:id` — Update medicine details or quantity
- `DELETE /api/medicines/:id` — Delete medicine
- `POST /api/medicines/scan` — OCR image upload endpoint
- `GET /api/medicines/interactions/:id` — Inspect active salt overlap

### Schedules & Doses (`/api/schedules` & `/api/doses`)
- `GET /api/schedules` — Get dose schedules
- `POST /api/schedules` — Add a dose schedule
- `PUT /api/schedules/:id` — Update or toggle schedule active state
- `DELETE /api/schedules/:id` — Delete schedule
- `GET /api/doses` — Get dose log history
- `POST /api/doses/log` — Record dose taken/missed (auto-decrements stock)

### Analytics & Notifications (`/api/stats` & `/api/notifications`)
- `GET /api/stats/summary` — Aggregated counts (Total, OK, Expiring, Expired, Low Stock)
- `GET /api/stats/adherence` — Adherence analytics (compliance percentage)
- `GET /api/stats/waste` — Cost calculations for expired medicines
- `GET /api/notifications` — Notification feed
- `PATCH /api/notifications/:id/read` — Mark notification read
- `DELETE /api/notifications/clear` — Clear notifications

---

## 📄 License
MIT
