# API Requirements by Application

## Overview
This document provides comprehensive API requirements organized by application. Each section details the features, functionality, and required API endpoints for the backend team to implement.

**Base URL**: `http://localhost:8080/api` (Development) or `https://vidhyaapi.sagecrafts.in/api` (Production)

**Authentication**: All endpoints (except auth endpoints) require Bearer token authentication:
```
Authorization: Bearer <token>
```

**Common Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Pagination Format**:
```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

## Table of Contents

1. [Auth Application](#1-auth-application)
2. [Super Admin Application](#2-super-admin-application)
3. [Admin Application](#3-admin-application)
4. [Teacher Application](#4-teacher-application)
5. [Student Application](#5-student-application)
6. [Parent Application](#6-parent-application)
7. [Staff HR Application](#7-staff-hr-application)
8. [Fees Management Application](#8-fees-management-application)
9. [Online Learning Application](#9-online-learning-application)
10. [Transport Application](#10-transport-application)
11. [Marketing Application](#11-marketing-application)

---

## 1. Auth Application

### Purpose
Handles authentication, registration, password management, and OTP verification for all user types.

### Features
- School/Tenant Registration
- User Login (Admin, Super Admin, Teacher, Student, Parent)
- OTP Verification
- Forgot Password
- Reset Password
- Email Verification

### API Endpoints

#### 1.1 Registration
```
POST /api/v1/auth/register
```
**Request Body**:
```json
{
  "schoolName": "string",
  "adminName": "string",
  "mobileNumber": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "OTP sent to email",
  "data": {
    "email": "string"
  }
}
```

#### 1.2 OTP Verification
```
POST /api/v1/auth/verify-otp
```
**Request Body**:
```json
{
  "email": "string",
  "otp": "string",
  "schoolName": "string",
  "adminName": "string",
  "mobileNumber": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "schoolId": "string",
    "schoolCode": "string",
    "schoolName": "string",
    "isSetup": false,
    "admin": {
      "id": "string",
      "fullName": "string",
      "email": "string",
      "mobileNumber": "string"
    },
    "token": "string"
  }
}
```

#### 1.3 Login (Regular Users)
```
POST /api/v1/auth/login
```
**Request Body**:
```json
{
  "schoolCode": "string",
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "ADMIN" | "TEACHER" | "STUDENT" | "PARENT",
      "schoolId": "string",
      "schoolName": "string",
      "tenantId": "string"
    }
  }
}
```

#### 1.4 Super Admin Login
```
POST /api/super-admin/login
```
**Note**: This endpoint does NOT use `/v1` prefix
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "SUPERADMIN" | "SUPER_ADMIN",
      "tenantId": "string"
    }
  }
}
```

#### 1.5 Forgot Password
```
POST /api/v1/auth/forgot-password
```
**Request Body**:
```json
{
  "email": "string"
}
```

#### 1.6 Reset Password
```
POST /api/v1/auth/reset-password
```
**Request Body**:
```json
{
  "token": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

#### 1.7 Resend OTP
```
POST /api/v1/auth/resend-otp
```
**Request Body**:
```json
{
  "email": "string"
}
```

---

## 2. Super Admin Application

### Purpose
Platform-level administration for managing schools (tenants), users, features, platform operations, and system-wide settings.

### Features
- Dashboard with platform metrics
- Tenant (School) Management (CRUD, Approve/Reject)
- User Management (School Admin accounts)
- Feature Configuration (Toggle features per tenant)
- Platform Operations (Jobs, Queues, Maintenance)
- Audit Logs
- Support & Impersonation
- Settings Management

### API Endpoints

#### 2.1 Dashboard
```
GET /api/super-admin/dashboard
```
**Response**:
```json
{
  "success": true,
  "data": {
    "totalTenants": 100,
    "activeTenants": 85,
    "pendingApprovals": 5,
    "totalUsers": 5000,
    "platformHealth": "healthy",
    "recentActivity": [...]
  }
}
```

#### 2.2 Tenant Management

##### List All Schools/Tenants
```
GET /api/super-admin/schools?page=1&limit=10&search=&status=
```
**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by school name, code, admin name
- `status` (optional): Filter by status (all, Pending Admin Approval, Approved, Active, Suspended)

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "string",
        "schoolName": "string",
        "schoolCode": "string",
        "status": "Pending Admin Approval" | "Approved" | "Active" | "Suspended" | "Rejected",
        "adminId": {
          "_id": "string",
          "fullName": "string",
          "email": "string",
          "mobileNumber": "string"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        // ... other school fields
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

##### Get School by ID
```
GET /api/super-admin/schools/:id
```
**Response**: Full school object with all details including:
- Basic information (name, code, type, establishment year, etc.)
- Contact information (emails, phones, website)
- Location (address, city, state, country, timezone)
- Academic information (capacity, academic year, classes, sections)
- Principal information
- Admin Officer information
- Admin information
- Tax information (Tax ID, GST)
- Bank details
- Policies
- Academic years
- Classes
- Sections
- Branches

##### Approve School
```
POST /api/super-admin/schools/:id/approve
```
**Request Body**:
```json
{
  "remarks": "string (optional)"
}
```
**Response**:
```json
{
  "success": true,
  "message": "School approved successfully",
  "data": {
    "success": true,
    "message": "string",
    "data": { /* updated school object */ }
  }
}
```

##### Reject School
```
POST /api/super-admin/schools/:id/reject
```
**Request Body**:
```json
{
  "remarks": "string (required)"
}
```

##### Create School (Optional - if needed)
```
POST /api/super-admin/schools
```
**Request Body**: Full school creation DTO

##### Update School
```
PUT /api/super-admin/schools/:id
```
**Request Body**: Partial school update DTO

##### Delete School
```
DELETE /api/super-admin/schools/:id
```

#### 2.3 User Management

##### List All Users
```
GET /api/super-admin/users?page=1&limit=10&search=&role=&tenantId=
```
**Query Parameters**:
- `page`, `limit`, `search` (standard pagination)
- `role` (optional): Filter by role
- `tenantId` (optional): Filter by tenant

##### Get User by ID
```
GET /api/super-admin/users/:id
```

##### Create User
```
POST /api/super-admin/users
```

##### Update User
```
PUT /api/super-admin/users/:id
```

##### Delete User
```
DELETE /api/super-admin/users/:id
```

#### 2.4 Feature Configuration

##### Get Feature Config for Tenant
```
GET /api/super-admin/feature-config/:tenantId
```
**Response**:
```json
{
  "success": true,
  "data": {
    "attendance": true,
    "homework": true,
    "timetable": true,
    "notices": true,
    // ... other features
  }
}
```

##### Update Feature Config
```
PUT /api/super-admin/feature-config/:tenantId
```
**Request Body**:
```json
{
  "attendance": true,
  "homework": false,
  // ... other features
}
```

#### 2.5 Platform Operations

##### Get Background Jobs
```
GET /api/super-admin/platform-ops/jobs?page=1&limit=10&status=
```

##### Retry Failed Job
```
POST /api/super-admin/platform-ops/jobs/:jobId/retry
```

##### Get Queue Status
```
GET /api/super-admin/platform-ops/queues
```

##### Get Cron Jobs
```
GET /api/super-admin/platform-ops/cron-jobs
```

##### Get Maintenance Modes
```
GET /api/super-admin/platform-ops/maintenance
```

##### Set Maintenance Mode
```
POST /api/super-admin/platform-ops/maintenance
```
**Request Body**:
```json
{
  "tenantId": "string",
  "enabled": true,
  "message": "string (optional)"
}
```

#### 2.6 Audit Logs

##### Get Audit Logs
```
GET /api/super-admin/audit-logs?page=1&limit=10&action=&userId=&tenantId=&fromDate=&toDate=
```
**Query Parameters**:
- Standard pagination
- `action`: Filter by action type
- `userId`: Filter by user
- `tenantId`: Filter by tenant
- `fromDate`, `toDate`: Date range filter

#### 2.7 Support

##### Get System Health
```
GET /api/super-admin/support/health
```

##### Get Support Issues
```
GET /api/super-admin/support/issues?page=1&limit=10&status=
```

##### Get Tenant Notes
```
GET /api/super-admin/support/notes/:tenantId
```

##### Create Tenant Note
```
POST /api/super-admin/support/notes
```
**Request Body**:
```json
{
  "tenantId": "string",
  "note": "string",
  "type": "string"
}
```

##### Get Impersonation Sessions
```
GET /api/super-admin/support/impersonations?page=1&limit=10
```

##### Start Impersonation
```
POST /api/super-admin/support/impersonations
```
**Request Body**:
```json
{
  "userId": "string",
  "reason": "string"
}
```

#### 2.8 Settings

##### Get Platform Settings
```
GET /api/super-admin/settings
```

##### Update Platform Settings
```
PUT /api/super-admin/settings
```
**Request Body**:
```json
{
  "platform": {
    "name": "string",
    "domain": "string",
    "timezone": "string",
    "language": "string"
  },
  "email": {
    "smtpHost": "string",
    "smtpPort": "string",
    "smtpUser": "string",
    "fromEmail": "string"
  },
  "security": {
    "sessionTimeout": "string",
    "passwordMinLength": "string",
    "requireTwoFactor": false,
    "enableAuditLogs": true
  },
  "features": {
    "enableRegistration": true,
    "enableEmailVerification": true,
    "enablePasswordReset": true,
    "maintenanceMode": false
  }
}
```

---

## 3. Admin Application

### Purpose
School-level administration for managing all aspects of a school including students, teachers, classes, attendance, exams, fees, and more.

### Features
- Dashboard with school metrics
- School Profile Management
- Student Management (CRUD, Academic Details, Guardians, Documents)
- Teacher Management (CRUD, Qualifications, Assignments)
- Class & Section Management
- Subject Management
- Attendance Management (Daily, Period-wise, Bulk)
- Timetable Management
- Exam Management (Create, Hall Tickets, Results)
- Fee Management (Structures, Payments)
- Grade Management
- Admission Management (Enquiries, Applications, Enrollment)
- Communication (Notices, SMS, Email)
- Reports Generation
- Settings

### API Endpoints

#### 3.1 Dashboard
```
GET /api/v1/dashboard
```
**Response**: Comprehensive dashboard data including:
- Total students, teachers, classes
- Today's attendance statistics
- Fee collection metrics
- Pending tasks
- Alerts
- Recent activity
- Top performers
- Upcoming events

**See**: `apps/admin/src/pages/Dashboard/DASHBOARD_API_REQUIREMENTS.md` for detailed endpoint requirements

#### 3.2 School Profile

##### Get School Profile
```
GET /api/v1/school-profile
```

##### Update School Profile
```
PUT /api/v1/school-profile
```
**Request Body**: Complete school profile object

#### 3.3 Students

##### List Students
```
GET /api/v1/students?page=1&limit=10&search=&classId=&sectionId=&academicYear=
```

##### Get Student by ID
```
GET /api/v1/students/:id
```

##### Create Student
```
POST /api/v1/students
```

##### Update Student
```
PUT /api/v1/students/:id
```

##### Delete Student
```
DELETE /api/v1/students/:id
```

##### Get Student Academic Details
```
GET /api/v1/students/:id/academic
```

##### Get Student Attendance Profile
```
GET /api/v1/students/:id/attendance?academicYear=
```

##### Get Student Exam Results
```
GET /api/v1/students/:id/exams?academicYear=
```

##### Get Student Fee Information
```
GET /api/v1/students/:id/fees?academicYear=
```

##### Get Student Guardians
```
GET /api/v1/students/:id/guardians
```

##### Add Guardian
```
POST /api/v1/students/:id/guardians
```

##### Update Guardian
```
PUT /api/v1/students/:id/guardians/:guardianId
```

##### Delete Guardian
```
DELETE /api/v1/students/:id/guardians/:guardianId
```

##### Get Student Documents
```
GET /api/v1/students/:id/documents
```

##### Upload Document
```
POST /api/v1/students/:id/documents
Content-Type: multipart/form-data
```
**Request Body** (multipart/form-data):
- `file`: File to upload
- `name`: Document name
- `type`: Document type (admission, id_proof, transfer_certificate, medical, previous_school, other)`
- `description`: Optional description

##### Delete Document
```
DELETE /api/v1/students/:id/documents/:documentId
```

##### Bulk Import Students
```
POST /api/v1/students/bulk-import
Content-Type: multipart/form-data
```
**Request Body** (multipart/form-data):
- `file`: CSV/Excel file with student data
- `academicYear`: Target academic year
- `classId`: Target class (optional)
- `sectionId`: Target section (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 3,
        "error": "Invalid email format"
      }
    ]
  }
}
```

##### Get Student Notes
```
GET /api/v1/students/:id/notes?type=&page=1&limit=10
```

##### Create Student Note
```
POST /api/v1/students/:id/notes
```
**Request Body**:
```json
{
  "type": "admin_remark" | "teacher_remark" | "behavior" | "incident" | "communication",
  "title": "string",
  "content": "string",
  "isPrivate": false
}
```

##### Get Student Transfer History
```
GET /api/v1/students/:id/transfers
```

##### Request Student Transfer
```
POST /api/v1/students/:id/transfers
```
**Request Body**:
```json
{
  "reason": "string",
  "exitDate": "YYYY-MM-DD",
  "remarks": "string (optional)"
}
```

##### Promote Student
```
POST /api/v1/students/:id/promote
```
**Request Body**:
```json
{
  "toClassId": "string",
  "toSectionId": "string (optional)",
  "academicYear": "string",
  "remarks": "string (optional)"
}
```

##### Get Student Transport Details
```
GET /api/v1/students/:id/transport
```

##### Update Student Transport
```
PUT /api/v1/students/:id/transport
```
**Request Body**:
```json
{
  "requiresTransport": true,
  "routeId": "string (optional)",
  "stopId": "string (optional)"
}
```

#### 3.4 Teachers

##### List Teachers
```
GET /api/v1/teachers?page=1&limit=10&search=&subjectId=&classId=
```

##### Get Teacher by ID
```
GET /api/v1/teachers/:id
```

##### Create Teacher
```
POST /api/v1/teachers
```

##### Update Teacher
```
PUT /api/v1/teachers/:id
```

##### Delete Teacher
```
DELETE /api/v1/teachers/:id
```

##### Get Teacher Qualifications
```
GET /api/v1/teachers/:id/qualifications
```

##### Add Qualification
```
POST /api/v1/teachers/:id/qualifications
```

##### Get Teacher Assignments
```
GET /api/v1/teachers/:id/assignments?classId=&subjectId=
```

##### Assign Teacher to Class/Subject
```
POST /api/v1/teachers/:id/assignments
```

##### Get Teacher Documents
```
GET /api/v1/teachers/:id/documents
```

##### Upload Teacher Document
```
POST /api/v1/teachers/:id/documents
Content-Type: multipart/form-data
```

##### Get Teacher Performance
```
GET /api/v1/teachers/:id/performance?academicYear=&fromDate=&toDate=
```

##### Get Teacher Timetable
```
GET /api/v1/teachers/:id/timetable?academicYear=&day=
```

##### Get Teacher Attendance
```
GET /api/v1/teachers/:id/attendance?fromDate=&toDate=
```

##### Get Teacher Leave History
```
GET /api/v1/teachers/:id/leave?fromDate=&toDate=&status=
```

##### Bulk Import Teachers
```
POST /api/v1/teachers/bulk-import
Content-Type: multipart/form-data
```

#### 3.5 Classes

##### List Classes
```
GET /api/v1/classes?page=1&limit=10&search=&academicYear=
```

##### Get Class by ID
```
GET /api/v1/classes/:id
```

##### Create Class
```
POST /api/v1/classes
```

##### Update Class
```
PUT /api/v1/classes/:id
```

##### Delete Class
```
DELETE /api/v1/classes/:id
```

##### Get Class Students
```
GET /api/v1/classes/:id/students
```

##### Get Class Subjects
```
GET /api/v1/classes/:id/subjects
```

##### Get Class Attendance
```
GET /api/v1/classes/:id/attendance?date=&academicYear=
```

##### Get Class Timetable
```
GET /api/v1/classes/:id/timetable?academicYear=
```

##### Get Class Analytics
```
GET /api/v1/classes/:id/analytics?academicYear=
```

##### Get Class Capacity
```
GET /api/v1/classes/:id/capacity
```

##### Update Class Capacity
```
PUT /api/v1/classes/:id/capacity
```
**Request Body**:
```json
{
  "maxStudents": 40,
  "currentStudents": 35
}
```

##### Get Class Fee Structure
```
GET /api/v1/classes/:id/fees
```

##### Get Class Exams
```
GET /api/v1/classes/:id/exams?academicYear=&status=
```

##### Get Class Promotions
```
GET /api/v1/classes/:id/promotions?academicYear=
```

##### Promote Class Students
```
POST /api/v1/classes/:id/promote
```
**Request Body**:
```json
{
  "toClassId": "string",
  "studentIds": ["string"],
  "academicYear": "string"
}
```

##### Get Class Assignments
```
GET /api/v1/classes/:id/assignments?status=&subjectId=
```

##### Get Class Attendance Configuration
```
GET /api/v1/classes/:id/attendance-config
```

##### Update Class Attendance Configuration
```
PUT /api/v1/classes/:id/attendance-config
```

##### Get Class Subject Mapping
```
GET /api/v1/classes/:id/subject-mapping
```

##### Update Class Subject Mapping
```
PUT /api/v1/classes/:id/subject-mapping
```
**Request Body**:
```json
{
  "subjects": [
    {
      "subjectId": "string",
      "teacherId": "string",
      "isElective": false,
      "electiveGroup": "string (optional)"
    }
  ]
}
```

##### Get Class Permissions
```
GET /api/v1/classes/:id/permissions
```

##### Update Class Permissions
```
PUT /api/v1/classes/:id/permissions
```

##### Get Class Audit Log
```
GET /api/v1/classes/:id/audit-log?page=1&limit=10&action=&fromDate=&toDate=
```

##### Get Class Stationary Requirements
```
GET /api/v1/classes/:id/stationary
```

##### Update Class Stationary
```
PUT /api/v1/classes/:id/stationary
```

##### Manage Roll Numbers
```
POST /api/v1/classes/:id/roll-numbers/manage
```
**Request Body**:
```json
{
  "studentRollNumbers": [
    {
      "studentId": "string",
      "rollNumber": "string"
    }
  ]
}
```

#### 3.6 Sections

##### List Sections
```
GET /api/v1/sections?page=1&limit=10&search=&classId=&academicYear=
```

##### Get Section by ID
```
GET /api/v1/sections/:id
```

##### Create Section
```
POST /api/v1/sections
```

##### Update Section
```
PUT /api/v1/sections/:id
```

##### Delete Section
```
DELETE /api/v1/sections/:id
```

##### Get Section Students
```
GET /api/v1/sections/:id/students
```

##### Get Section Teachers
```
GET /api/v1/sections/:id/teachers
```

##### Get Section Attendance
```
GET /api/v1/sections/:id/attendance?date=&academicYear=&fromDate=&toDate=
```

##### Get Section Timetable
```
GET /api/v1/sections/:id/timetable?academicYear=&day=
```

##### Get Section Exams
```
GET /api/v1/sections/:id/exams?academicYear=&status=
```

##### Get Section Fees
```
GET /api/v1/sections/:id/fees?academicYear=
```

##### Get Section Capacity
```
GET /api/v1/sections/:id/capacity
```

##### Update Section Capacity
```
PUT /api/v1/sections/:id/capacity
```

##### Get Section Reports
```
GET /api/v1/sections/:id/reports?type=&academicYear=
```

##### Get Section Overview
```
GET /api/v1/sections/:id/overview?academicYear=
```

#### 3.7 Subjects

##### List Subjects
```
GET /api/v1/subjects?page=1&limit=10&search=&classId=
```

##### Get Subject by ID
```
GET /api/v1/subjects/:id
```

##### Create Subject
```
POST /api/v1/subjects
```

##### Update Subject
```
PUT /api/v1/subjects/:id
```

##### Delete Subject
```
DELETE /api/v1/subjects/:id
```

##### Get Subject Class Mappings
```
GET /api/v1/subjects/:id/class-mappings
```

##### Get Subject Teachers
```
GET /api/v1/subjects/:id/teachers
```

##### Assign Teacher to Subject
```
POST /api/v1/subjects/:id/teachers
```
**Request Body**:
```json
{
  "teacherId": "string",
  "classId": "string",
  "sectionId": "string (optional)"
}
```

##### Get Subject Attendance
```
GET /api/v1/subjects/:id/attendance?classId=&sectionId=&fromDate=&toDate=
```

##### Get Subject Timetable
```
GET /api/v1/subjects/:id/timetable?classId=&sectionId=&academicYear=
```

##### Get Subject Exams
```
GET /api/v1/subjects/:id/exams?classId=&academicYear=&status=
```

##### Get Subject Reports
```
GET /api/v1/subjects/:id/reports?classId=&academicYear=&type=
```

##### Get Subject LMS Content
```
GET /api/v1/subjects/:id/lms-content?page=1&limit=10
```

##### Get Subject Section Configuration
```
GET /api/v1/subjects/:id/section-config
```

##### Update Subject Section Configuration
```
PUT /api/v1/subjects/:id/section-config
```

##### Get Subject Metadata
```
GET /api/v1/subjects/:id/metadata
```

##### Update Subject Metadata
```
PUT /api/v1/subjects/:id/metadata
```

##### Get Subject Overview
```
GET /api/v1/subjects/:id/overview?classId=&academicYear=
```

#### 3.8 Attendance

##### Mark Daily Attendance
```
POST /api/v1/attendance/daily
```
**Request Body**:
```json
{
  "classId": "string",
  "sectionId": "string (optional)",
  "date": "YYYY-MM-DD",
  "attendance": [
    {
      "studentId": "string",
      "status": "present" | "absent" | "late" | "half_day" | "leave"
    }
  ]
}
```

##### Mark Period-wise Attendance
```
POST /api/v1/attendance/period
```
**Request Body**:
```json
{
  "classId": "string",
  "sectionId": "string",
  "subjectId": "string",
  "period": 1,
  "date": "YYYY-MM-DD",
  "attendance": [
    {
      "studentId": "string",
      "status": "present" | "absent" | "late"
    }
  ]
}
```

##### Bulk Mark Attendance
```
POST /api/v1/attendance/bulk
```

##### Get Attendance by Date
```
GET /api/v1/attendance?date=YYYY-MM-DD&classId=&sectionId=
```

##### Get Attendance Statistics
```
GET /api/v1/attendance/statistics?classId=&sectionId=&academicYear=&fromDate=&toDate=
```

##### Get Attendance Configuration
```
GET /api/v1/attendance/config?classId=&sectionId=
```

##### Update Attendance Configuration
```
PUT /api/v1/attendance/config
```

##### Lock Attendance
```
POST /api/v1/attendance/lock
```
**Request Body**:
```json
{
  "classId": "string",
  "sectionId": "string (optional)",
  "date": "YYYY-MM-DD"
}
```

##### Get Teacher Attendance
```
GET /api/v1/attendance/teachers?date=&fromDate=&toDate=
```

##### Mark Teacher Attendance
```
POST /api/v1/attendance/teachers
```
**Request Body**:
```json
{
  "teacherId": "string",
  "date": "YYYY-MM-DD",
  "status": "present" | "absent" | "late" | "half_day" | "leave",
  "checkInTime": "HH:mm (optional)",
  "checkOutTime": "HH:mm (optional)",
  "remarks": "string (optional)"
}
```

##### Get Staff Attendance
```
GET /api/v1/attendance/staff?date=&fromDate=&toDate=&staffId=
```

##### Mark Staff Attendance
```
POST /api/v1/attendance/staff
```

##### Get Attendance Corrections
```
GET /api/v1/attendance/corrections?page=1&limit=10&status=
```

##### Request Attendance Correction
```
POST /api/v1/attendance/corrections
```
**Request Body**:
```json
{
  "attendanceId": "string",
  "requestedStatus": "present" | "absent" | "late" | "half_day",
  "reason": "string"
}
```

##### Approve/Reject Attendance Correction
```
PUT /api/v1/attendance/corrections/:id/status
```
**Request Body**:
```json
{
  "status": "approved" | "rejected",
  "remarks": "string (optional)"
}
```

##### Get Attendance Locks
```
GET /api/v1/attendance/locks?classId=&sectionId=&fromDate=&toDate=
```

##### Unlock Attendance
```
POST /api/v1/attendance/unlock
```
**Request Body**:
```json
{
  "classId": "string",
  "sectionId": "string (optional)",
  "date": "YYYY-MM-DD",
  "unlockReason": "string"
}
```

##### Get Leave Requests
```
GET /api/v1/attendance/leave?page=1&limit=10&status=&studentId=&teacherId=&fromDate=&toDate=
```

##### Create Leave Request
```
POST /api/v1/attendance/leave
```
**Request Body**:
```json
{
  "studentId": "string (optional)",
  "teacherId": "string (optional)",
  "staffId": "string (optional)",
  "leaveType": "CL" | "SL" | "EL" | "ML" | "PL" | "other",
  "fromDate": "YYYY-MM-DD",
  "toDate": "YYYY-MM-DD",
  "reason": "string"
}
```

##### Approve/Reject Leave Request
```
PUT /api/v1/attendance/leave/:id/status
```
**Request Body**:
```json
{
  "status": "approved" | "rejected",
  "remarks": "string (optional)"
}
```

##### Get Leave Balance
```
GET /api/v1/attendance/leave-balance?studentId=&teacherId=&staffId=
```

##### Get Attendance Notifications
```
GET /api/v1/attendance/notifications?page=1&limit=10&type=
```

##### Send Attendance Notification
```
POST /api/v1/attendance/notifications
```

##### Get Attendance Reports
```
GET /api/v1/attendance/reports?type=&classId=&sectionId=&academicYear=&fromDate=&toDate=
```
**Query Parameters**:
- `type`: daily_register, monthly_summary, class_wise, student_wise, defaulter_list

#### 3.9 Timetable

##### Get Timetable
```
GET /api/v1/timetable?classId=&sectionId=&academicYear=&day=
```

##### Create Timetable Entry
```
POST /api/v1/timetable
```
**Request Body**:
```json
{
  "classId": "string",
  "sectionId": "string",
  "day": "monday" | "tuesday" | ...,
  "period": 1,
  "subjectId": "string",
  "teacherId": "string",
  "room": "string (optional)"
}
```

##### Update Timetable Entry
```
PUT /api/v1/timetable/:id
```

##### Delete Timetable Entry
```
DELETE /api/v1/timetable/:id
```

##### Get Timetable Conflicts
```
GET /api/v1/timetable/conflicts?classId=&sectionId=&academicYear=
```

#### 3.10 Exams

##### List Exams
```
GET /api/v1/exams?page=1&limit=10&search=&classId=&academicYear=&status=
```

##### Get Exam by ID
```
GET /api/v1/exams/:id
```

##### Create Exam
```
POST /api/v1/exams
```
**Request Body**:
```json
{
  "name": "string",
  "type": "unit_test" | "mid_term" | "final" | "assignment",
  "classId": "string",
  "sectionId": "string (optional)",
  "academicYear": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "subjects": [
    {
      "subjectId": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "maxMarks": 100
    }
  ]
}
```

##### Update Exam
```
PUT /api/v1/exams/:id
```

##### Delete Exam
```
DELETE /api/v1/exams/:id
```

##### Generate Hall Tickets
```
POST /api/v1/exams/:id/hall-tickets/generate
```

##### Get Hall Tickets
```
GET /api/v1/exams/:id/hall-tickets
```

##### Enter Exam Results
```
POST /api/v1/exams/:id/results
```
**Request Body**:
```json
{
  "results": [
    {
      "studentId": "string",
      "subjects": [
        {
          "subjectId": "string",
          "marksObtained": 85,
          "maxMarks": 100,
          "grade": "A"
        }
      ]
    }
  ]
}
```

##### Get Exam Results
```
GET /api/v1/exams/:id/results
```

##### Publish Results
```
POST /api/v1/exams/:id/results/publish
```

#### 3.11 Fees

##### List Fee Structures
```
GET /api/v1/fees/structures?page=1&limit=10&search=&classId=&academicYear=
```

##### Get Fee Structure by ID
```
GET /api/v1/fees/structures/:id
```

##### Create Fee Structure
```
POST /api/v1/fees/structures
```

##### Update Fee Structure
```
PUT /api/v1/fees/structures/:id
```

##### Delete Fee Structure
```
DELETE /api/v1/fees/structures/:id
```

##### Get Student Fees
```
GET /api/v1/fees/students/:studentId?academicYear=
```

##### Record Fee Payment
```
POST /api/v1/fees/payments
```
**Request Body**:
```json
{
  "studentId": "string",
  "feeStructureId": "string",
  "amount": 5000,
  "paymentMethod": "cash" | "online" | "cheque",
  "paymentDate": "YYYY-MM-DD",
  "transactionId": "string (optional)",
  "remarks": "string (optional)"
}
```

##### Get Fee Payments
```
GET /api/v1/fees/payments?studentId=&fromDate=&toDate=&status=
```

##### Get Fee Reports
```
GET /api/v1/fees/reports?classId=&academicYear=&status=
```

#### 3.12 Grades

##### List Grades
```
GET /api/v1/grades?page=1&limit=10&search=
```

##### Get Grade by ID
```
GET /api/v1/grades/:id
```

##### Create Grade
```
POST /api/v1/grades
```

##### Update Grade
```
PUT /api/v1/grades/:id
```

##### Delete Grade
```
DELETE /api/v1/grades/:id
```

#### 3.13 Admissions

##### List Enquiries
```
GET /api/v1/admissions/enquiries?page=1&limit=10&search=&status=
```

##### Create Enquiry
```
POST /api/v1/admissions/enquiries
```

##### Get Application by ID
```
GET /api/v1/admissions/applications/:id
```

##### List Applications
```
GET /api/v1/admissions/applications?page=1&limit=10&search=&status=
```

##### Update Application Status
```
PUT /api/v1/admissions/applications/:id/status
```

##### Get Seat Capacity
```
GET /api/v1/admissions/seat-capacity?classId=&academicYear=
```

##### Update Seat Capacity
```
PUT /api/v1/admissions/seat-capacity
```

##### Enroll Student
```
POST /api/v1/admissions/enroll
```
**Request Body**:
```json
{
  "applicationId": "string",
  "classId": "string",
  "sectionId": "string (optional)",
  "rollNumber": "string (optional)",
  "admissionDate": "YYYY-MM-DD",
  "remarks": "string (optional)"
}
```

##### Get Admission Dashboard
```
GET /api/v1/admissions/dashboard
```

##### Get Enquiry by ID
```
GET /api/v1/admissions/enquiries/:id
```

##### Update Enquiry
```
PUT /api/v1/admissions/enquiries/:id
```

##### Convert Enquiry to Application
```
POST /api/v1/admissions/enquiries/:id/convert
```

##### Get Application Documents
```
GET /api/v1/admissions/applications/:id/documents
```

##### Upload Application Document
```
POST /api/v1/admissions/applications/:id/documents
Content-Type: multipart/form-data
```

##### Verify Application Document
```
PUT /api/v1/admissions/applications/:id/documents/:documentId/verify
```
**Request Body**:
```json
{
  "status": "verified" | "rejected",
  "remarks": "string (optional)"
}
```

##### Get Application Academic History
```
GET /api/v1/admissions/applications/:id/academic-history
```

##### Update Application Academic History
```
PUT /api/v1/admissions/applications/:id/academic-history
```

##### Schedule Entrance Test
```
POST /api/v1/admissions/applications/:id/entrance-test
```
**Request Body**:
```json
{
  "testDate": "YYYY-MM-DD",
  "testTime": "HH:mm",
  "venue": "string",
  "instructions": "string (optional)"
}
```

##### Record Entrance Test Result
```
POST /api/v1/admissions/applications/:id/entrance-test/result
```
**Request Body**:
```json
{
  "subjects": [
    {
      "subject": "string",
      "marks": 85,
      "maxMarks": 100
    }
  ],
  "result": "pass" | "fail" | "on-hold",
  "remarks": "string (optional)"
}
```

##### Schedule Interview
```
POST /api/v1/admissions/applications/:id/interview
```
**Request Body**:
```json
{
  "interviewDate": "YYYY-MM-DD",
  "interviewTime": "HH:mm",
  "interviewerName": "string (optional)",
  "venue": "string (optional)"
}
```

##### Record Interview Result
```
POST /api/v1/admissions/applications/:id/interview/result
```
**Request Body**:
```json
{
  "result": "pass" | "fail" | "on-hold",
  "remarks": "string (optional)"
}
```

##### Get Application Review Details
```
GET /api/v1/admissions/applications/:id/review
```

##### Review Application
```
POST /api/v1/admissions/applications/:id/review
```
**Request Body**:
```json
{
  "status": "approved" | "rejected" | "waitlisted",
  "remarks": "string",
  "approvedBy": "string"
}
```

##### Get Seat Capacity by Class
```
GET /api/v1/admissions/seat-capacity?classId=&academicYear=
```

##### Update Seat Capacity
```
PUT /api/v1/admissions/seat-capacity
```
**Request Body**:
```json
{
  "classId": "string",
  "academicYear": "string",
  "totalSeats": 40,
  "reservedSeats": 5,
  "availableSeats": 35
}
```

##### Get Admission Settings
```
GET /api/v1/admissions/settings
```

##### Update Admission Settings
```
PUT /api/v1/admissions/settings
```

##### Publish Admission Form
```
POST /api/v1/admissions/forms/publish
```
**Request Body**:
```json
{
  "academicYear": "string",
  "classes": ["string"],
  "formUrl": "string",
  "isPublic": true
}
```

##### Get Admission Reports
```
GET /api/v1/admissions/reports?type=&academicYear=&status=&fromDate=&toDate=
```
**Query Parameters**:
- `type`: enquiries, applications, enrollments, conversions

#### 3.14 Communication

##### Send Notice
```
POST /api/v1/communication/notices
```
**Request Body**:
```json
{
  "title": "string",
  "message": "string",
  "recipients": {
    "type": "all" | "class" | "section" | "students" | "teachers" | "parents",
    "classId": "string (optional)",
    "sectionId": "string (optional)",
    "studentIds": ["string"] (optional),
    "teacherIds": ["string"] (optional)
  },
  "channels": ["sms", "email", "app"],
  "priority": "low" | "medium" | "high",
  "sendDate": "YYYY-MM-DDTHH:mm:ssZ (optional)"
}
```

##### List Notices
```
GET /api/v1/communication/notices?page=1&limit=10&search=
```

##### Send SMS
```
POST /api/v1/communication/sms
```

##### Send Email
```
POST /api/v1/communication/email
```
**Request Body**:
```json
{
  "to": ["string"],
  "subject": "string",
  "body": "string",
  "attachments": ["string"] (optional),
  "priority": "low" | "medium" | "high"
}
```

##### Get Communication History
```
GET /api/v1/communication/history?page=1&limit=10&type=&fromDate=&toDate=
```

##### Get Notice by ID
```
GET /api/v1/communication/notices/:id
```

##### Update Notice
```
PUT /api/v1/communication/notices/:id
```

##### Delete Notice
```
DELETE /api/v1/communication/notices/:id
```

##### Mark Notice as Read
```
POST /api/v1/communication/notices/:id/read
```

##### Get Communication Templates
```
GET /api/v1/communication/templates?type=
```

##### Create Communication Template
```
POST /api/v1/communication/templates
```

##### Update Communication Template
```
PUT /api/v1/communication/templates/:id
```

##### Delete Communication Template
```
DELETE /api/v1/communication/templates/:id
```

##### Get SMS Balance
```
GET /api/v1/communication/sms/balance
```

##### Get Communication Analytics
```
GET /api/v1/communication/analytics?fromDate=&toDate=&type=
```

#### 3.15 Reports

##### Generate Report
```
POST /api/v1/reports/generate
```
**Request Body**:
```json
{
  "type": "attendance" | "fees" | "exam" | "student" | "teacher",
  "format": "pdf" | "excel" | "csv",
  "filters": {
    "classId": "string (optional)",
    "sectionId": "string (optional)",
    "academicYear": "string (optional)",
    "fromDate": "YYYY-MM-DD (optional)",
    "toDate": "YYYY-MM-DD (optional)"
  }
}
```

##### Get Report Status
```
GET /api/v1/reports/:reportId/status
```

##### Download Report
```
GET /api/v1/reports/:reportId/download
```

##### Get Available Report Types
```
GET /api/v1/reports/types
```

##### Get Report Templates
```
GET /api/v1/reports/templates?type=
```

##### Create Report Template
```
POST /api/v1/reports/templates
```

##### Schedule Report
```
POST /api/v1/reports/schedule
```
**Request Body**:
```json
{
  "type": "attendance" | "fees" | "exam" | "student" | "teacher",
  "format": "pdf" | "excel" | "csv",
  "schedule": "daily" | "weekly" | "monthly",
  "recipients": ["string"],
  "filters": { /* report filters */ }
}
```

##### Get Scheduled Reports
```
GET /api/v1/reports/scheduled?page=1&limit=10&status=
```

##### Cancel Scheduled Report
```
DELETE /api/v1/reports/scheduled/:id
```

#### 3.16 Settings

##### Get Settings
```
GET /api/v1/settings
```

##### Update Settings
```
PUT /api/v1/settings
```

---

## 4. Teacher Application

### Purpose
Teacher-facing application for managing classes, students, assignments, grades, attendance, and content.

### Features
- Dashboard (Teacher-specific metrics)
- Profile Management
- View Assigned Classes & Students
- Assignment Management (Create, Grade, Manage)
- Grade Entry (Individual & Bulk)
- Attendance Marking (Bulk operations)
- Timetable Viewing
- Exam Result Entry
- Content Library Management
- Communication (View, Send)
- Leave Management
- Settings

### API Endpoints

#### 4.1 Dashboard
```
GET /api/v1/teacher/dashboard
```
**Response**: Teacher-specific metrics including:
- Assigned classes and students
- Pending assignments to grade
- Today's timetable
- Upcoming exams
- Recent activity

#### 4.2 Profile

##### Get Teacher Profile
```
GET /api/v1/teacher/profile
```

##### Update Teacher Profile
```
PUT /api/v1/teacher/profile
```

#### 4.3 Classes & Students

##### Get Assigned Classes
```
GET /api/v1/teacher/classes
```

##### Get Class Students
```
GET /api/v1/teacher/classes/:classId/students
```

##### Get Student Details
```
GET /api/v1/teacher/students/:id
```

#### 4.4 Assignments

##### List Assignments
```
GET /api/v1/teacher/assignments?page=1&limit=10&classId=&status=
```

##### Create Assignment
```
POST /api/v1/teacher/assignments
```
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "classId": "string",
  "sectionId": "string (optional)",
  "subjectId": "string",
  "dueDate": "YYYY-MM-DD",
  "maxMarks": 100,
  "attachments": ["string"] (optional)
}
```

##### Get Assignment Submissions
```
GET /api/v1/teacher/assignments/:id/submissions
```

##### Grade Submission
```
POST /api/v1/teacher/assignments/:id/submissions/:submissionId/grade
```
**Request Body**:
```json
{
  "marks": 85,
  "feedback": "string (optional)"
}
```

#### 4.5 Grades

##### Enter Grade
```
POST /api/v1/teacher/grades
```
**Request Body**:
```json
{
  "studentId": "string",
  "subjectId": "string",
  "classId": "string",
  "examId": "string (optional)",
  "marks": 85,
  "maxMarks": 100,
  "grade": "A"
}
```

##### Bulk Enter Grades
```
POST /api/v1/teacher/grades/bulk
```

#### 4.6 Attendance

##### Mark Attendance
```
POST /api/v1/teacher/attendance
```
**Request Body**: Same as admin attendance marking

##### Get Attendance Statistics
```
GET /api/v1/teacher/attendance/statistics?classId=&fromDate=&toDate=
```

#### 4.7 Timetable

##### Get Teacher Timetable
```
GET /api/v1/teacher/timetable?academicYear=&day=
```

#### 4.8 Exams

##### Get Assigned Exams
```
GET /api/v1/teacher/exams?status=
```

##### Enter Exam Results
```
POST /api/v1/teacher/exams/:id/results
```

#### 4.9 Content Library

##### List Content
```
GET /api/v1/teacher/content?page=1&limit=10&search=&subjectId=
```

##### Upload Content
```
POST /api/v1/teacher/content
Content-Type: multipart/form-data
```

##### Share Content
```
POST /api/v1/teacher/content/:id/share
```

#### 4.10 Communication

##### Get Notices
```
GET /api/v1/teacher/notices?page=1&limit=10
```

##### Send Message
```
POST /api/v1/teacher/messages
```

#### 4.11 Leave

##### Request Leave
```
POST /api/v1/teacher/leave
```
**Request Body**:
```json
{
  "leaveType": "CL" | "SL" | "EL" | "ML" | "PL" | "other",
  "fromDate": "YYYY-MM-DD",
  "toDate": "YYYY-MM-DD",
  "reason": "string",
  "substituteTeacherId": "string (optional)"
}
```

##### Get Leave History
```
GET /api/v1/teacher/leave?fromDate=&toDate=&status=
```

##### Get Leave Balance
```
GET /api/v1/teacher/leave-balance
```

##### Cancel Leave Request
```
DELETE /api/v1/teacher/leave/:id
```

#### 4.12 Profile & Settings

##### Get Teacher Profile
```
GET /api/v1/teacher/profile
```

##### Update Teacher Profile
```
PUT /api/v1/teacher/profile
```

##### Change Password
```
POST /api/v1/teacher/change-password
```
**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

##### Get Teacher Settings
```
GET /api/v1/teacher/settings
```

##### Update Teacher Settings
```
PUT /api/v1/teacher/settings
```

---

## 5. Student Application

### Purpose
Student-facing application for viewing academic information, submitting assignments, tracking progress, and accessing content.

### Features
- Dashboard (Student-specific metrics)
- Profile Management (Limited updates)
- View Classes & Subjects
- View & Submit Assignments
- View Grades & Summaries
- View Attendance & Calendar
- View Timetable
- View Exams & Download Hall Tickets
- View Fees & Payment History
- Document Management
- Content Library Access with Progress Tracking
- Communication (View, Send)
- Settings

### API Endpoints

#### 5.1 Dashboard
```
GET /api/v1/student/dashboard
```

#### 5.2 Profile

##### Get Student Profile
```
GET /api/v1/student/profile
```

##### Update Student Profile (Limited)
```
PUT /api/v1/student/profile
```

#### 5.3 Classes & Subjects

##### Get Student Classes
```
GET /api/v1/student/classes
```

##### Get Student Subjects
```
GET /api/v1/student/subjects
```

#### 5.4 Assignments

##### Get Assignments
```
GET /api/v1/student/assignments?page=1&limit=10&status=
```

##### Get Assignment Details
```
GET /api/v1/student/assignments/:id
```

##### Submit Assignment
```
POST /api/v1/student/assignments/:id/submit
Content-Type: multipart/form-data
```

#### 5.5 Grades

##### Get Grades
```
GET /api/v1/student/grades?subjectId=&academicYear=
```

##### Get Grade Summary
```
GET /api/v1/student/grades/summary?academicYear=
```

#### 5.6 Attendance

##### Get Attendance
```
GET /api/v1/student/attendance?academicYear=&fromDate=&toDate=
```

##### Get Attendance Calendar
```
GET /api/v1/student/attendance/calendar?month=&year=
```

#### 5.7 Timetable

##### Get Student Timetable
```
GET /api/v1/student/timetable?academicYear=&day=
```

#### 5.8 Exams

##### Get Exams
```
GET /api/v1/student/exams?status=&academicYear=
```

##### Get Hall Ticket
```
GET /api/v1/student/exams/:id/hall-ticket
```

##### Get Exam Results
```
GET /api/v1/student/exams/:id/results
```

#### 5.9 Fees

##### Get Fee Information
```
GET /api/v1/student/fees?academicYear=
```

##### Get Payment History
```
GET /api/v1/student/fees/payments
```

#### 5.10 Documents

##### Get Documents
```
GET /api/v1/student/documents
```

##### Upload Document
```
POST /api/v1/student/documents
Content-Type: multipart/form-data
```

#### 5.11 Content Library

##### Get Content
```
GET /api/v1/student/content?page=1&limit=10&subjectId=
```

##### Track Progress
```
POST /api/v1/student/content/:id/progress
```

#### 5.12 Communication

##### Get Notices
```
GET /api/v1/student/notices?page=1&limit=10
```

##### Send Message
```
POST /api/v1/student/messages
```
**Request Body**:
```json
{
  "recipientId": "string",
  "recipientType": "teacher" | "admin" | "parent",
  "subject": "string",
  "message": "string",
  "attachments": ["string"] (optional)
}
```

##### Get Messages
```
GET /api/v1/student/messages?page=1&limit=10&type=&status=
```

##### Mark Message as Read
```
POST /api/v1/student/messages/:id/read
```

#### 5.13 Profile & Settings

##### Get Student Profile
```
GET /api/v1/student/profile
```

##### Update Student Profile (Limited)
```
PUT /api/v1/student/profile
```
**Note**: Students can only update limited fields like phone, address, profile picture

##### Change Password
```
POST /api/v1/student/change-password
```

##### Get Student Settings
```
GET /api/v1/student/settings
```

##### Update Student Settings
```
PUT /api/v1/student/settings
```

---

## 6. Parent Application

### Purpose
Parent-facing application for viewing child's academic progress, attendance, fees, and communication.

### Features
- Dashboard (Child's overview)
- View Child's Profile
- View Child's Attendance
- View Child's Grades & Exam Results
- View Child's Assignments
- View Child's Timetable
- View & Pay Fees
- View Notices & Communication
- Settings

### API Endpoints

#### 6.1 Dashboard
```
GET /api/v1/parent/dashboard
```

#### 6.2 Children

##### Get Children List
```
GET /api/v1/parent/children
```

##### Get Child Details
```
GET /api/v1/parent/children/:childId
```

#### 6.3 Attendance

##### Get Child Attendance
```
GET /api/v1/parent/children/:childId/attendance?academicYear=&fromDate=&toDate=
```

#### 6.4 Grades

##### Get Child Grades
```
GET /api/v1/parent/children/:childId/grades?academicYear=
```

##### Get Child Exam Results
```
GET /api/v1/parent/children/:childId/exams?academicYear=
```

#### 6.5 Assignments

##### Get Child Assignments
```
GET /api/v1/parent/children/:childId/assignments?status=
```

#### 6.6 Timetable

##### Get Child Timetable
```
GET /api/v1/parent/children/:childId/timetable?academicYear=
```

#### 6.7 Fees

##### Get Child Fees
```
GET /api/v1/parent/children/:childId/fees?academicYear=
```

##### Pay Fee
```
POST /api/v1/parent/children/:childId/fees/pay
```

#### 6.8 Communication

##### Get Notices
```
GET /api/v1/parent/notices?page=1&limit=10
```

##### Send Message
```
POST /api/v1/parent/messages
```
**Request Body**:
```json
{
  "recipientId": "string",
  "recipientType": "teacher" | "admin",
  "childId": "string",
  "subject": "string",
  "message": "string"
}
```

##### Get Messages
```
GET /api/v1/parent/messages?page=1&limit=10&childId=&type=
```

##### Get Parent-Teacher Meeting Schedule
```
GET /api/v1/parent/meetings?childId=&status=
```

##### Request Parent-Teacher Meeting
```
POST /api/v1/parent/meetings
```
**Request Body**:
```json
{
  "childId": "string",
  "teacherId": "string",
  "preferredDate": "YYYY-MM-DD",
  "preferredTime": "HH:mm",
  "reason": "string"
}
```

#### 6.9 Leave Requests

##### Get Child Leave Requests
```
GET /api/v1/parent/children/:childId/leave?status=&fromDate=&toDate=
```

##### Request Leave for Child
```
POST /api/v1/parent/children/:childId/leave
```
**Request Body**:
```json
{
  "leaveType": "CL" | "SL" | "EL" | "other",
  "fromDate": "YYYY-MM-DD",
  "toDate": "YYYY-MM-DD",
  "reason": "string"
}
```

#### 6.10 Transport

##### Get Child Transport Details
```
GET /api/v1/parent/children/:childId/transport
```

##### Get Transport Route Details
```
GET /api/v1/parent/transport/routes/:routeId
```

##### Get Transport Attendance
```
GET /api/v1/parent/children/:childId/transport/attendance?fromDate=&toDate=
```

#### 6.11 Documents

##### Get Child Documents
```
GET /api/v1/parent/children/:childId/documents?category=
```

##### Download Document
```
GET /api/v1/parent/documents/:documentId/download
```

#### 6.12 Learning Resources

##### Get Learning Resources
```
GET /api/v1/parent/children/:childId/learning-resources?type=&subjectId=
```

##### Get Syllabus
```
GET /api/v1/parent/children/:childId/syllabus?academicYear=&classId=
```

#### 6.13 School Information

##### Get School Information
```
GET /api/v1/parent/school-info
```

##### Get School Policies
```
GET /api/v1/parent/school-info/policies
```

##### Get School Contact
```
GET /api/v1/parent/school-info/contact
```

#### 6.14 Profile & Settings

##### Get Parent Profile
```
GET /api/v1/parent/profile
```

##### Update Parent Profile
```
PUT /api/v1/parent/profile
```

##### Change Password
```
POST /api/v1/parent/change-password
```

---

## 7. Staff HR Application

### Purpose
HR management for non-teaching staff including attendance, payroll, leave management, employee records, performance tracking, and training.

### Features
- Staff Management (CRUD, Documents, Qualifications)
- Staff Attendance (Mark, View, Reports)
- Leave Management (Request, Approve/Reject, Balance)
- Payroll Management (Generate, View, Reports)
- Performance Management (Reviews, Appraisals)
- Training Management (Sessions, Records)
- Roles & Departments Management
- Academic Mapping (Staff to Classes/Subjects)
- Timetable & Workload Management
- Finance Management (Advance, Loans, Reimbursements)
- Communication
- Settings

### API Endpoints

#### 7.1 Staff

##### List Staff
```
GET /api/v1/staff?page=1&limit=10&search=&department=&status=&role=
```

##### Get Staff by ID
```
GET /api/v1/staff/:id
```

##### Create Staff
```
POST /api/v1/staff
```
**Request Body**: Complete staff profile including personal details, employment details, qualifications

##### Update Staff
```
PUT /api/v1/staff/:id
```

##### Delete Staff
```
DELETE /api/v1/staff/:id
```

##### Get Staff Documents
```
GET /api/v1/staff/:id/documents
```

##### Upload Staff Document
```
POST /api/v1/staff/:id/documents
Content-Type: multipart/form-data
```

##### Get Staff Qualifications
```
GET /api/v1/staff/:id/qualifications
```

##### Add Staff Qualification
```
POST /api/v1/staff/:id/qualifications
```

##### Bulk Import Staff
```
POST /api/v1/staff/bulk-import
Content-Type: multipart/form-data
```

#### 7.2 Attendance

##### Mark Staff Attendance
```
POST /api/v1/staff/attendance
```
**Request Body**:
```json
{
  "staffId": "string",
  "date": "YYYY-MM-DD",
  "status": "present" | "absent" | "late" | "half_day" | "early_exit",
  "checkInTime": "HH:mm (optional)",
  "checkOutTime": "HH:mm (optional)",
  "shift": "morning" | "afternoon" | "evening" | "night",
  "overtimeHours": 0 (optional)
}
```

##### Get Staff Attendance
```
GET /api/v1/staff/attendance?fromDate=&toDate=&staffId=&department=
```

##### Get Attendance Statistics
```
GET /api/v1/staff/attendance/statistics?fromDate=&toDate=&department=
```

##### Get Attendance Reports
```
GET /api/v1/staff/attendance/reports?type=&fromDate=&toDate=&department=
```

#### 7.3 Leave

##### Request Leave
```
POST /api/v1/staff/leave
```
**Request Body**:
```json
{
  "staffId": "string",
  "leaveType": "CL" | "SL" | "EL" | "ML" | "PL" | "other",
  "fromDate": "YYYY-MM-DD",
  "toDate": "YYYY-MM-DD",
  "reason": "string",
  "substituteStaffId": "string (optional)"
}
```

##### Get Leave Requests
```
GET /api/v1/staff/leave?status=&fromDate=&toDate=&staffId=&department=
```

##### Approve/Reject Leave
```
PUT /api/v1/staff/leave/:id/status
```
**Request Body**:
```json
{
  "status": "approved" | "rejected",
  "remarks": "string (optional)"
}
```

##### Get Leave Balance
```
GET /api/v1/staff/leave-balance?staffId=
```

##### Cancel Leave Request
```
DELETE /api/v1/staff/leave/:id
```

#### 7.4 Payroll

##### Get Payroll
```
GET /api/v1/staff/payroll?month=&year=&staffId=&department=
```

##### Generate Payroll
```
POST /api/v1/staff/payroll/generate
```
**Request Body**:
```json
{
  "month": "YYYY-MM",
  "staffIds": ["string"] (optional - if not provided, generates for all),
  "includeBonus": true,
  "includeDeductions": true
}
```

##### Get Payroll Details
```
GET /api/v1/staff/payroll/:id
```

##### Update Payroll
```
PUT /api/v1/staff/payroll/:id
```

##### Get Payroll Reports
```
GET /api/v1/staff/payroll/reports?fromDate=&toDate=&department=
```

##### Download Pay Slip
```
GET /api/v1/staff/payroll/:id/payslip
```

#### 7.5 Performance

##### Get Performance Reviews
```
GET /api/v1/staff/performance/reviews?staffId=&year=&status=
```

##### Create Performance Review
```
POST /api/v1/staff/performance/reviews
```
**Request Body**:
```json
{
  "staffId": "string",
  "reviewPeriod": "YYYY-MM",
  "reviewerId": "string",
  "ratings": {
    "workQuality": 4,
    "punctuality": 5,
    "teamwork": 4,
    "communication": 4
  },
  "comments": "string",
  "goals": ["string"]
}
```

##### Get Performance Appraisals
```
GET /api/v1/staff/performance/appraisals?staffId=&year=
```

#### 7.6 Training

##### List Training Sessions
```
GET /api/v1/staff/training/sessions?page=1&limit=10&status=&staffId=
```

##### Create Training Session
```
POST /api/v1/staff/training/sessions
```
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "trainer": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "duration": 120,
  "venue": "string",
  "participants": ["string"],
  "isMandatory": false
}
```

##### Get Training Records
```
GET /api/v1/staff/training/records?staffId=&fromDate=&toDate=
```

##### Mark Training Attendance
```
POST /api/v1/staff/training/sessions/:id/attendance
```

#### 7.7 Roles & Departments

##### List Departments
```
GET /api/v1/staff/departments?page=1&limit=10&search=
```

##### Create Department
```
POST /api/v1/staff/departments
```

##### List Roles
```
GET /api/v1/staff/roles?page=1&limit=10&search=&departmentId=
```

##### Create Role
```
POST /api/v1/staff/roles
```

#### 7.8 Academic Mapping

##### Get Staff Academic Mapping
```
GET /api/v1/staff/academic-mapping?staffId=&classId=&subjectId=
```

##### Assign Staff to Class/Subject
```
POST /api/v1/staff/academic-mapping
```
**Request Body**:
```json
{
  "staffId": "string",
  "classId": "string",
  "subjectId": "string (optional)",
  "role": "class_teacher" | "subject_teacher" | "assistant"
}
```

#### 7.9 Timetable & Workload

##### Get Staff Timetable
```
GET /api/v1/staff/timetable?staffId=&academicYear=&day=
```

##### Get Staff Workload
```
GET /api/v1/staff/workload?staffId=&academicYear=
```

#### 7.10 Finance

##### Get Staff Advances
```
GET /api/v1/staff/finance/advances?staffId=&status=
```

##### Request Advance
```
POST /api/v1/staff/finance/advances
```

##### Get Staff Loans
```
GET /api/v1/staff/finance/loans?staffId=&status=
```

##### Get Reimbursements
```
GET /api/v1/staff/finance/reimbursements?staffId=&status=
```

##### Request Reimbursement
```
POST /api/v1/staff/finance/reimbursements
Content-Type: multipart/form-data
```

#### 7.11 Communication

##### Get Notices
```
GET /api/v1/staff/communication/notices?page=1&limit=10
```

##### Send Message
```
POST /api/v1/staff/communication/messages
```

#### 7.12 Settings

##### Get HR Settings
```
GET /api/v1/staff/settings
```

##### Update HR Settings
```
PUT /api/v1/staff/settings
```

---

## 8. Fees Management Application

### Purpose
Dedicated application for comprehensive fee management including structures, payments, receipts, reports, concessions, fee rules, and refunds.

### Features
- Fee Heads Management (Create, Update, Delete fee types)
- Fee Structures Management (Create, Update, Delete structures)
- Fee Rules Management (Discounts, Waivers, Installments)
- Fee Assignment (Assign structures to students/classes)
- Payment Processing (Online, Offline, Multiple gateways)
- Receipt Generation (PDF, Email, SMS)
- Concessions Management (Scholarships, Discounts, Waivers)
- Refund Management (Process, Approve, Track)
- Fee Reports (Collection, Pending, Defaulters, Analytics)
- Payment Gateway Integration
- Settings

### API Endpoints

#### 8.1 Fee Heads

##### List Fee Heads
```
GET /api/v1/fees/heads?page=1&limit=10&search=&type=
```

##### Create Fee Head
```
POST /api/v1/fees/heads
```
**Request Body**:
```json
{
  "name": "string",
  "code": "string",
  "type": "tuition" | "library" | "sports" | "transport" | "hostel" | "other",
  "description": "string",
  "isOptional": false,
  "isRecurring": true
}
```

##### Update Fee Head
```
PUT /api/v1/fees/heads/:id
```

##### Delete Fee Head
```
DELETE /api/v1/fees/heads/:id
```

#### 8.2 Fee Structures

##### List Fee Structures
```
GET /api/v1/fees/structures?page=1&limit=10&search=&classId=&academicYear=&status=
```

##### Get Fee Structure by ID
```
GET /api/v1/fees/structures/:id
```

##### Create Fee Structure
```
POST /api/v1/fees/structures
```
**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "academicYear": "string",
  "gradeLevels": ["string"],
  "feeItems": [
    {
      "feeHeadId": "string",
      "feeType": "string",
      "name": "string",
      "amount": 50000,
      "dueDate": "YYYY-MM-DD",
      "isOptional": false,
      "installments": [
        {
          "amount": 25000,
          "dueDate": "YYYY-MM-DD"
        }
      ]
    }
  ],
  "isActive": true
}
```

##### Update Fee Structure
```
PUT /api/v1/fees/structures/:id
```

##### Delete Fee Structure
```
DELETE /api/v1/fees/structures/:id
```

##### Activate/Deactivate Fee Structure
```
PUT /api/v1/fees/structures/:id/status
```

#### 8.3 Fee Rules

##### List Fee Rules
```
GET /api/v1/fees/rules?page=1&limit=10&search=&type=
```

##### Create Fee Rule
```
POST /api/v1/fees/rules
```
**Request Body**:
```json
{
  "name": "string",
  "type": "discount" | "waiver" | "installment" | "late_fee",
  "conditions": {
    "classId": "string (optional)",
    "category": "string (optional)",
    "minAmount": 0 (optional)
  },
  "value": 10,
  "valueType": "percentage" | "fixed",
  "isActive": true
}
```

##### Update Fee Rule
```
PUT /api/v1/fees/rules/:id
```

##### Delete Fee Rule
```
DELETE /api/v1/fees/rules/:id
```

#### 8.4 Fee Assignment

##### List Fee Assignments
```
GET /api/v1/fees/assignments?page=1&limit=10&search=&studentId=&classId=&status=
```

##### Assign Fee to Student
```
POST /api/v1/fees/assignments
```
**Request Body**:
```json
{
  "studentId": "string",
  "feeStructureId": "string",
  "academicYear": "string",
  "customAmount": 0 (optional),
  "discounts": [
    {
      "ruleId": "string",
      "amount": 5000
    }
  ]
}
```

##### Bulk Assign Fee
```
POST /api/v1/fees/assignments/bulk
```
**Request Body**:
```json
{
  "classId": "string",
  "sectionId": "string (optional)",
  "feeStructureId": "string",
  "academicYear": "string",
  "studentIds": ["string"] (optional)
}
```

##### Update Fee Assignment
```
PUT /api/v1/fees/assignments/:id
```

#### 8.5 Student Fees

##### List Student Fees
```
GET /api/v1/fees/student-fees?page=1&limit=10&search=&studentId=&classId=&status=&academicYear=
```

##### Get Student Fee Details
```
GET /api/v1/fees/student-fees/:id
```

##### Get Student Fee Summary
```
GET /api/v1/fees/student-fees/:id/summary
```

#### 8.6 Payments

##### Process Payment
```
POST /api/v1/fees/payments
```
**Request Body**:
```json
{
  "studentFeeId": "string",
  "amount": 5000,
  "paymentMethod": "cash" | "online" | "cheque" | "bank_transfer" | "upi",
  "paymentDate": "YYYY-MM-DD",
  "transactionId": "string (optional)",
  "chequeNumber": "string (optional)",
  "bankName": "string (optional)",
  "remarks": "string (optional)",
  "gateway": "razorpay" | "stripe" | "payu" (optional)
}
```

##### Get Payment History
```
GET /api/v1/fees/payments?studentId=&fromDate=&toDate=&status=&paymentMethod=
```

##### Get Payment by ID
```
GET /api/v1/fees/payments/:id
```

##### Cancel Payment
```
POST /api/v1/fees/payments/:id/cancel
```

##### Generate Receipt
```
GET /api/v1/fees/payments/:id/receipt?format=pdf
```

##### Send Receipt via Email/SMS
```
POST /api/v1/fees/payments/:id/receipt/send
```
**Request Body**:
```json
{
  "channels": ["email", "sms"],
  "recipients": ["string"]
}
```

##### Payment Gateway Callback
```
POST /api/v1/fees/payments/gateway-callback
```
**Note**: This endpoint handles payment gateway webhooks

#### 8.7 Concessions

##### List Concessions
```
GET /api/v1/fees/concessions?page=1&limit=10&search=&studentId=&type=&status=
```

##### Create Concession
```
POST /api/v1/fees/concessions
```
**Request Body**:
```json
{
  "studentId": "string",
  "feeStructureId": "string",
  "type": "scholarship" | "discount" | "waiver",
  "amount": 5000,
  "percentage": 10 (optional),
  "reason": "string",
  "validFrom": "YYYY-MM-DD",
  "validTo": "YYYY-MM-DD",
  "isActive": true
}
```

##### Update Concession
```
PUT /api/v1/fees/concessions/:id
```

##### Approve/Reject Concession
```
PUT /api/v1/fees/concessions/:id/status
```

##### Delete Concession
```
DELETE /api/v1/fees/concessions/:id
```

#### 8.8 Refunds

##### List Refunds
```
GET /api/v1/fees/refunds?page=1&limit=10&search=&studentId=&status=&fromDate=&toDate=
```

##### Process Refund
```
POST /api/v1/fees/refunds
```
**Request Body**:
```json
{
  "paymentId": "string",
  "studentFeeId": "string",
  "amount": 5000,
  "reason": "string",
  "refundMethod": "cash" | "bank_transfer" | "cheque",
  "bankDetails": {
    "accountNumber": "string",
    "ifscCode": "string",
    "bankName": "string"
  } (optional)
}
```

##### Approve/Reject Refund
```
PUT /api/v1/fees/refunds/:id/status
```
**Request Body**:
```json
{
  "status": "approved" | "rejected",
  "remarks": "string (optional)"
}
```

##### Get Refund Details
```
GET /api/v1/fees/refunds/:id
```

##### Generate Refund Receipt
```
GET /api/v1/fees/refunds/:id/receipt
```

#### 8.9 Reports

##### Get Fee Reports
```
GET /api/v1/fees/reports?type=&classId=&academicYear=&status=&fromDate=&toDate=
```
**Query Parameters**:
- `type`: collection, pending, defaulters, analytics, installment, concession

##### Get Fee Dashboard
```
GET /api/v1/fees/dashboard?academicYear=&fromDate=&toDate=
```

##### Export Fee Data
```
GET /api/v1/fees/export?format=csv&type=&filters={}
```

#### 8.10 Settings

##### Get Fee Settings
```
GET /api/v1/fees/settings
```

##### Update Fee Settings
```
PUT /api/v1/fees/settings
```
**Request Body**:
```json
{
  "lateFeeEnabled": true,
  "lateFeeAmount": 500,
  "lateFeeType": "fixed" | "percentage",
  "paymentGateways": {
    "razorpay": { "enabled": true, "key": "string" },
    "stripe": { "enabled": false }
  },
  "autoReminder": true,
  "reminderDays": [7, 3, 1]
}
```

---

## 9. Online Learning Application

### Purpose
Learning Management System (LMS) for content delivery, assignments, quizzes, live classes, recorded classes, progress tracking, and virtual classrooms.

### Features
- Course Management (Create, Update, Publish, Archive)
- Content Management (Videos, Documents, Links, Notes)
- Assignment Management (Create, Grade, Track)
- Assessment Management (Quizzes, Tests, Exams)
- Live Classes (Schedule, Conduct, Record)
- Recorded Classes (Upload, Organize, Share)
- Virtual Classroom (Interactive sessions)
- Progress Tracking (Student, Class, Course level)
- Announcements
- Attendance (Online class attendance)
- Automation (Auto-assignments, Reminders)
- Admin Controls (Permissions, Settings)
- Teacher Tools (Content creation, Analytics)
- Dashboard & Analytics

### API Endpoints

#### 9.1 Dashboard

##### Get LMS Dashboard
```
GET /api/v1/lms/dashboard?academicYear=
```

#### 9.2 Courses

##### List Courses
```
GET /api/v1/lms/courses?page=1&limit=10&search=&subjectId=&classId=&status=&academicYear=
```

##### Get Course by ID
```
GET /api/v1/lms/courses/:id
```

##### Create Course
```
POST /api/v1/lms/courses
```
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "subjectId": "string",
  "classId": "string",
  "sectionId": "string (optional)",
  "academicYear": "string",
  "instructorId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "isPublic": false,
  "enrollmentType": "automatic" | "manual",
  "maxEnrollments": 0 (optional)
}
```

##### Update Course
```
PUT /api/v1/lms/courses/:id
```

##### Delete Course
```
DELETE /api/v1/lms/courses/:id
```

##### Publish Course
```
POST /api/v1/lms/courses/:id/publish
```

##### Archive Course
```
POST /api/v1/lms/courses/:id/archive
```

##### Enroll Students
```
POST /api/v1/lms/courses/:id/enroll
```
**Request Body**:
```json
{
  "studentIds": ["string"]
}
```

##### Get Course Students
```
GET /api/v1/lms/courses/:id/students
```

#### 9.3 Content Management

##### List Content
```
GET /api/v1/lms/content?courseId=&page=1&limit=10&type=&search=
```

##### Get Content by ID
```
GET /api/v1/lms/content/:id
```

##### Upload Content
```
POST /api/v1/lms/content
Content-Type: multipart/form-data
```
**Request Body** (multipart/form-data):
- `file`: File to upload (optional for links)
- `title`: Content title
- `type`: video, document, link, note
- `courseId`: Course ID
- `description`: Content description
- `url`: URL (for link type)
- `duration`: Duration in minutes (for video)
- `isRequired`: Boolean
- `order`: Display order

##### Update Content
```
PUT /api/v1/lms/content/:id
```

##### Delete Content
```
DELETE /api/v1/lms/content/:id
```

##### Reorder Content
```
POST /api/v1/lms/courses/:courseId/content/reorder
```
**Request Body**:
```json
{
  "contentOrder": [
    { "contentId": "string", "order": 1 },
    { "contentId": "string", "order": 2 }
  ]
}
```

#### 9.4 Assignments

##### List Assignments
```
GET /api/v1/lms/assignments?courseId=&page=1&limit=10&status=&search=
```

##### Get Assignment by ID
```
GET /api/v1/lms/assignments/:id
```

##### Create Assignment
```
POST /api/v1/lms/assignments
```
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "courseId": "string",
  "dueDate": "YYYY-MM-DDTHH:mm:ssZ",
  "maxScore": 100,
  "instructions": "string",
  "attachments": ["string"],
  "isGroupAssignment": false,
  "allowLateSubmission": true,
  "latePenalty": 10 (percentage)
}
```

##### Update Assignment
```
PUT /api/v1/lms/assignments/:id
```

##### Delete Assignment
```
DELETE /api/v1/lms/assignments/:id
```

##### Get Submissions
```
GET /api/v1/lms/assignments/:id/submissions?page=1&limit=10&status=
```

##### Grade Submission
```
POST /api/v1/lms/assignments/:id/submissions/:submissionId/grade
```
**Request Body**:
```json
{
  "score": 85,
  "feedback": "string",
  "gradedBy": "string"
}
```

##### Bulk Grade Submissions
```
POST /api/v1/lms/assignments/:id/submissions/bulk-grade
```

#### 9.5 Assessments

##### List Assessments
```
GET /api/v1/lms/assessments?courseId=&page=1&limit=10&type=&status=
```

##### Get Assessment by ID
```
GET /api/v1/lms/assessments/:id
```

##### Create Assessment
```
POST /api/v1/lms/assessments
```
**Request Body**:
```json
{
  "title": "string",
  "type": "quiz" | "test" | "exam",
  "courseId": "string",
  "duration": 60,
  "maxScore": 100,
  "questions": [
    {
      "question": "string",
      "type": "multiple_choice" | "true_false" | "short_answer" | "essay",
      "options": ["string"] (for multiple choice),
      "correctAnswer": "string",
      "points": 10
    }
  ],
  "startDate": "YYYY-MM-DDTHH:mm:ssZ",
  "endDate": "YYYY-MM-DDTHH:mm:ssZ",
  "isTimed": true,
  "showResults": true
}
```

##### Update Assessment
```
PUT /api/v1/lms/assessments/:id
```

##### Delete Assessment
```
DELETE /api/v1/lms/assessments/:id
```

##### Submit Assessment
```
POST /api/v1/lms/assessments/:id/submit
```
**Request Body**:
```json
{
  "answers": [
    {
      "questionId": "string",
      "answer": "string"
    }
  ]
}
```

##### Get Assessment Results
```
GET /api/v1/lms/assessments/:id/results?studentId=
```

#### 9.6 Live Classes

##### List Live Classes
```
GET /api/v1/lms/live-classes?page=1&limit=10&courseId=&status=&fromDate=&toDate=
```

##### Get Live Class by ID
```
GET /api/v1/lms/live-classes/:id
```

##### Schedule Live Class
```
POST /api/v1/lms/live-classes
```
**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "courseId": "string",
  "instructorId": "string",
  "scheduledDate": "YYYY-MM-DDTHH:mm:ssZ",
  "duration": 60,
  "meetingLink": "string",
  "platform": "zoom" | "google_meet" | "teams" | "custom",
  "isRecorded": true,
  "maxParticipants": 100
}
```

##### Update Live Class
```
PUT /api/v1/lms/live-classes/:id
```

##### Cancel Live Class
```
POST /api/v1/lms/live-classes/:id/cancel
```

##### Start Live Class
```
POST /api/v1/lms/live-classes/:id/start
```

##### End Live Class
```
POST /api/v1/lms/live-classes/:id/end
```

##### Get Live Class Attendance
```
GET /api/v1/lms/live-classes/:id/attendance
```

##### Mark Live Class Attendance
```
POST /api/v1/lms/live-classes/:id/attendance
```

#### 9.7 Recorded Classes

##### List Recorded Classes
```
GET /api/v1/lms/recorded-classes?page=1&limit=10&courseId=&search=
```

##### Upload Recorded Class
```
POST /api/v1/lms/recorded-classes
Content-Type: multipart/form-data
```
**Request Body** (multipart/form-data):
- `file`: Video file
- `title`: Class title
- `description`: Description
- `courseId`: Course ID
- `instructorId`: Instructor ID
- `recordedDate`: Date when class was recorded
- `duration`: Duration in minutes

##### Get Recorded Class by ID
```
GET /api/v1/lms/recorded-classes/:id
```

##### Update Recorded Class
```
PUT /api/v1/lms/recorded-classes/:id
```

##### Delete Recorded Class
```
DELETE /api/v1/lms/recorded-classes/:id
```

#### 9.8 Virtual Classroom

##### Create Virtual Classroom Session
```
POST /api/v1/lms/virtual-classroom
```
**Request Body**:
```json
{
  "title": "string",
  "courseId": "string",
  "instructorId": "string",
  "scheduledDate": "YYYY-MM-DDTHH:mm:ssZ",
  "duration": 60,
  "maxParticipants": 50,
  "features": {
    "whiteboard": true,
    "screenShare": true,
    "chat": true,
    "polls": true
  }
}
```

##### Join Virtual Classroom
```
POST /api/v1/lms/virtual-classroom/:id/join
```

##### Leave Virtual Classroom
```
POST /api/v1/lms/virtual-classroom/:id/leave
```

#### 9.9 Progress

##### Get Student Progress
```
GET /api/v1/lms/progress?studentId=&courseId=
```

##### Get Course Progress
```
GET /api/v1/lms/courses/:courseId/progress
```

##### Update Progress
```
POST /api/v1/lms/progress
```
**Request Body**:
```json
{
  "studentId": "string",
  "contentId": "string",
  "courseId": "string",
  "status": "not_started" | "in_progress" | "completed",
  "timeSpent": 30,
  "lastAccessed": "YYYY-MM-DDTHH:mm:ssZ"
}
```

##### Get Progress Reports
```
GET /api/v1/lms/progress/reports?courseId=&classId=&studentId=&fromDate=&toDate=
```

#### 9.10 Announcements

##### List Announcements
```
GET /api/v1/lms/announcements?courseId=&page=1&limit=10
```

##### Create Announcement
```
POST /api/v1/lms/announcements
```
**Request Body**:
```json
{
  "title": "string",
  "message": "string",
  "courseId": "string",
  "priority": "low" | "medium" | "high",
  "publishDate": "YYYY-MM-DDTHH:mm:ssZ"
}
```

##### Update Announcement
```
PUT /api/v1/lms/announcements/:id
```

##### Delete Announcement
```
DELETE /api/v1/lms/announcements/:id
```

#### 9.11 Attendance

##### Get Online Class Attendance
```
GET /api/v1/lms/attendance?courseId=&classId=&fromDate=&toDate=
```

##### Mark Attendance
```
POST /api/v1/lms/attendance
```

#### 9.12 Automation

##### Get Automation Rules
```
GET /api/v1/lms/automation/rules?courseId=
```

##### Create Automation Rule
```
POST /api/v1/lms/automation/rules
```
**Request Body**:
```json
{
  "name": "string",
  "courseId": "string",
  "trigger": "content_completion" | "date" | "enrollment",
  "action": "assign_assignment" | "send_notification" | "unlock_content",
  "conditions": {},
  "isActive": true
}
```

##### Update Automation Rule
```
PUT /api/v1/lms/automation/rules/:id
```

##### Delete Automation Rule
```
DELETE /api/v1/lms/automation/rules/:id
```

#### 9.13 Admin Controls

##### Get Admin Settings
```
GET /api/v1/lms/admin/settings
```

##### Update Admin Settings
```
PUT /api/v1/lms/admin/settings
```

##### Get Permissions
```
GET /api/v1/lms/admin/permissions
```

##### Update Permissions
```
PUT /api/v1/lms/admin/permissions
```

#### 9.14 Teacher Tools

##### Get Teacher Analytics
```
GET /api/v1/lms/teacher/analytics?courseId=&fromDate=&toDate=
```

##### Get Content Analytics
```
GET /api/v1/lms/teacher/content-analytics?contentId=&courseId=
```

---

## 10. Transport Application

### Purpose
Transport management for school buses, routes, drivers, student transportation, tracking, and attendance.

### Features
- Dashboard (Overview, Statistics)
- Vehicle Management (CRUD, Maintenance, Insurance)
- Route Management (Create, Update, Stops, Mapping)
- Driver Management (CRUD, License, Documents)
- Student Mapping (Assign, Update, Remove)
- Attendance Tracking (Bus attendance, Reports)
- Route Tracking (Real-time, History)
- Settings

### API Endpoints

#### 10.1 Dashboard

##### Get Transport Dashboard
```
GET /api/v1/transport/dashboard
```
**Response**: Overview including total vehicles, routes, drivers, students, active trips, attendance stats

#### 10.2 Vehicles

##### List Vehicles
```
GET /api/v1/transport/vehicles?page=1&limit=10&search=&status=&type=
```

##### Get Vehicle by ID
```
GET /api/v1/transport/vehicles/:id
```

##### Create Vehicle
```
POST /api/v1/transport/vehicles
```
**Request Body**:
```json
{
  "vehicleNumber": "string",
  "type": "bus" | "van" | "car",
  "make": "string",
  "model": "string",
  "year": 2020,
  "capacity": 40,
  "registrationNumber": "string",
  "insuranceNumber": "string",
  "insuranceExpiry": "YYYY-MM-DD",
  "fitnessExpiry": "YYYY-MM-DD",
  "permitExpiry": "YYYY-MM-DD",
  "status": "active" | "maintenance" | "inactive"
}
```

##### Update Vehicle
```
PUT /api/v1/transport/vehicles/:id
```

##### Delete Vehicle
```
DELETE /api/v1/transport/vehicles/:id
```

##### Get Vehicle Maintenance Records
```
GET /api/v1/transport/vehicles/:id/maintenance
```

##### Add Maintenance Record
```
POST /api/v1/transport/vehicles/:id/maintenance
```
**Request Body**:
```json
{
  "type": "service" | "repair" | "inspection",
  "date": "YYYY-MM-DD",
  "description": "string",
  "cost": 5000,
  "nextServiceDate": "YYYY-MM-DD"
}
```

#### 10.3 Routes

##### List Routes
```
GET /api/v1/transport/routes?page=1&limit=10&search=&status=
```

##### Get Route by ID
```
GET /api/v1/transport/routes/:id
```

##### Create Route
```
POST /api/v1/transport/routes
```
**Request Body**:
```json
{
  "name": "string",
  "code": "string",
  "startLocation": "string",
  "endLocation": "string",
  "vehicleId": "string",
  "driverId": "string",
  "stops": [
    {
      "name": "string",
      "address": "string",
      "latitude": 0,
      "longitude": 0,
      "order": 1,
      "pickupTime": "HH:mm",
      "dropTime": "HH:mm"
    }
  ],
  "distance": 0,
  "estimatedDuration": 0,
  "isActive": true
}
```

##### Update Route
```
PUT /api/v1/transport/routes/:id
```

##### Delete Route
```
DELETE /api/v1/transport/routes/:id
```

##### Get Route Stops
```
GET /api/v1/transport/routes/:id/stops
```

##### Add Route Stop
```
POST /api/v1/transport/routes/:id/stops
```

##### Update Route Stop
```
PUT /api/v1/transport/routes/:id/stops/:stopId
```

##### Delete Route Stop
```
DELETE /api/v1/transport/routes/:id/stops/:stopId
```

#### 10.4 Drivers

##### List Drivers
```
GET /api/v1/transport/drivers?page=1&limit=10&search=&status=&licenseExpiry=
```

##### Get Driver by ID
```
GET /api/v1/transport/drivers/:id
```

##### Create Driver
```
POST /api/v1/transport/drivers
```
**Request Body**:
```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "licenseNumber": "string",
  "licenseType": "string",
  "licenseExpiry": "YYYY-MM-DD",
  "address": "string",
  "emergencyContact": "string",
  "status": "active" | "inactive" | "suspended"
}
```

##### Update Driver
```
PUT /api/v1/transport/drivers/:id
```

##### Delete Driver
```
DELETE /api/v1/transport/drivers/:id
```

##### Get Driver Documents
```
GET /api/v1/transport/drivers/:id/documents
```

##### Upload Driver Document
```
POST /api/v1/transport/drivers/:id/documents
Content-Type: multipart/form-data
```

##### Get Driver Assignments
```
GET /api/v1/transport/drivers/:id/assignments
```

#### 10.5 Student Mapping

##### List Student Mappings
```
GET /api/v1/transport/student-mapping?page=1&limit=10&search=&routeId=&studentId=
```

##### Assign Student to Route
```
POST /api/v1/transport/student-mapping
```
**Request Body**:
```json
{
  "studentId": "string",
  "routeId": "string",
  "stopId": "string",
  "pickupTime": "HH:mm",
  "dropTime": "HH:mm",
  "academicYear": "string",
  "isActive": true
}
```

##### Update Student Mapping
```
PUT /api/v1/transport/student-mapping/:id
```

##### Remove Student from Route
```
DELETE /api/v1/transport/student-mapping/:id
```

##### Get Student Route
```
GET /api/v1/transport/students/:studentId/route
```

##### Bulk Assign Students
```
POST /api/v1/transport/student-mapping/bulk
```
**Request Body**:
```json
{
  "routeId": "string",
  "studentIds": ["string"],
  "stopId": "string"
}
```

#### 10.6 Attendance

##### Mark Bus Attendance
```
POST /api/v1/transport/attendance
```
**Request Body**:
```json
{
  "routeId": "string",
  "vehicleId": "string",
  "date": "YYYY-MM-DD",
  "tripType": "pickup" | "drop",
  "attendance": [
    {
      "studentId": "string",
      "status": "present" | "absent" | "late"
    }
  ]
}
```

##### Get Bus Attendance
```
GET /api/v1/transport/attendance?date=&routeId=&vehicleId=&tripType=
```

##### Get Student Transport Attendance
```
GET /api/v1/transport/students/:studentId/attendance?fromDate=&toDate=
```

##### Get Attendance Statistics
```
GET /api/v1/transport/attendance/statistics?routeId=&fromDate=&toDate=
```

##### Get Attendance Reports
```
GET /api/v1/transport/attendance/reports?type=&fromDate=&toDate=&routeId=
```

#### 10.7 Tracking

##### Start Route Tracking
```
POST /api/v1/transport/tracking/start
```
**Request Body**:
```json
{
  "routeId": "string",
  "vehicleId": "string",
  "driverId": "string",
  "tripType": "pickup" | "drop"
}
```

##### Update Location
```
POST /api/v1/transport/tracking/:trackingId/location
```
**Request Body**:
```json
{
  "latitude": 0,
  "longitude": 0,
  "speed": 0,
  "heading": 0,
  "timestamp": "YYYY-MM-DDTHH:mm:ssZ"
}
```

##### Get Real-time Location
```
GET /api/v1/transport/tracking/:trackingId/location
```

##### End Route Tracking
```
POST /api/v1/transport/tracking/:trackingId/end
```

##### Get Tracking History
```
GET /api/v1/transport/tracking/history?routeId=&vehicleId=&fromDate=&toDate=
```

##### Get Route Tracking Status
```
GET /api/v1/transport/routes/:routeId/tracking-status
```

#### 10.8 Settings

##### Get Transport Settings
```
GET /api/v1/transport/settings
```

##### Update Transport Settings
```
PUT /api/v1/transport/settings
```
**Request Body**:
```json
{
  "attendanceRequired": true,
  "trackingEnabled": true,
  "notificationsEnabled": true,
  "autoAttendance": false,
  "geofenceRadius": 100
}
```

---

## 11. Marketing Application

### Purpose
Marketing and communication tools for school promotion, lead management, campaign tracking, and tenant onboarding.

### Features
- Home Page (Landing page content)
- About Page (School information)
- Features Page (Feature showcase)
- Pricing Page (Pricing plans)
- Tenant Onboarding (Registration flow)
- Lead Management (Capture, Track, Convert)
- Campaign Management (Email, SMS, Push)
- Analytics & Reports
- Settings

### API Endpoints

#### 11.1 Home Page

##### Get Home Page Content
```
GET /api/v1/marketing/home
```

##### Update Home Page Content
```
PUT /api/v1/marketing/home
```
**Request Body**:
```json
{
  "heroTitle": "string",
  "heroSubtitle": "string",
  "heroImage": "string",
  "features": [
    {
      "title": "string",
      "description": "string",
      "icon": "string"
    }
  ],
  "testimonials": [
    {
      "name": "string",
      "role": "string",
      "content": "string",
      "image": "string"
    }
  ]
}
```

#### 11.2 About Page

##### Get About Page Content
```
GET /api/v1/marketing/about
```

##### Update About Page Content
```
PUT /api/v1/marketing/about
```

#### 11.3 Features Page

##### Get Features Page Content
```
GET /api/v1/marketing/features
```

##### Update Features Page Content
```
PUT /api/v1/marketing/features
```

#### 11.4 Pricing Page

##### Get Pricing Plans
```
GET /api/v1/marketing/pricing
```

##### Update Pricing Plans
```
PUT /api/v1/marketing/pricing
```
**Request Body**:
```json
{
  "plans": [
    {
      "name": "string",
      "price": 0,
      "billingCycle": "monthly" | "yearly",
      "features": ["string"],
      "isPopular": false,
      "isActive": true
    }
  ]
}
```

#### 11.5 Tenant Onboarding

##### Get Onboarding Steps
```
GET /api/v1/marketing/onboarding/steps
```

##### Update Onboarding Progress
```
POST /api/v1/marketing/onboarding/progress
```
**Request Body**:
```json
{
  "tenantId": "string",
  "step": "string",
  "data": {}
}
```

##### Complete Onboarding
```
POST /api/v1/marketing/onboarding/complete
```
**Request Body**:
```json
{
  "tenantId": "string",
  "onboardingData": {}
}
```

#### 11.6 Leads

##### List Leads
```
GET /api/v1/marketing/leads?page=1&limit=10&search=&status=&source=&fromDate=&toDate=
```

##### Get Lead by ID
```
GET /api/v1/marketing/leads/:id
```

##### Create Lead
```
POST /api/v1/marketing/leads
```
**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "source": "website" | "referral" | "social_media" | "advertisement" | "other",
  "interest": "string",
  "notes": "string",
  "assignedTo": "string (optional)"
}
```

##### Update Lead
```
PUT /api/v1/marketing/leads/:id
```

##### Delete Lead
```
DELETE /api/v1/marketing/leads/:id
```

##### Convert Lead
```
POST /api/v1/marketing/leads/:id/convert
```
**Request Body**:
```json
{
  "conversionType": "enquiry" | "application" | "registration",
  "notes": "string"
}
```

##### Add Lead Note
```
POST /api/v1/marketing/leads/:id/notes
```

##### Get Lead History
```
GET /api/v1/marketing/leads/:id/history
```

#### 11.7 Campaigns

##### List Campaigns
```
GET /api/v1/marketing/campaigns?page=1&limit=10&search=&status=&type=&fromDate=&toDate=
```

##### Get Campaign by ID
```
GET /api/v1/marketing/campaigns/:id
```

##### Create Campaign
```
POST /api/v1/marketing/campaigns
```
**Request Body**:
```json
{
  "name": "string",
  "type": "email" | "sms" | "push" | "social",
  "subject": "string",
  "content": "string",
  "targetAudience": {
    "type": "all" | "leads" | "custom",
    "leadIds": ["string"] (optional),
    "filters": {} (optional)
  },
  "scheduledDate": "YYYY-MM-DDTHH:mm:ssZ",
  "isScheduled": false
}
```

##### Update Campaign
```
PUT /api/v1/marketing/campaigns/:id
```

##### Delete Campaign
```
DELETE /api/v1/marketing/campaigns/:id
```

##### Send Campaign
```
POST /api/v1/marketing/campaigns/:id/send
```

##### Schedule Campaign
```
POST /api/v1/marketing/campaigns/:id/schedule
```
**Request Body**:
```json
{
  "scheduledDate": "YYYY-MM-DDTHH:mm:ssZ"
}
```

##### Cancel Scheduled Campaign
```
POST /api/v1/marketing/campaigns/:id/cancel
```

##### Get Campaign Performance
```
GET /api/v1/marketing/campaigns/:id/performance
```

#### 11.8 Analytics

##### Get Campaign Analytics
```
GET /api/v1/marketing/analytics/campaigns?campaignId=&fromDate=&toDate=
```
**Response**:
```json
{
  "totalSent": 1000,
  "delivered": 950,
  "opened": 800,
  "clicked": 200,
  "bounced": 50,
  "unsubscribed": 10,
  "openRate": 80,
  "clickRate": 20
}
```

##### Get Lead Analytics
```
GET /api/v1/marketing/analytics/leads?fromDate=&toDate=&source=
```
**Response**:
```json
{
  "totalLeads": 500,
  "newLeads": 100,
  "convertedLeads": 50,
  "conversionRate": 10,
  "bySource": {
    "website": 200,
    "referral": 150,
    "social_media": 100
  },
  "byStatus": {
    "new": 200,
    "contacted": 150,
    "qualified": 100,
    "converted": 50
  }
}
```

##### Get Overall Analytics
```
GET /api/v1/marketing/analytics/overall?fromDate=&toDate=
```

#### 11.9 Settings

##### Get Marketing Settings
```
GET /api/v1/marketing/settings
```

##### Update Marketing Settings
```
PUT /api/v1/marketing/settings
```
**Request Body**:
```json
{
  "emailProvider": {
    "type": "smtp" | "sendgrid" | "mailgun",
    "config": {}
  },
  "smsProvider": {
    "type": "twilio" | "msg91" | "custom",
    "config": {}
  },
  "socialMedia": {
    "facebook": "string",
    "twitter": "string",
    "instagram": "string",
    "linkedin": "string"
  }
}
```

---

## Common Patterns & Standards

### Authentication
- All endpoints (except auth endpoints) require Bearer token
- Token should be included in `Authorization` header
- Token expiration should return 401

### Error Handling
- Use standard HTTP status codes
- Error response format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* optional additional details */ }
  }
}
```

### Pagination
- Default: `page=1`, `limit=10`
- Response includes: `total`, `page`, `limit`, `totalPages`

### Search
- Case-insensitive
- Searches across relevant fields (name, email, ID, etc.)

### Filtering
- Multiple filters can be combined
- Date ranges: `fromDate`, `toDate` (format: `YYYY-MM-DD`)

### File Uploads
- Use `multipart/form-data`
- Maximum file size: 10MB (configurable)
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, MP4, etc.

### Date Formats
- Date only: `YYYY-MM-DD`
- Date and time: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601)

### Monetary Values
- Store in smallest currency unit (paise for INR)
- Display in standard format (₹1,000.00)

---

## Implementation Priority

### Phase 1 (Critical)
1. Auth Application
2. Super Admin Application (Core features)
3. Admin Application (Core features: Students, Teachers, Classes, Attendance)

### Phase 2 (High Priority)
4. Admin Application (Remaining features: Exams, Fees, Timetable)
5. Teacher Application
6. Student Application

### Phase 3 (Medium Priority)
7. Parent Application
8. Fees Management Application
9. Online Learning Application

### Phase 4 (Lower Priority)
10. Staff HR Application
11. Transport Application
12. Marketing Application

---

## Notes for Backend Team

1. **Base URL Structure**:
   - Regular APIs: `/api/v1/...`
   - Super Admin APIs: `/api/super-admin/...` (no `/v1`)

2. **Data Scoping**:
   - All endpoints should scope data by `tenantId` (from token)
   - Super Admin can access all tenants
   - Regular users can only access their tenant's data

3. **Permissions**:
   - Implement role-based access control (RBAC)
   - Validate permissions on each endpoint

4. **Validation**:
   - Validate all input data
   - Return clear error messages
   - Use appropriate HTTP status codes

5. **Performance**:
   - Implement pagination for all list endpoints
   - Use database indexes for search/filter operations
   - Consider caching for frequently accessed data

6. **Security**:
   - Sanitize all inputs
   - Implement rate limiting
   - Use HTTPS in production
   - Validate file uploads

7. **Documentation**:
   - Use OpenAPI/Swagger for API documentation
   - Include request/response examples
   - Document error codes

---

**Last Updated**: 2024-12-19
**Version**: 2.0
**Status**: Comprehensive - All Features Documented ✅

## Summary

This document now includes comprehensive API requirements for all 11 applications:

1. **Auth Application** - Complete authentication and registration flows
2. **Super Admin Application** - Full platform management with 8 major modules
3. **Admin Application** - Complete school management with 16+ modules and 200+ endpoints
4. **Teacher Application** - Full teaching workflow with 12+ modules
5. **Student Application** - Complete student portal with 13+ modules
6. **Parent Application** - Comprehensive parent portal with 14+ modules
7. **Staff HR Application** - Full HR management with 12+ modules
8. **Fees Management Application** - Complete fee system with 10+ modules
9. **Online Learning Application** - Full LMS with 14+ modules
10. **Transport Application** - Complete transport management with 8+ modules
11. **Marketing Application** - Full marketing suite with 9+ modules

**Total Estimated Endpoints**: 500+ API endpoints across all applications

All endpoints include:
- HTTP method and path
- Request body examples (where applicable)
- Response examples
- Query parameters
- Detailed descriptions

