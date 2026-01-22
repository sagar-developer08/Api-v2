# Vidyadhyayan School Registration API

A comprehensive Node.js API for managing multi-step school registration process for the Vidyadhyayan platform.

## Features

- **Multi-step School Registration:**
  - Step 1: School Details
  - Step 2: Address & Contact
  - Step 3: Admin Account Creation
  - Step 4: Legal & Setup
  - Step 5: Modules & Plan

- **Authentication:**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Protected routes

- **Password Reset:**
  - Forgot password functionality
  - Email-based password reset with secure tokens
  - Token expiration (1 hour)

- **Data Validation:**
  - Comprehensive input validation
  - Email format validation
  - Phone number validation
  - GST and PAN number format validation

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **nodemailer** - Email service
- **dotenv** - Environment variables

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vidhyadhan
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vidhyadhan
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@vidhyadhan.com
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### School Registration

#### Step 1: Create School Details
```
POST /api/schools
Content-Type: application/json

{
  "schoolName": "Greenwood High School",
  "schoolCode": "GHS001",
  "schoolType": "Higher Secondary",
  "boardAffiliation": "CBSE",
  "mediumOfInstruction": "English",
  "academicYearStartMonth": "April",
  "establishmentYear": 1995
}
```

#### Step 2: Update Address & Contact
```
PUT /api/schools/:schoolId/address-contact
Content-Type: application/json

{
  "addressLine1": "123 Main Street",
  "addressLine2": "Near Park",
  "city": "Mumbai",
  "district": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "timezone": "Asia/Kolkata",
  "officialEmail": "info@greenwood.edu",
  "primaryPhoneNumber": "9876543210",
  "alternatePhoneNumber": "9876543211",
  "websiteURL": "https://greenwood.edu"
}
```

#### Step 3: Create Admin Account
```
POST /api/schools/:schoolId/admin
Content-Type: application/json

{
  "adminFullName": "John Doe",
  "adminEmail": "admin@greenwood.edu",
  "adminMobileNumber": "9876543210",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Step 4: Update Legal & Setup
```
PUT /api/schools/:schoolId/legal-setup
Authorization: Bearer <token>
Content-Type: application/json

{
  "schoolRegistrationNumber": "REG123456",
  "affiliationNumber": "AFF789012",
  "udiseCode": "UDISE123",
  "gstNumber": "27ABCDE1234F1Z5",
  "panNumber": "ABCDE1234F",
  "trustSocietyName": "Greenwood Trust",
  "classesOffered": "Pre-Primary to Class XII",
  "streams": "Science, Commerce, Arts",
  "sectionsPerClass": "A,B,C",
  "gradingSystem": "Percentage",
  "examPattern": "Annual"
}
```

#### Step 5: Update Modules & Plan
```
PUT /api/schools/:schoolId/modules-plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "modules": ["Student Management", "Fee Management", "Attendance"],
  "plan": "Premium"
}
```

#### Get School Status
```
GET /api/schools/:schoolId/status
Authorization: Bearer <token>
```

### Authentication

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@greenwood.edu",
  "password": "password123"
}
```

#### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@greenwood.edu"
}
```

#### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // For validation errors
}
```

## Database Models

### School
- School details, address, contact, legal information
- Registration step tracking
- Admin reference

### Admin
- Admin account information
- Password (hashed)
- School reference

### PasswordReset
- Reset tokens
- Email association
- Expiration tracking

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Secure password reset tokens
- Email verification for password reset

## Development

The API uses:
- Express.js for routing
- Mongoose for database operations
- express-validator for validation
- JWT for authentication
- Nodemailer for email services

## License

ISC
