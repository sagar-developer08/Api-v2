# School SaaS – Registration, Setup & Access API

Node.js API implementing the **School SaaS – Registration, Setup & Access Flow** specification: registration with OTP verification, setup wizard, admin approval, and login with School Code + Email + Password.

## Features

- **School Registration**: School name, admin name, mobile, email, password → OTP (email) → verify → School created (Pending Setup), unique School Code generated
- **Setup Wizard** (4 steps, progress saved): Basic Info → Academic Structure → Branch Setup → Review & Finish → status **Pending Admin Approval**, setup locked
- **Super Admin Approval**: List schools, view details, approve or reject
- **Login**: School Code + Email + Password; allowed only when status = **Approved**
- **Dashboard-style access**: Status-based access; profile and setup wizard available to school admin

## Tech Stack

- **Node.js**, **Express**, **MongoDB** (Mongoose), **JWT**, **bcryptjs**, **express-validator**, **nodemailer**, **dotenv**

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` and fill in values.
   - Required: `MONGODB_URI`, `JWT_SECRET`, `PORT`.
   - For OTP and password reset: `EMAIL_*`, `FRONTEND_URL`.

3. **Seed Super Admin** (for approval flow)
   ```bash
   npm run seed:superadmin
   ```
   Uses `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `.env`, or defaults.

4. **Run**
   ```bash
   npm run dev   # development
   npm start     # production
   ```

## API Endpoints

Base URL: `http://localhost:3000` (or your `PORT`).

### 1. Registration & OTP

**Register (send OTP)**  
`POST /api/auth/register`

```json
{
  "schoolName": "Demo School",
  "adminName": "John Doe",
  "mobileNumber": "9876543210",
  "email": "admin@demoschool.com",
  "password": "SecurePass1",
  "confirmPassword": "SecurePass1"
}
```

- Password: min 8 chars, at least one letter and one number.
- Email and mobile must be unique.
- Responds with `email`, `mobileNumber`, `expiresAt`. OTP is sent to email.

**Verify OTP & complete registration**  
`POST /api/auth/verify-otp`

```json
{
  "email": "admin@demoschool.com",
  "otp": "123456",
  "schoolName": "Demo School",
  "adminName": "John Doe",
  "mobileNumber": "9876543210",
  "password": "SecurePass1"
}
```

- On success: creates School (status **Pending Setup**), Admin, generates **School Code**. Returns `token`, `schoolId`, `schoolCode`, `admin`. Use token for Setup Wizard.

---

### 2. Login (School Admin)

**Login**  
`POST /api/auth/login`

```json
{
  "schoolCode": "XXXXXXXX",
  "email": "admin@demoschool.com",
  "password": "SecurePass1"
}
```

- Allowed only if school **status = Approved**.
- Otherwise returns `403` with a message (e.g. complete setup, awaiting approval, rejected).

---

### 3. Setup Wizard

All wizard routes require `Authorization: Bearer <token>` (school admin token from register or login).  
`schoolId` is the same as returned after verify-otp.

**Get wizard state**  
`GET /api/schools/:schoolId/setup-wizard`

Returns current step, saved data, and related `academicYears`, `classes`, `sections`, `branches`. After finish, same URL returns read-only summary.

**Step 1 – Basic Information**  
`PUT /api/schools/:schoolId/setup-wizard/step/1`

```json
{
  "schoolName": "Demo School",
  "schoolType": "School",
  "boardCurriculum": "CBSE",
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai",
  "timezone": "Asia/Kolkata",
  "academicYearStartMonth": "June"
}
```

**Step 2 – Academic Structure**  
`PUT /api/schools/:schoolId/setup-wizard/step/2`

```json
{
  "academicYear": "2026-2027",
  "classesOffered": ["Pre-KG", "LKG", "UKG", "Class 1", "Class 2"],
  "defaultSections": ["A", "B", "C"]
}
```

- `classesOffered`: subset of Pre-KG … Class 12.
- `defaultSections`: optional.

**Step 3 – Branch Setup**  
`PUT /api/schools/:schoolId/setup-wizard/step/3`

```json
{
  "mainBranchName": "Demo School Main",
  "branchCity": "Mumbai"
}
```

- At least one branch (main) is required before finish.

**Step 4 – Review & Finish**  
`POST /api/schools/:schoolId/setup-wizard/finish`

- No body. Sets status to **Pending Admin Approval** and locks setup.

---

### 4. Super Admin

**Login**  
`POST /api/super-admin/login`

```json
{
  "email": "superadmin@schoolsaas.com",
  "password": "SuperAdmin123!"
}
```

Returns `token` (use as `Authorization: Bearer <token>` for below).

**List schools**  
`GET /api/super-admin/schools?status=Pending Admin Approval`

**Get school details**  
`GET /api/super-admin/schools/:schoolId`

**Approve school**  
`POST /api/super-admin/schools/:schoolId/approve`

```json
{ "remarks": "Optional" }
```

**Reject school**  
`POST /api/super-admin/schools/:schoolId/reject`

```json
{ "remarks": "Optional" }
```

---

### 5. Other Auth

**Profile**  
`GET /api/auth/profile`  
`Authorization: Bearer <token>`

**Forgot password**  
`POST /api/auth/forgot-password`  
Body: `{ "email": "..." }`

**Reset password**  
`POST /api/auth/reset-password`  
Body: `{ "token": "...", "password": "...", "confirmPassword": "..." }`

---

### 6. Health

`GET /api/health`

---

## Status Flow

| Status                 | Description                                      |
|------------------------|--------------------------------------------------|
| Pending Setup          | Registered; setup wizard not finished            |
| Pending Admin Approval | Setup complete; waiting for super admin          |
| Approved               | Can login (School Code + Email + Password)       |
| Rejected               | Access blocked                                  |

## Database Models (high-level)

- **School**: status, setup step, locked, basic info, `adminId`, `schoolCode`
- **Admin**: school admin; `schoolId`, email, mobile, password, verification flags
- **SuperAdmin**: platform super admin
- **AcademicYear**, **Class**, **Section**, **Branch**: setup wizard data
- **ApprovalLog**: approval/reject actions
- **OTPVerification**: registration OTP
- **PasswordReset**: forgot-password tokens

## Security

- Passwords hashed with bcrypt.
- JWT for school admin and super admin (role in payload).
- Status-based access: login only when Approved; setup wizard only for own school.
- Input validation via express-validator.

## License

ISC
