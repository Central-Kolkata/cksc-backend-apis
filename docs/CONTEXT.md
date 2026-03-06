# CKCA / CKSC Project — Architecture & Context Document

> **Central Kolkata Chartered Accountants (CKCA)** / **CKSC** — A multi-component system for membership management, events, payments, and administration for a Chartered Accountants' professional body based in Kolkata, India.

---

## 1. Overview

The CKCA project consists of three interconnected applications, each hosted on a different platform:

| Component | Description | Hosting | URL |
|-----------|-------------|---------|-----|
| **centralkolkata.org** | Public-facing website for members, events, membership, and payments | **Netlify** | https://centralkolkata.org |
| **APIs** | Backend REST APIs (Node.js/Express) | **Railway** | https://cksc-backend-apis-production.up.railway.app |
| **admin-panel** | Internal admin dashboard for managing members, events, users, transactions | **AWS Amplify** | (configured in Amplify) |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CKCA / CKSC ECOSYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐         ┌──────────────────────┐
  │  centralkolkata.org  │         │     admin-panel      │
  │  (Public Website)    │         │  (Admin Dashboard)   │
  │                      │         │                      │
  │  • Membership        │         │  • Members CRUD      │
  │  • Events            │         │  • Events CRUD       │
  │  • Payments (ICICI)  │         │  • Users CRUD        │
  │  • Event Registration│         │  • Transactions      │
  │  • SMS / Email       │         │  • Venues            │
  │                      │         │  • Reports           │
  └──────────┬───────────┘         └──────────┬───────────┘
             │                                │
             │  HTTPS (origin whitelisted)     │  HTTPS + JWT
             │                                │
             └───────────────┬────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │         APIs (Backend)       │
              │         Railway.com          │
              │                              │
              │  • Express.js / Node.js      │
              │  • MongoDB (Atlas)           │
              │  • JWT Authentication        │
              │  • ICICI Bank Integration    │
              │  • Cloudinary (uploads)      │
              │  • Resend / Nodemailer       │
              │  • Twilio (SMS/WhatsApp)     │
              └──────────┬───────────────────┘
                         │
          ┌──────────────┼──────────────────────────┐
          │              │                          │
          ▼              ▼                          ▼
   ┌────────────┐ ┌────────────────┐ ┌──────────────────────┐
   │  MongoDB   │ │ ICICI Payment  │ │  Cloudinary / Resend │
   │  Atlas     │ │ Gateway        │ │  / Twilio / SMS API  │
   └────────────┘ └────────────────┘ └──────────────────────┘
```

---

## 3. Component Details

### 3.1 centralkolkata.org (Netlify)

- **Type:** Static HTML + vanilla JavaScript
- **Purpose:** Public website for CKSC members and visitors
- **Key features:**
  - Membership registration and renewal
  - Annual and general event participation
  - ICICI bank payment integration (annual dues, event fees)
  - Event listing and registration
  - Pending amount lookup (by ICAI membership number or mobile)
  - SMS and email communication
- **API integration:** Uses `CKSC_BACKEND_APIS_URL` from `assets/js/constants.js`
  - Production: `https://cksc-backend-apis-production.up.railway.app`
- **Auth:** No JWT; requests from `centralkolkata.org` origin are whitelisted by the API

### 3.2 APIs (Railway) — *This Repository*

- **Stack:** Node.js, Express 4.18, MongoDB via Mongoose 6.6
- **Entry point:** `server.js` → `npm start` (Procfile: `web: npm start`)
- **Port:** `process.env.PORT` (Railway assigns dynamically) or 5001
- **Database:** MongoDB Atlas (`MONGO_URI`)
- **Auth:** JWT for admin-panel; whitelisted routes + `centralkolkata.org` origin for public site
- **Author:** Suvishakha
- **License:** MIT

### 3.3 admin-panel (AWS Amplify)

- **Stack:** React 17, React Router, Syncfusion, Tailwind, Ant Design
- **Purpose:** Internal admin dashboard for CKSC staff
- **Key pages:** Dashboard, Members, Events, Venues, Users, Transactions, Collect, Payments, Send, Registered Members
- **Auth:** JWT via `/admin-users/login`; token stored in localStorage
- **API base URL:** `REACT_APP_CKSC_API_BASE_URL` (must include `/api`, e.g. `https://cksc-backend-apis-production.up.railway.app/api`)
- **Password reset:** Uses `FRONTEND_BASE_URL` for reset links (e.g. Amplify app URL + `/admin/reset-password/:token`)

---

## 4. Project File Structure

```
apis/
├── server.js                          # Express app entry point, middleware chain, route mounting
├── package.json                       # Dependencies and scripts
├── Procfile                           # Railway deployment (web: npm start)
├── .env                               # Environment variables (not committed)
│
├── config/
│   ├── db.js                          # MongoDB Atlas connection via Mongoose
│   ├── cloudinary-config.js           # Cloudinary v2 setup (cloud_name, api_key, api_secret)
│   └── multer-config.js               # Multer memory storage for file uploads
│
├── middlewares/
│   ├── auth-middleware.js             # JWT Bearer token verification
│   ├── error-middleware.js            # Global Express error handler
│   └── errors.js                      # Custom error classes (DatabaseError, NotFoundError, ValidationError)
│
├── models/
│   ├── admin-user.js                  # AdminUser schema
│   ├── member-model.js                # Member schema
│   ├── member-payment.js              # MemberPayment schema (links request + response)
│   ├── event-model.js                 # Event schema
│   ├── event-registration-model.js    # EventRegistration schema (join table)
│   ├── venue-model.js                 # Venue schema
│   ├── icici-payment-request.js       # ICICIPaymentRequest schema
│   └── icici-payment-response.js      # ICICIPaymentResponse schema
│
├── controllers/
│   ├── admin-user-controller.js       # Admin auth (login, reset, create)
│   ├── member-controller.js           # Member CRUD, lookups, event registration
│   ├── bank-controller.js             # ICICI payment gateway integration (primary)
│   ├── icici-controller.js            # ICICI payment flows (legacy/alternate)
│   ├── event-controller.js            # Event + venue CRUD, event registration
│   ├── transaction-controller.js      # Transaction history with date filtering
│   ├── email-controller.js            # Email via Nodemailer (Gmail) + Resend API
│   ├── sms-controller.js              # SMS sending via external provider
│   ├── whatsapp-controller.js         # WhatsApp via Twilio
│   ├── reports-controller.js          # HTML payment/member reports
│   ├── upload-controller.js           # File upload to Cloudinary
│   └── health-controller.js           # Health check endpoint
│
├── routes/
│   ├── admin-user-routes.js
│   ├── member-routes.js
│   ├── bank-routes.js
│   ├── icici-routes.js
│   ├── event-routes.js
│   ├── transaction-routes.js
│   ├── email-routes.js
│   ├── sms-routes.js
│   ├── whatsapp-routes.js
│   ├── reports-routes.js
│   ├── upload-routes.js
│   └── health-routes.js
│
└── docs/
    └── CONTEXT.md                     # This document
```

---

## 5. Technology Stack & Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.1 | Web framework |
| mongoose | ^6.6.4 | MongoDB ODM |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| bcryptjs | ^2.4.3 | Password hashing (10 salt rounds) |
| dotenv | ^16.0.3 | Environment variable management |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| axios | ^1.1.2 | HTTP client for external API calls |
| nodemailer | ^6.9.13 | Email via Gmail SMTP |
| resend | ^6.6.0 | Email via Resend API (`noreply@centralkolkata.org`) |
| twilio | ^3.83.4 | SMS and WhatsApp messaging |
| cloudinary | ^2.2.0 | Image/file cloud storage |
| multer | ^1.4.5-lts.1 | Multipart form-data parsing (memory storage) |
| moment | ^2.29.4 | Date manipulation |
| validator | ^13.11.0 | Input validation (email, mobile) |
| express-async-handler | ^1.2.0 | Async error propagation in Express |
| uuid | ^9.0.0 | UUID generation |
| unirest | ^0.6.0 | HTTP requests (SMS provider) |
| wbm | ^1.1.16 | WhatsApp messaging (alternative) |
| body-parser | ^1.20.0 | Request body parsing |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^2.0.22 | Auto-reload during development |

### Scripts

| Command | Action |
|---------|--------|
| `npm start` | `node server.js` — production start |
| `npm run dev` | `nodemon server.js` — development with auto-reload |

---

## 6. Data Models (MongoDB)

### 6.1 Member

| Field | Type | Details |
|-------|------|---------|
| name | String | **Required** |
| icaiMembershipNo | String | ICAI membership number (e.g. `012345`) |
| ckscMembershipNo | String | CKSC membership number (e.g. `CKSC-0042`) |
| pendingAmount | Number | Outstanding dues amount |
| mobile | String | Validated via `validator.isMobilePhone` |
| email | String | Validated via `validator.isEmail` |
| dob | Date | Date of birth |
| dateOfAnniversary | Date | Wedding anniversary |
| spouseName | String | |
| transactions | [ObjectId → MemberPayment] | Payment history references |
| eventIds | [ObjectId → Event] | Event participation references |
| status | String | Enum: `active`, `inactive`, `pending`, `deleted` (default: `active`) |
| type | String | Enum: `member`, `non-member`, `patron`, `new-member`, `lifetime-member` (default: `member`) |
| reasonForInactivation | String | |
| createdAt / updatedAt | Date | Auto-managed timestamps |

**Member type transitions:**
- New online registrants start as `new-member` with status `inactive`
- On successful payment, `new-member` → `member` and `inactive` → `active`
- Event-only registrants (no membership) are created as `non-member`
- Deletion is soft: sets status to `deleted`

### 6.2 Event

| Field | Type | Details |
|-------|------|---------|
| eventName | String | |
| eventStartDate | Date | |
| eventStartTime | Date | |
| eventEndDate | Date | |
| registrationEndDateTime | Date | |
| eventDuration | Number | In hours |
| eventVenue | ObjectId → Venue | |
| ckcaMemberCharge | Number | Fee for CKCA members |
| patronMemberCharge | Number | Fee for patron members |
| lifetimeMemberCharge | Number | Fee for lifetime members |
| nonCKCAMemberCharge | Number | Fee for non-members |
| isAnnualConference | Boolean | Affects payment redirect page |
| shouldAllowRegistrationWithoutPayment | Boolean | |
| hasCPEHours | Boolean | Continuing Professional Education credit |
| eventMaxParticipants | Number | |
| eventTopics | [String] | |
| eventSpeakers | [String] | |
| eventEmailNotes | String | Notes included in confirmation emails |
| earlyBirdDate | Date | Early bird pricing cutoff |
| attachmentURL | [String] | Cloudinary URLs for event attachments |
| attachmentName | [String] | Display names for attachments |
| contactPerson1Name / contactPerson1Mobile | String | |
| contactPerson2Name / contactPerson2Mobile | String | |
| createdAt / updatedAt | Date | Auto-managed timestamps |

### 6.3 EventRegistration (Join Table)

| Field | Type | Details |
|-------|------|---------|
| eventId | ObjectId → Event | **Required** |
| memberId | ObjectId → Member | **Required** |
| registrationDate | Date | Defaults to `Date.now` |
| status | String | Enum: `pending`, `confirmed`, `cancelled` (default: `confirmed`) |
| transactionRefNo | ObjectId → MemberPayment | Optional payment link |
| transactionAmount | Number | Amount actually paid |
| eventAmount | Number | Event fee at time of registration |
| currentPendingAmount | Number | Member's pending amount at registration time |
| referredBy | String | Referral info |
| memberType | String | Enum: `member`, `non-member`, `patron`, `lifetime-member` |
| paymentStatus | String | Enum: `paid`, `unpaid`, `pending`, `not-needed` (default: `pending`) |
| remarks | String | Registration notes |
| deregistrationRemarks | String | Notes when cancelled |
| createdAt / updatedAt | Date | Auto-managed timestamps |

### 6.4 MemberPayment

| Field | Type | Details |
|-------|------|---------|
| memberId | ObjectId → Member | |
| iciciPaymentRequestId | ObjectId → ICICIPaymentRequest | |
| iciciPaymentResponseId | ObjectId → ICICIPaymentResponse | |
| paymentStatus | String | Enum: `paid`, `unpaid`, `pending` |
| createdAt / updatedAt | Date | Auto-managed timestamps |

### 6.5 ICICIPaymentRequest

| Field | Type | Details |
|-------|------|---------|
| memberId | ObjectId → Member | |
| icaiMembershipNo | String | |
| ckscMembershipNo | String | |
| name | String | |
| email | String | |
| mobile | String | |
| address | String | |
| pan | String | PAN card number |
| amount | Number | Original amount |
| amountAfterWaiver | Number | Amount after any waiver (default: 0) |
| ckscReferenceNo | String | Unique timestamp-based reference (e.g. `17088456320001234`) |
| paymentType | String | E.g. `New Member`, `Event`, `Annual Conference`, `MembershipTotal`, `EventOnly` |
| paymentDescription | String | Event name for one-time payments |
| paymentRemarks | String | |
| createdAt / updatedAt | Date | Auto-managed timestamps |

### 6.6 ICICIPaymentResponse

| Field | Type | Details |
|-------|------|---------|
| iciciPaymentRequestId | ObjectId | |
| ckscReferenceNo | String | Maps back to request |
| responseCode | String | `E000` = success; see error code table in bank-controller |
| iciciReferenceNo | String | Bank's transaction reference |
| serviceTaxAmount | String | |
| processingFeeAmount | String | |
| totalAmount | Number | |
| transactionAmount | String | |
| transactionDate | String | |
| interchangeValue | Number | |
| tdr | String | |
| paymentMode | String | |
| submerchantId | String | |
| tps | String | |
| id | String | |
| rs | String | |
| createdAt / updatedAt | Date | Auto-managed timestamps |

### 6.7 AdminUser

| Field | Type | Details |
|-------|------|---------|
| username | String | **Required**, unique |
| password | String | **Required**, bcrypt hashed |
| email | String | **Required**, unique |
| resetPasswordToken | String | Crypto random hex (32 bytes), nullable |
| resetPasswordExpires | Date | Token expiry (1 hour), nullable |
| createdAt / updatedAt | Date | Auto-managed timestamps |

### 6.8 Venue

| Field | Type | Details |
|-------|------|---------|
| name | String | **Required** |
| address | String | **Required** |
| active | Boolean | |
| createdAt / updatedAt | Date | Auto-managed timestamps |

---

## 7. Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│   AdminUser  │       │       Member         │       │       Venue         │
│              │       │                      │       │                     │
│ username     │       │ name                 │◄──┐   │ name                │
│ password     │       │ icaiMembershipNo     │   │   │ address             │
│ email        │       │ ckscMembershipNo     │   │   │ active              │
│ resetToken   │       │ pendingAmount        │   │   └─────────┬───────────┘
└──────────────┘       │ mobile / email       │   │             │
                       │ status / type        │   │             │ eventVenue
                       └──────────┬───────────┘   │             │
                                  │               │             ▼
                                  │ memberId      │   ┌─────────────────────┐
                    ┌─────────────┤               │   │       Event         │
                    │             │               │   │                     │
                    ▼             ▼               │   │ eventName           │
          ┌─────────────────┐  ┌────────────────────┐│ eventStartDate      │
          │  MemberPayment  │  │ EventRegistration  ││ charges (4 types)   │
          │                 │  │                    ││ isAnnualConference  │
          │ memberId ──────►│  │ eventId ──────────►││ speakers / topics   │
          │ paymentRequestId│  │ memberId ──────────┘│ attachments         │
          │ paymentResponseId│ │ status              │└─────────────────────┘
          │ paymentStatus   │  │ paymentStatus       │
          └────────┬────────┘  │ transactionRefNo ──►│ (→ MemberPayment)
                   │           └────────────────────┘
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
┌─────────────────────┐ ┌─────────────────────┐
│ ICICIPaymentRequest │ │ ICICIPaymentResponse│
│                     │ │                     │
│ memberId            │ │ responseCode        │
│ amount              │ │ iciciReferenceNo    │
│ amountAfterWaiver   │ │ transactionAmount   │
│ ckscReferenceNo     │ │ ckscReferenceNo     │
│ paymentType         │ │ paymentMode         │
│ paymentDescription  │ │ transactionDate     │
└─────────────────────┘ └─────────────────────┘
```

---

## 8. API Routes Reference

All API routes are prefixed with `/api` (except `/health`).

### 8.1 Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check, returns server status |

### 8.2 Admin Users (`/api/admin-users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | None (whitelisted) | Login, returns JWT `accessToken` |
| POST | `/reset/initiate` | None (whitelisted) | Send password reset email with token link |
| GET | `/reset/:token/verify` | None (whitelisted) | Verify reset token is valid and not expired |
| POST | `/reset/:token` | None (whitelisted) | Set new password using token |
| POST | `/` | JWT | Create new admin user |

### 8.3 Members (`/api/members`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | Fetch all members |
| POST | `/` | JWT | Create single member |
| GET | `/active` | JWT | Fetch active members only |
| POST | `/register-to-event` | JWT | Register multiple members to an event (bulk) |
| POST | `/add` | JWT | Create multiple members (bulk insert) |
| GET | `/checkCKSCMembershipNo/:ckscMembershipNo` | JWT | Check if CKSC number exists |
| GET | `/checkICAIMembershipNo/:icaiMembershipNo` | JWT | Check if ICAI number exists |
| POST | `/replace` | JWT | Upsert members data (match by ICAI + CKSC number) |
| PUT | `/modify/:id` | JWT | Update member by ID |
| DELETE | `/modify/:id` | JWT | Soft-delete member (sets status to `deleted`) |
| PUT | `/update-multiple` | JWT | Batch update members (CKSC numbers, inactivation) |
| GET | `/fetchPendingAmount/:icaiMembershipNo` | None (whitelisted) | Get pending amount + JWT (by ICAI number or mobile) |
| GET | `/fetchPendingAmount/:icaiMembershipNo/:eventIdForRegistration` | None (whitelisted) | Get pending amount + event registration check |
| GET | `/events/:memberId` | JWT | Fetch events a member is registered for |
| GET | `/:memberId/transactions` | JWT | Fetch member's payment transaction history |
| PATCH | `/:memberId/event/:eventId` | JWT | Update event registration fields |
| PATCH | `/:memberId/event/:eventId/remove` | JWT | Cancel event registration (soft delete) |

### 8.4 Events (`/api/events`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/venues` | JWT | Fetch all venues |
| POST | `/venues/add` | JWT | Create venue |
| PUT | `/venues/modify/:id` | JWT | Update venue |
| DELETE | `/venues/modify/:id` | JWT | Delete venue |
| GET | `/` | JWT | Fetch all events (sorted by start date desc) |
| GET | `/fetchUpcomingEvents` | None (whitelisted) | Fetch future events with registration counts |
| GET | `/:eventId/members` | JWT | Fetch members registered for an event |
| POST | `/add` | JWT | Create event |
| PUT | `/modify/:id` | JWT | Update event |
| DELETE | `/modify/:id` | JWT | Delete event |
| POST | `/register` | None (whitelisted) | Register member to event (public) |

### 8.5 Bank / Payments (`/api/bank`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/fetchPaymentRequestURL` | JWT | Generate ICICI payment URL for existing members |
| POST | `/receivePaymentResponse` | None (whitelisted) | ICICI callback — process payment result, redirect to response page |
| POST | `/fetchOneTimePaymentRequestURL` | None (whitelisted) | Generate ICICI payment URL for one-time payments (new members) |
| POST | `/receiveOneTimePaymentResponse` | None (whitelisted) | ICICI callback for one-time payments |
| POST | `/registerOneTimeMember` | None (whitelisted) | Register one-time member + create event registration (no payment gateway) |
| GET | `/` | JWT | Get next available CKSC membership number |

### 8.6 ICICI Legacy (`/api/icici`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/fetchPaymentRequestURL` | JWT | Legacy payment URL generation |
| POST | `/receivePaymentResponse` | JWT | Legacy payment callback |
| POST | `/fetchOneTimePaymentRequestURL` | JWT | Legacy one-time payment URL |
| POST | `/receiveOneTimePaymentResponse` | JWT | Legacy one-time payment callback |
| POST | `/verifyTransaction` | JWT | Transaction verification (not fully implemented) |

### 8.7 Transactions (`/api/transactions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | Fetch transactions (query params: `fromDate`, `toDate`) |

### 8.8 Email (`/api/emailService`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sendCKCAEmail` | JWT | Send email via Nodemailer (CKCA Gmail account) |
| POST | `/sendCKCAEmailResend` | JWT | Send email via Resend API (`noreply@centralkolkata.org`) |
| POST | `/sendEmailForAKP` | JWT | Send email via Nodemailer (AKP Gmail account) |

### 8.9 SMS (`/api/sms`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sendSMS` | JWT | Send SMS via external SMS provider |

### 8.10 WhatsApp (`/api/whatsapp`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sendWhatsAppMessage` | JWT | Send WhatsApp message via Twilio |

### 8.11 Reports (`/api/reports`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/fetchAllPaymentDetails` | JWT | Generate HTML table of all payment details |
| GET | `/fetchAllMembers` | JWT | Generate HTML table of all members |

### 8.12 Upload (`/api/upload`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/uploadFile` | JWT | Upload single file to Cloudinary (multipart) |

---

## 9. Authentication & Security

### 9.1 JWT Authentication Flow

```
Admin Login → POST /api/admin-users/login
  ├── Validates username/email + password (bcrypt compare)
  ├── Generates JWT (payload: { id, username, email }, expires: 1h)
  └── Returns: { accessToken: "<jwt>" }

Subsequent Requests → Authorization: Bearer <jwt>
  ├── auth-middleware.js verifies token
  ├── Attaches decoded payload to req.user
  └── Returns 401 if invalid/expired/missing
```

### 9.2 Public Website Authentication

Requests from `centralkolkata.org` (checked via `Origin` or `Referer` header) bypass JWT entirely.

The `fetchPendingAmount` endpoint also generates a short-lived JWT (1h) for the member, containing `{ id, icaiMembershipNo, ckscMembershipNo }`. This token is used for subsequent payment operations during the same session.

### 9.3 JWT Whitelist (No Auth Required)

These routes are accessible without any token:

- `/api/admin-users/login`
- `/api/admin-users/reset/initiate`
- `/api/admin-users/reset/:token/verify`
- `/api/admin-users/reset/:token`
- `/api/bank/receiveOneTimePaymentResponse`
- `/api/bank/receivePaymentResponse`
- `/api/events/fetchUpcomingEvents`
- `/api/members/fetchPendingAmount/:param1` (and with 2 params)
- `/api/bank/fetchOneTimePaymentRequestURL`
- `/api/bank/registerOneTimeMember`
- `/api/events/register`

### 9.4 Password Reset Flow

1. Admin requests reset via `POST /api/admin-users/reset/initiate` (sends username or email)
2. System generates 32-byte crypto hex token, stores in `resetPasswordToken` with 1h expiry
3. Sends email to admin with link: `{FRONTEND_BASE_URL}/admin/reset-password/{token}`
4. Admin clicks link → frontend calls `GET /api/admin-users/reset/:token/verify`
5. Admin submits new password → `POST /api/admin-users/reset/:token` (hashes with bcrypt, clears token)

### 9.5 Encryption

- **ICICI payment data:** AES-128-ECB encryption using `ICICI_AES_ENCRYPTION_KEY`
- **Fields encrypted:** mandatory fields, return URL, reference number, sub-merchant ID, transaction amount, pay mode
- **Password storage:** bcrypt with 10 salt rounds

### 9.6 CORS

- `cors()` middleware allows all origins
- Additional manual headers set `Access-Control-Allow-Origin: *`
- Body size limit: 50MB (JSON)

---

## 10. Key Business Flows

### 10.1 Existing Member Payment Flow

```
1. Member visits centralkolkata.org
2. Enters ICAI membership number or mobile → GET /api/members/fetchPendingAmount/:id
3. API returns member data, pending amount, and a short-lived JWT
4. Member fills payment form → POST /api/bank/fetchPaymentRequestURL
5. API creates ICICIPaymentRequest record, constructs encrypted payment URL
6. Member is redirected to ICICI payment gateway
7. ICICI sends callback → POST /api/bank/receivePaymentResponse
8. API creates ICICIPaymentResponse, MemberPayment records
9. If successful (E000):
   - Updates member type (new-member → member) and status (inactive → active)
   - Reduces pending amount
10. Redirects to payment-response.html (or annual-payment-response.html) with result query string
```

### 10.2 One-Time / Non-Member Payment Flow

```
1. Non-member visits centralkolkata.org for an event
2. Fills registration form → POST /api/bank/fetchOneTimePaymentRequestURL
3. API creates new Member (type: non-member or new-member, status: inactive)
4. Creates ICICIPaymentRequest, constructs encrypted payment URL
5. Redirected to ICICI gateway
6. ICICI callback → POST /api/bank/receiveOneTimePaymentResponse
7. Same processing as above; non-member pendingAmount set to 0
```

### 10.3 Free Event Registration (No Payment)

```
1. Non-member registers for free event → POST /api/bank/registerOneTimeMember
2. API creates Member (type: non-member), EventRegistration (paymentStatus: unpaid)
3. Returns event, member, venue details + JWT
```

### 10.4 Admin Event Registration (Bulk)

```
1. Admin selects members in dashboard → POST /api/members/register-to-event
2. API validates event exists, checks each member exists and isn't already registered
3. Creates EventRegistration records with status: confirmed
4. Returns success count + any errors
```

### 10.5 CKSC Membership Number Format

- Format: `CKSC-NNNN` (e.g. `CKSC-0042`, `CKSC-1234`)
- Auto-increment: `getNextCKSCMembershipNo()` aggregates max numeric part + 1
- Standardization: zero-pads to 4 digits (e.g. `CKSC-42` → `CKSC-0042`)

### 10.6 Pending Amount Lookup Logic

The `fetchPendingAmount` endpoint uses a two-step priority search:
1. First searches for members with type `member`, `patron`, or `lifetime-member`
2. If not found, falls back to `non-member` or `new-member`
3. Supports lookup by ICAI membership number, or by mobile (if param length is 10)

---

## 11. Third-Party Service Integrations

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **MongoDB Atlas** | Database | `MONGO_URI` connection string |
| **ICICI Bank Payment Gateway** | Online payments | Merchant ID, AES key, pay URL, return URLs |
| **Cloudinary** | File/image hosting | Cloud name, API key, API secret |
| **Resend** | Email delivery (primary) | `RESEND_API_KEY`, sends from `noreply@centralkolkata.org` |
| **Gmail SMTP (Nodemailer)** | Email delivery (fallback) | App password auth, CKCA + AKP accounts |
| **Twilio** | WhatsApp messaging | `TWILIO_SID`, `TWILIO_SECRET` |
| **External SMS Provider** | SMS sending | `SMS_KEY`, `SMS_SENDER`, `SMS_BASE_URL` |
| **Railway** | API hosting | Procfile deployment, dynamic port |
| **Netlify** | Frontend hosting | Static site |
| **AWS Amplify** | Admin panel hosting | React SPA build + deploy |

---

## 12. Environment Variables

### 12.1 APIs (Railway)

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (Railway sets automatically) |
| `NODE_ENV` | `production` / `development` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `BACKEND_BASE_URL` | Full API base URL (e.g. `https://cksc-backend-apis-production.up.railway.app`) |
| `CKSC_BASE_URL` | centralkolkata.org URL (e.g. `https://centralkolkata.org`) |
| `FRONTEND_BASE_URL` | admin-panel URL (for password reset links) |

**ICICI Payment Gateway:**

| Variable | Purpose |
|----------|---------|
| `ICICI_MERCHANT_ID` | Merchant ID |
| `ICICI_SUB_MERCHANT_ID` | Sub-merchant ID |
| `ICICI_PAY_URL` | Payment gateway base URL |
| `ICICI_RETURN_URL` | Return path for recurring member payments |
| `ICICI_ONETIME_RU` | Return path for one-time payments |
| `ICICI_PAYMODE` | Payment mode |
| `ICICI_AES_ENCRYPTION_KEY` | AES-128-ECB encryption key |

**Email Services:**

| Variable | Purpose |
|----------|---------|
| `GOOGLE_EMAIL` | CKCA Gmail address |
| `GOOGLE_EMAIL_APP_PASSWORD` | CKCA Gmail app password |
| `GOOGLE_EMAIL_AKP` | AKP Gmail address |
| `GOOGLE_EMAIL_AKP_APP_PASSWORD` | AKP Gmail app password |
| `RESEND_API_KEY` | Resend email service API key |

**Cloudinary:**

| Variable | Purpose |
|----------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

**SMS:**

| Variable | Purpose |
|----------|---------|
| `SMS_KEY` | SMS provider API key |
| `SMS_SENDER` | SMS sender ID |
| `SMS_BASE_URL` | SMS API base URL |

**Twilio:**

| Variable | Purpose |
|----------|---------|
| `TWILIO_SID` | Twilio account SID |
| `TWILIO_SECRET` | Twilio auth token |

**Other:**

| Variable | Purpose |
|----------|---------|
| `HASH_REQUEST_ENCRYPTION_KEY` | Request hash key (legacy) |
| `HASH_RESPONSE_ENCRYPTION_KEY` | Response hash key (legacy) |
| `CLIENT_CODE` | Client code (legacy) |
| `CUST_ACC` | Customer account (legacy) |

### 12.2 centralkolkata.org (Netlify)

- **constants.js:** `CKSC_BACKEND_APIS_URL` — hardcoded or overridden at build time.

### 12.3 admin-panel (AWS Amplify)

| Variable | Purpose |
|----------|---------|
| `REACT_APP_CKSC_API_BASE_URL` | Full API base URL including `/api` (e.g. `https://cksc-backend-apis-production.up.railway.app/api`) |

---

## 13. Middleware Pipeline

The Express middleware chain in `server.js` executes in this order:

```
1. cors()                          → Allow all origins
2. Custom CORS headers             → Set Access-Control-Allow-* headers
3. express.json({ limit: '50mb' }) → Parse JSON bodies up to 50MB
4. express.urlencoded()            → Parse URL-encoded bodies
5. /health routes                  → Health check (no auth)
6. Auth gate:                      → Check JWT whitelist and origin
   ├── If whitelisted route → next()
   ├── If centralkolkata.org origin → next()
   └── Otherwise → authenticateJWT(req, res, next)
7. API routes                      → All /api/* route handlers
8. errorHandler                    → Global error handler (status + message + stack in dev)
```

---

## 14. Error Handling

### Custom Error Classes (`middlewares/errors.js`)

| Class | Status Code | Use Case |
|-------|-------------|----------|
| `DatabaseError` | 500 | Database operation failures |
| `NotFoundError` | 404 | Resource not found |
| `ValidationError` | 400 | Input validation failures |

### Global Error Handler (`middlewares/error-middleware.js`)

- Sets status code from `error.statusCode` or defaults to 500
- Returns JSON: `{ message, stack }` (stack only in non-production)

### Async Error Handling

All controller functions are wrapped with `express-async-handler` to automatically catch and forward async errors to the global error handler.

---

## 15. Hosting & Deployment

### 15.1 centralkolkata.org — Netlify

- Static site (HTML, CSS, JS, images)
- Deploy via Netlify CLI, Git integration, or drag-and-drop
- No build step unless configured
- Ensure `constants.js` points to production API URL

### 15.2 APIs — Railway

- **Procfile:** `web: npm start`
- Deploy via Railway Git integration or CLI
- Set all environment variables in Railway dashboard
- MongoDB Atlas: whitelist Railway IPs or use `0.0.0.0/0`
- **Production URL:** `https://cksc-backend-apis-production.up.railway.app`

### 15.3 admin-panel — AWS Amplify

- React SPA; build command: `npm run build`
- Output directory: `build`
- Set `REACT_APP_CKSC_API_BASE_URL` in Amplify environment variables
- Configure SPA redirects for client-side routing (`/*` → `index.html`)
- Password reset links use `FRONTEND_BASE_URL` — set this in APIs env to the Amplify app URL

---

## 16. Integration Flow Summary

### Public Website → APIs

- Members use centralkolkata.org for membership, events, payments
- All requests include `Origin: https://centralkolkata.org` → whitelisted
- Payment callbacks from ICICI hit APIs directly (whitelisted routes)
- Successful payments redirect back to centralkolkata.org response pages

### Admin Panel → APIs

- Admin logs in via `POST /api/admin-users/login` → receives JWT
- All subsequent requests include `Authorization: Bearer <token>`
- 401 response → redirect to login page

### APIs → External Services

- MongoDB Atlas (data persistence)
- ICICI Bank (payment processing via encrypted URLs)
- Cloudinary (file/image uploads)
- Resend / Nodemailer (email delivery, BCC to `cksc.suvishakha@gmail.com`)
- Twilio (WhatsApp messaging)
- SMS provider (SMS delivery)

---

## 17. Workspace Structure (Full CKCA Project)

```
CKCA/
├── centralkolkata.org/     # Netlify-hosted public site
├── apis/                   # Railway-hosted backend (this repo)
│   ├── docs/               # Documentation
│   ├── config/             # Database, Cloudinary, Multer
│   ├── controllers/        # Business logic (12 controllers)
│   ├── middlewares/         # Auth, errors
│   ├── models/             # Mongoose schemas (8 models)
│   ├── routes/             # Express route files (12)
│   └── server.js           # Entry point
└── admin-panel/            # AWS Amplify-hosted React app
```

---

## 18. Quick Reference URLs

| Purpose | URL |
|---------|-----|
| APIs (production) | https://cksc-backend-apis-production.up.railway.app |
| APIs health check | https://cksc-backend-apis-production.up.railway.app/health |
| Public website | https://centralkolkata.org |
| Admin panel | (Amplify app URL — set in Amplify console) |

---

*Last updated: February 2026*
