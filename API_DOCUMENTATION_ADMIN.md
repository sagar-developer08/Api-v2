# Admin App - API Documentation

## Overview
This document outlines all API endpoints required for the Admin application. The Admin app manages school operations including students, teachers, classes, attendance, exams, fees, and more.

**Base URL**: `https://vidhyaapi.sagecrafts.in/api/v1`

**Authentication**: All endpoints require Bearer token authentication in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Table of Contents
1. [Dashboard](#dashboard)
2. [School Profile](#school-profile)
3. [Students](#students)
4. [Teachers](#teachers)
5. [Classes](#classes)
6. [Sections](#sections)
7. [Subjects](#subjects)
8. [Attendance](#attendance)
9. [Timetable](#timetable)
10. [Exams](#exams)
11. [Fees](#fees)
12. [Grades](#grades)
13. [Admissions](#admissions)
14. [Communication](#communication)
15. [Reports](#reports)
16. [Settings](#settings)

---

## Dashboard

### Get Dashboard Statistics
**GET** `/admin/dashboard/stats`

**Query Parameters:**
- `academicYear` (optional): Filter by academic year
- `classId` (optional): Filter by class ID

**Response:**
```json
{
  "totalStudents": 1250,
  "totalTeachers": 45,
  "totalClasses": 35,
  "totalSections": 70,
  "totalSubjects": 25,
  "attendanceToday": {
    "present": 1100,
    "absent": 150,
    "percentage": 88.0
  },
  "pendingFees": {
    "count": 45,
    "amount": 1250000
  },
  "upcomingExams": 5,
  "recentAnnouncements": 3
}
```

---

## School Profile

### Get School Profile
**GET** `/school/profile`

**Query Parameters:**
- `step` (optional): Profile step to retrieve (`basic`, `contact`, `academic`, `infrastructure`, `staff`, `policies`)

**Response:**
```json
{
  "id": "school-123",
  "name": "Greenwood High School",
  "code": "GHS",
  "type": "secondary",
  "board": "CBSE",
  "establishedYear": 1995,
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "contact": {
    "phone": "+91-22-12345678",
    "email": "info@greenwood.edu",
    "website": "www.greenwood.edu"
  },
  "logo": "https://...",
  "academicYear": "2024-2025",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Update School Profile
**PUT** `/school/profile`

**Request Body:**
```json
{
  "name": "Greenwood High School",
  "code": "GHS",
  "type": "secondary",
  "board": "CBSE",
  "establishedYear": 1995,
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "contact": {
    "phone": "+91-22-12345678",
    "email": "info@greenwood.edu",
    "website": "www.greenwood.edu"
  }
}
```

---

## Students

### Get Students List
**GET** `/admin/students`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `search` (optional): Search by name, student ID, email
- `classId` (optional): Filter by class
- `sectionId` (optional): Filter by section
- `status` (optional): Filter by status (`active`, `inactive`, `graduated`)
- `academicYear` (optional): Filter by academic year

**Response:**
```json
{
  "data": [
    {
      "id": "student-123",
      "studentId": "ST001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@school.com",
      "phone": "+91-98765-43210",
      "dateOfBirth": "2010-05-15",
      "gender": "male",
      "address": "123 Main St",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "rollNumber": "1",
      "academicYear": "2024-2025",
      "parentName": "Jane Doe",
      "parentEmail": "jane.doe@email.com",
      "parentPhone": "+91-98765-43211",
      "status": "active",
      "admissionDate": "2024-04-01",
      "profilePhoto": "https://...",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 10,
  "totalPages": 125
}
```

### Get Student Details
**GET** `/admin/students/:studentId`

**Response:**
```json
{
  "id": "student-123",
  "studentId": "ST001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "phone": "+91-98765-43210",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "address": "123 Main St",
  "classId": "class-1",
  "className": "Grade 9-A",
  "sectionId": "section-1",
  "sectionName": "A",
  "rollNumber": "1",
  "academicYear": "2024-2025",
  "parentName": "Jane Doe",
  "parentEmail": "jane.doe@email.com",
  "parentPhone": "+91-98765-43211",
  "status": "active",
  "admissionDate": "2024-04-01",
  "profilePhoto": "https://...",
  "guardians": [
    {
      "id": "guardian-1",
      "type": "father",
      "name": "John Doe Sr.",
      "relationship": "Father",
      "phone": "+91-98765-43210",
      "email": "john.sr@email.com",
      "address": "123 Main St",
      "occupation": "Engineer",
      "isPrimary": true,
      "isEmergencyContact": true
    }
  ],
  "documents": [],
  "academicHistory": [],
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-01T00:00:00Z"
}
```

### Create Student
**POST** `/admin/students`

**Request Body:**
```json
{
  "studentId": "ST001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "phone": "+91-98765-43210",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "address": "123 Main St",
  "classId": "class-1",
  "sectionId": "section-1",
  "rollNumber": "1",
  "academicYear": "2024-2025",
  "parentName": "Jane Doe",
  "parentEmail": "jane.doe@email.com",
  "parentPhone": "+91-98765-43211",
  "admissionDate": "2024-04-01"
}
```

### Update Student
**PUT** `/admin/students/:studentId`

**Request Body:** (Same as Create, all fields optional)

### Delete Student
**DELETE** `/admin/students/:studentId`

### Bulk Delete Students
**DELETE** `/admin/students/bulk`

**Request Body:**
```json
{
  "studentIds": ["student-1", "student-2", "student-3"]
}
```

### Get Student Attendance
**GET** `/admin/students/:studentId/attendance`

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `subjectId` (optional): Filter by subject

**Response:**
```json
{
  "data": [
    {
      "id": "attendance-1",
      "date": "2024-09-15",
      "status": "present",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "remarks": ""
    }
  ],
  "summary": {
    "totalDays": 100,
    "present": 95,
    "absent": 5,
    "percentage": 95.0
  }
}
```

### Get Student Academic Details
**GET** `/admin/students/:studentId/academic`

**Response:**
```json
{
  "currentClassId": "class-1",
  "currentClassName": "Grade 9-A",
  "currentSectionId": "section-1",
  "currentSectionName": "A",
  "rollNumber": "1",
  "academicYear": "2024-2025",
  "enrolledSubjects": [
    {
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "subjectCode": "MATH",
      "isElective": false
    }
  ],
  "promotionHistory": [],
  "performanceSnapshot": {
    "averageScore": 85.5,
    "overallGrade": "A",
    "rank": 5
  }
}
```

### Get Student Fees
**GET** `/admin/students/:studentId/fees`

**Response:**
```json
{
  "data": [
    {
      "id": "fee-1",
      "feeStructureId": "fee-structure-1",
      "feeStructureName": "Grade 9 Fee Structure",
      "academicYear": "2024-2025",
      "totalAmount": 55000,
      "paidAmount": 30000,
      "dueAmount": 25000,
      "status": "partial",
      "dueDate": "2024-04-01",
      "payments": []
    }
  ],
  "summary": {
    "totalDue": 25000,
    "totalPaid": 30000,
    "totalAmount": 55000
  }
}
```

### Get Student Guardians
**GET** `/admin/students/:studentId/guardians`

**Response:**
```json
{
  "data": [
    {
      "id": "guardian-1",
      "type": "father",
      "name": "John Doe Sr.",
      "relationship": "Father",
      "phone": "+91-98765-43210",
      "email": "john.sr@email.com",
      "address": "123 Main St",
      "occupation": "Engineer",
      "isPrimary": true,
      "isEmergencyContact": true,
      "createdAt": "2024-04-01T00:00:00Z"
    }
  ]
}
```

### Add Student Guardian
**POST** `/admin/students/:studentId/guardians`

**Request Body:**
```json
{
  "type": "father",
  "name": "John Doe Sr.",
  "relationship": "Father",
  "phone": "+91-98765-43210",
  "email": "john.sr@email.com",
  "address": "123 Main St",
  "occupation": "Engineer",
  "isPrimary": true,
  "isEmergencyContact": true
}
```

### Delete Student Guardian
**DELETE** `/admin/students/:studentId/guardians/:guardianId`

### Get Student Documents
**GET** `/admin/students/:studentId/documents`

### Upload Student Document
**POST** `/admin/students/:studentId/documents`

**Request:** Multipart form data
- `file`: File to upload
- `documentType`: Type of document
- `description`: Optional description

### Delete Student Document
**DELETE** `/admin/students/:studentId/documents/:documentId`

---

## Teachers

### Get Teachers List
**GET** `/admin/teachers`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by name, email, employee ID
- `departmentId` (optional): Filter by department
- `status` (optional): Filter by status (`active`, `inactive`)

**Response:**
```json
{
  "data": [
    {
      "id": "teacher-123",
      "employeeId": "EMP001",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.johnson@school.com",
      "phone": "+91-98765-43210",
      "dateOfBirth": "1985-03-20",
      "gender": "female",
      "address": "456 Oak St",
      "departmentId": "dept-1",
      "departmentName": "Mathematics",
      "designation": "Senior Teacher",
      "joiningDate": "2020-04-01",
      "status": "active",
      "profilePhoto": "https://...",
      "qualifications": [],
      "assignments": [],
      "createdAt": "2020-04-01T00:00:00Z",
      "updatedAt": "2020-04-01T00:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Get Teacher Details
**GET** `/admin/teachers/:teacherId`

**Response:**
```json
{
  "id": "teacher-123",
  "employeeId": "EMP001",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@school.com",
  "phone": "+91-98765-43210",
  "dateOfBirth": "1985-03-20",
  "gender": "female",
  "address": "456 Oak St",
  "departmentId": "dept-1",
  "departmentName": "Mathematics",
  "designation": "Senior Teacher",
  "joiningDate": "2020-04-01",
  "status": "active",
  "profilePhoto": "https://...",
  "qualifications": [
    {
      "id": "qual-1",
      "type": "degree",
      "name": "M.Sc Mathematics",
      "institution": "University of Mumbai",
      "year": "2010",
      "documentUrl": "https://..."
    }
  ],
  "assignments": [
    {
      "id": "assignment-1",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "isClassTeacher": true,
      "periodsPerWeek": 6,
      "academicYear": "2024-2025"
    }
  ],
  "createdAt": "2020-04-01T00:00:00Z",
  "updatedAt": "2020-04-01T00:00:00Z"
}
```

### Create Teacher
**POST** `/admin/teachers`

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@school.com",
  "phone": "+91-98765-43210",
  "dateOfBirth": "1985-03-20",
  "gender": "female",
  "address": "456 Oak St",
  "departmentId": "dept-1",
  "designation": "Senior Teacher",
  "joiningDate": "2020-04-01"
}
```

### Update Teacher
**PUT** `/admin/teachers/:teacherId`

### Delete Teacher
**DELETE** `/admin/teachers/:teacherId`

### Bulk Delete Teachers
**DELETE** `/admin/teachers/bulk`

**Request Body:**
```json
{
  "teacherIds": ["teacher-1", "teacher-2"]
}
```

### Get Teacher Qualifications
**GET** `/admin/teachers/:teacherId/qualifications`

### Add Teacher Qualification
**POST** `/admin/teachers/:teacherId/qualifications`

**Request Body:**
```json
{
  "type": "degree",
  "name": "M.Sc Mathematics",
  "institution": "University of Mumbai",
  "year": "2010",
  "documentUrl": "https://..."
}
```

### Delete Teacher Qualification
**DELETE** `/admin/teachers/:teacherId/qualifications/:qualificationId`

### Get Teacher Documents
**GET** `/admin/teachers/:teacherId/documents`

### Upload Teacher Document
**POST** `/admin/teachers/:teacherId/documents`

### Delete Teacher Document
**DELETE** `/admin/teachers/:teacherId/documents/:documentId`

### Get Teacher Assignments
**GET** `/admin/teachers/:teacherId/assignments`

**Response:**
```json
{
  "data": [
    {
      "id": "assignment-1",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "isClassTeacher": true,
      "periodsPerWeek": 6,
      "academicYear": "2024-2025"
    }
  ]
}
```

---

## Classes

### Get Classes List
**GET** `/admin/classes`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by name, code
- `grade` (optional): Filter by grade level
- `academicYear` (optional): Filter by academic year

**Response:**
```json
{
  "data": [
    {
      "id": "class-1",
      "name": "Grade 9-A",
      "code": "G9A",
      "grade": "9",
      "section": "A",
      "academicYear": "2024-2025",
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "studentCount": 30,
      "maxStudents": 35,
      "subjects": ["subject-1", "subject-2"],
      "roomNumber": "101",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 35,
  "page": 1,
  "limit": 10,
  "totalPages": 4
}
```

### Get Class Details
**GET** `/admin/classes/:classId`

**Response:**
```json
{
  "id": "class-1",
  "name": "Grade 9-A",
  "code": "G9A",
  "grade": "9",
  "section": "A",
  "academicYear": "2024-2025",
  "teacherId": "teacher-1",
  "teacherName": "Sarah Johnson",
  "studentCount": 30,
  "maxStudents": 35,
  "subjects": [
    {
      "id": "subject-1",
      "name": "Mathematics",
      "code": "MATH",
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson"
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "A",
      "studentCount": 30
    }
  ],
  "roomNumber": "101",
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-01T00:00:00Z"
}
```

### Create Class
**POST** `/admin/classes`

**Request Body:**
```json
{
  "name": "Grade 9-A",
  "code": "G9A",
  "grade": "9",
  "section": "A",
  "academicYear": "2024-2025",
  "teacherId": "teacher-1",
  "maxStudents": 35,
  "roomNumber": "101"
}
```

### Update Class
**PUT** `/admin/classes/:classId`

### Delete Class
**DELETE** `/admin/classes/:classId`

### Archive Class
**POST** `/admin/classes/:classId/archive`

### Get Class Students
**GET** `/admin/classes/:classId/students`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)

### Get Class Subjects
**GET** `/admin/classes/:classId/subjects`

### Get Class Attendance
**GET** `/admin/classes/:classId/attendance`

**Query Parameters:**
- `date` (optional): Specific date (YYYY-MM-DD)
- `startDate` (optional): Start date range
- `endDate` (optional): End date range

### Get Class Timetable
**GET** `/admin/classes/:classId/timetable`

### Get Class Fee Structure
**GET** `/admin/classes/:classId/fee-structure`

---

## Sections

### Get Sections List
**GET** `/admin/sections`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `classId` (optional): Filter by class
- `search` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "section-1",
      "name": "A",
      "classId": "class-1",
      "className": "Grade 9-A",
      "studentCount": 30,
      "maxStudents": 35,
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "academicYear": "2024-2025",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 70,
  "page": 1,
  "limit": 10,
  "totalPages": 7
}
```

### Get Section Details
**GET** `/admin/sections/:sectionId`

### Create Section
**POST** `/admin/sections`

**Request Body:**
```json
{
  "name": "A",
  "classId": "class-1",
  "maxStudents": 35,
  "teacherId": "teacher-1",
  "academicYear": "2024-2025"
}
```

### Update Section
**PUT** `/admin/sections/:sectionId`

### Delete Section
**DELETE** `/admin/sections/:sectionId`

### Get Section Students
**GET** `/admin/sections/:sectionId/students`

### Get Section Attendance
**GET** `/admin/sections/:sectionId/attendance`

### Get Section Timetable
**GET** `/admin/sections/:sectionId/timetable`

---

## Subjects

### Get Subjects List
**GET** `/admin/subjects`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)
- `departmentId` (optional)
- `gradeLevel` (optional)
- `status` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "subject-1",
      "name": "Mathematics",
      "code": "MATH",
      "description": "Algebra, Geometry, Calculus",
      "departmentId": "dept-1",
      "departmentName": "Mathematics",
      "gradeLevels": ["9", "10"],
      "credits": 4,
      "teacherIds": ["teacher-1"],
      "teacherNames": ["Sarah Johnson"],
      "status": "active",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Get Subject Details
**GET** `/admin/subjects/:subjectId`

### Create Subject
**POST** `/admin/subjects`

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH",
  "description": "Algebra, Geometry, Calculus",
  "departmentId": "dept-1",
  "gradeLevels": ["9", "10"],
  "credits": 4,
  "teacherIds": ["teacher-1"]
}
```

### Update Subject
**PUT** `/admin/subjects/:subjectId`

### Delete Subject
**DELETE** `/admin/subjects/:subjectId`

### Bulk Delete Subjects
**DELETE** `/admin/subjects/bulk`

### Get Subject Teachers
**GET** `/admin/subjects/:subjectId/teachers`

### Assign Teacher to Subject
**POST** `/admin/subjects/:subjectId/teachers`

**Request Body:**
```json
{
  "teacherId": "teacher-1",
  "classId": "class-1",
  "sectionId": "section-1"
}
```

### Remove Teacher from Subject
**DELETE** `/admin/subjects/:subjectId/teachers/:teacherId`

### Get Subject Class Mapping
**GET** `/admin/subjects/:subjectId/class-mapping`

### Map Subject to Class
**POST** `/admin/subjects/:subjectId/class-mapping`

**Request Body:**
```json
{
  "classId": "class-1",
  "sectionId": "section-1",
  "teacherId": "teacher-1",
  "periodsPerWeek": 6
}
```

### Remove Subject Class Mapping
**DELETE** `/admin/subjects/:subjectId/class-mapping/:mappingId`

---

## Attendance

### Get Attendance Records
**GET** `/admin/attendance`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `date` (optional): Specific date (YYYY-MM-DD)
- `startDate` (optional): Start date range
- `endDate` (optional): End date range
- `classId` (optional): Filter by class
- `sectionId` (optional): Filter by section
- `subjectId` (optional): Filter by subject
- `studentId` (optional): Filter by student
- `status` (optional): Filter by status (`present`, `absent`, `late`, `excused`)

**Response:**
```json
{
  "data": [
    {
      "id": "attendance-1",
      "studentId": "student-1",
      "studentName": "John Doe",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "date": "2024-09-15",
      "status": "present",
      "remarks": "",
      "markedBy": "teacher-1",
      "markedByName": "Sarah Johnson",
      "createdAt": "2024-09-15T08:00:00Z",
      "updatedAt": "2024-09-15T08:00:00Z"
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 10,
  "totalPages": 100
}
```

### Mark Attendance (Bulk)
**POST** `/admin/attendance/bulk`

**Request Body:**
```json
{
  "classId": "class-1",
  "sectionId": "section-1",
  "subjectId": "subject-1",
  "date": "2024-09-15",
  "attendances": [
    {
      "studentId": "student-1",
      "status": "present",
      "remarks": ""
    },
    {
      "studentId": "student-2",
      "status": "absent",
      "remarks": "Sick"
    }
  ]
}
```

### Update Attendance
**PUT** `/admin/attendance/:attendanceId`

**Request Body:**
```json
{
  "status": "present",
  "remarks": "Updated"
}
```

### Delete Attendance
**DELETE** `/admin/attendance/:attendanceId`

### Bulk Delete Attendance
**DELETE** `/admin/attendance/bulk`

**Request Body:**
```json
{
  "attendanceIds": ["attendance-1", "attendance-2"]
}
```

### Get Attendance Statistics
**GET** `/admin/attendance/statistics`

**Query Parameters:**
- `classId` (optional)
- `sectionId` (optional)
- `studentId` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "totalDays": 100,
  "present": 95,
  "absent": 5,
  "late": 2,
  "excused": 3,
  "percentage": 95.0,
  "bySubject": [
    {
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "totalDays": 50,
      "present": 48,
      "absent": 2,
      "percentage": 96.0
    }
  ]
}
```

---

## Timetable

### Get Timetable Slots
**GET** `/admin/timetable`

**Query Parameters:**
- `classId` (optional): Filter by class
- `sectionId` (optional): Filter by section
- `subjectId` (optional): Filter by subject
- `teacherId` (optional): Filter by teacher
- `dayOfWeek` (optional): Filter by day (`monday`, `tuesday`, etc.)
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "slot-1",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "dayOfWeek": "monday",
      "startTime": "08:00",
      "endTime": "09:00",
      "roomNumber": "101",
      "period": 1,
      "academicYear": "2024-2025",
      "semester": "Fall",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 10,
  "totalPages": 20
}
```

### Create Timetable Slot
**POST** `/admin/timetable`

**Request Body:**
```json
{
  "classId": "class-1",
  "sectionId": "section-1",
  "subjectId": "subject-1",
  "teacherId": "teacher-1",
  "dayOfWeek": "monday",
  "startTime": "08:00",
  "endTime": "09:00",
  "roomNumber": "101",
  "period": 1,
  "academicYear": "2024-2025",
  "semester": "Fall"
}
```

### Update Timetable Slot
**PUT** `/admin/timetable/:slotId`

### Delete Timetable Slot
**DELETE** `/admin/timetable/:slotId`

### Bulk Delete Timetable Slots
**DELETE** `/admin/timetable/bulk`

**Request Body:**
```json
{
  "slotIds": ["slot-1", "slot-2"]
}
```

### Get Class Timetable
**GET** `/admin/timetable/class/:classId`

### Get Section Timetable
**GET** `/admin/timetable/section/:sectionId`

### Get Teacher Timetable
**GET** `/admin/timetable/teacher/:teacherId`

---

## Exams

### Get Exams List
**GET** `/admin/exams`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)
- `classId` (optional)
- `subjectId` (optional)
- `examType` (optional): `unit_test`, `midterm`, `final`, `quiz`
- `status` (optional): `draft`, `scheduled`, `ongoing`, `completed`
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "exam-1",
      "examId": "EXM-001",
      "name": "Midterm Exam - Mathematics",
      "description": "Midterm examination for Mathematics",
      "examType": "midterm",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "academicYear": "2024-2025",
      "semester": "First",
      "examDate": "2024-03-15",
      "startTime": "09:00",
      "endTime": "12:00",
      "duration": 180,
      "maxMarks": 100,
      "passingMarks": 40,
      "status": "scheduled",
      "hallTicketsGenerated": false,
      "resultsPublished": false,
      "venue": "Hall A",
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Get Exam Details
**GET** `/admin/exams/:examId`

### Create Exam
**POST** `/admin/exams`

**Request Body:**
```json
{
  "name": "Midterm Exam - Mathematics",
  "description": "Midterm examination for Mathematics",
  "examType": "midterm",
  "classId": "class-1",
  "subjectId": "subject-1",
  "academicYear": "2024-2025",
  "semester": "First",
  "examDate": "2024-03-15",
  "startTime": "09:00",
  "endTime": "12:00",
  "duration": 180,
  "maxMarks": 100,
  "passingMarks": 40,
  "venue": "Hall A"
}
```

### Update Exam
**PUT** `/admin/exams/:examId`

### Delete Exam
**DELETE** `/admin/exams/:examId`

### Generate Hall Tickets
**POST** `/admin/exams/:examId/hall-tickets/generate`

### Get Hall Tickets
**GET** `/admin/exams/:examId/hall-tickets`

### Get Exam Results
**GET** `/admin/exams/:examId/results`

**Response:**
```json
{
  "data": [
    {
      "id": "result-1",
      "examId": "exam-1",
      "examName": "Midterm Exam - Mathematics",
      "studentId": "student-1",
      "studentName": "John Doe",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "marksObtained": 85,
      "maxMarks": 100,
      "percentage": 85,
      "grade": "A",
      "rank": 5,
      "percentile": 90,
      "examDate": "2024-03-15",
      "publishedAt": "2024-03-20T10:00:00Z",
      "createdAt": "2024-03-20T10:00:00Z",
      "updatedAt": "2024-03-20T10:00:00Z"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Create Exam Result
**POST** `/admin/exams/:examId/results`

**Request Body:**
```json
{
  "studentId": "student-1",
  "marksObtained": 85
}
```

### Update Exam Result
**PUT** `/admin/exams/:examId/results/:resultId`

**Request Body:**
```json
{
  "marksObtained": 88
}
```

### Publish Exam Results
**POST** `/admin/exams/:examId/results/publish`

---

## Fees

### Get Fee Structures
**GET** `/admin/fees/structures`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `academicYear` (optional)
- `gradeLevel` (optional)
- `isActive` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "fee-structure-1",
      "name": "Grade 1-5 Fee Structure 2024-25",
      "description": "Standard fee structure for primary grades",
      "academicYear": "2024-2025",
      "gradeLevels": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"],
      "feeItems": [
        {
          "id": "item-1",
          "feeType": "tuition",
          "name": "Tuition Fee",
          "amount": 50000,
          "dueDate": "2024-04-01",
          "isOptional": false
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Create Fee Structure
**POST** `/admin/fees/structures`

**Request Body:**
```json
{
  "name": "Grade 1-5 Fee Structure 2024-25",
  "description": "Standard fee structure for primary grades",
  "academicYear": "2024-2025",
  "gradeLevels": ["Grade 1", "Grade 2"],
  "feeItems": [
    {
      "feeType": "tuition",
      "name": "Tuition Fee",
      "amount": 50000,
      "dueDate": "2024-04-01",
      "isOptional": false
    }
  ]
}
```

### Update Fee Structure
**PUT** `/admin/fees/structures/:structureId`

### Delete Fee Structure
**DELETE** `/admin/fees/structures/:structureId`

### Get Student Fees
**GET** `/admin/fees/students`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `studentId` (optional)
- `classId` (optional)
- `status` (optional): `pending`, `partial`, `paid`, `overdue`
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "student-fee-1",
      "studentId": "student-1",
      "studentName": "John Doe",
      "feeStructureId": "fee-structure-1",
      "feeStructureName": "Grade 9 Fee Structure",
      "academicYear": "2024-2025",
      "totalAmount": 55000,
      "paidAmount": 30000,
      "dueAmount": 25000,
      "status": "partial",
      "dueDate": "2024-04-01",
      "payments": [],
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 10,
  "totalPages": 125
}
```

### Assign Fee to Student
**POST** `/admin/fees/students/assign`

**Request Body:**
```json
{
  "studentId": "student-1",
  "feeStructureId": "fee-structure-1",
  "academicYear": "2024-2025"
}
```

### Get Payments
**GET** `/admin/fees/payments`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `studentId` (optional)
- `paymentMethod` (optional): `cash`, `cheque`, `online`, `bank_transfer`
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "payment-1",
      "studentFeeId": "student-fee-1",
      "amount": 30000,
      "paymentMethod": "online",
      "paymentDate": "2024-04-15",
      "transactionId": "TXN123456",
      "receiptNumber": "RCP001",
      "remarks": "First installment",
      "createdBy": "admin-1",
      "createdAt": "2024-04-15T10:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 10,
  "totalPages": 50
}
```

### Record Payment
**POST** `/admin/fees/payments`

**Request Body:**
```json
{
  "studentFeeId": "student-fee-1",
  "amount": 30000,
  "paymentMethod": "online",
  "paymentDate": "2024-04-15",
  "transactionId": "TXN123456",
  "remarks": "First installment"
}
```

### Get Payment Receipt
**GET** `/admin/fees/payments/:paymentId/receipt`

---

## Grades

### Get Grades
**GET** `/admin/grades`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `studentId` (optional)
- `classId` (optional)
- `subjectId` (optional)
- `gradeType` (optional): `exam`, `assignment`, `quiz`, `project`
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "grade-1",
      "studentId": "student-1",
      "studentName": "John Doe",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "gradeType": "exam",
      "title": "Midterm Exam",
      "description": "Algebra and Geometry",
      "maxScore": 100,
      "obtainedScore": 85,
      "percentage": 85,
      "letterGrade": "B",
      "date": "2024-09-15",
      "dueDate": "2024-09-15",
      "gradedBy": "teacher-1",
      "gradedByName": "Sarah Johnson",
      "remarks": "Good performance",
      "createdAt": "2024-09-15T10:00:00Z",
      "updatedAt": "2024-09-15T10:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 10,
  "totalPages": 50
}
```

### Create Grade
**POST** `/admin/grades`

**Request Body:**
```json
{
  "studentId": "student-1",
  "classId": "class-1",
  "subjectId": "subject-1",
  "gradeType": "exam",
  "title": "Midterm Exam",
  "description": "Algebra and Geometry",
  "maxScore": 100,
  "obtainedScore": 85,
  "date": "2024-09-15",
  "remarks": "Good performance"
}
```

### Update Grade
**PUT** `/admin/grades/:gradeId`

### Delete Grade
**DELETE** `/admin/grades/:gradeId`

---

## Admissions

### Get Enquiries
**GET** `/admin/admissions/enquiries`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)
- `status` (optional): `new`, `follow-up`, `converted`, `dropped`
- `source` (optional): `walk-in`, `online`, `referral`, `phone`, `other`

**Response:**
```json
{
  "data": [
    {
      "id": "enquiry-1",
      "enquiryNumber": "ENQ001",
      "source": "walk-in",
      "parentName": "Jane Doe",
      "parentEmail": "jane.doe@email.com",
      "parentPhone": "+91-98765-43210",
      "studentName": "John Doe",
      "preferredClass": "Grade 9",
      "preferredAcademicYear": "2024-2025",
      "followUpDate": "2024-09-20",
      "notes": "Interested in admission",
      "status": "new",
      "assignedTo": "admin-1",
      "createdAt": "2024-09-10T00:00:00Z",
      "updatedAt": "2024-09-10T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Create Enquiry
**POST** `/admin/admissions/enquiries`

**Request Body:**
```json
{
  "source": "walk-in",
  "parentName": "Jane Doe",
  "parentEmail": "jane.doe@email.com",
  "parentPhone": "+91-98765-43210",
  "studentName": "John Doe",
  "preferredClass": "Grade 9",
  "preferredAcademicYear": "2024-2025",
  "followUpDate": "2024-09-20",
  "notes": "Interested in admission"
}
```

### Update Enquiry
**PUT** `/admin/admissions/enquiries/:enquiryId`

### Delete Enquiry
**DELETE** `/admin/admissions/enquiries/:enquiryId`

### Convert Enquiry to Application
**POST** `/admin/admissions/enquiries/:enquiryId/convert`

### Get Applications
**GET** `/admin/admissions/applications`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)
- `status` (optional): `draft`, `submitted`, `under-review`, `approved`, `rejected`, `waitlisted`, `enrolled`
- `academicYear` (optional)
- `classApplied` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "application-1",
      "applicationNumber": "APP001",
      "academicYear": "2024-2025",
      "classApplied": "Grade 9",
      "sectionApplied": "A",
      "board": "CBSE",
      "medium": "English",
      "status": "submitted",
      "studentFirstName": "John",
      "studentLastName": "Doe",
      "dateOfBirth": "2010-05-15",
      "gender": "male",
      "parentName": "Jane Doe",
      "parentEmail": "jane.doe@email.com",
      "parentPhone": "+91-98765-43210",
      "submittedAt": "2024-09-15T10:00:00Z",
      "createdAt": "2024-09-10T00:00:00Z",
      "updatedAt": "2024-09-15T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Get Application Details
**GET** `/admin/admissions/applications/:applicationId`

### Create Application
**POST** `/admin/admissions/applications`

**Request Body:** (Comprehensive application data)

### Update Application
**PUT** `/admin/admissions/applications/:applicationId`

### Submit Application
**POST** `/admin/admissions/applications/:applicationId/submit`

### Review Application
**POST** `/admin/admissions/applications/:applicationId/review`

**Request Body:**
```json
{
  "action": "approve", // or "reject", "waitlist"
  "remarks": "Application approved"
}
```

### Get Application Documents
**GET** `/admin/admissions/applications/:applicationId/documents`

### Upload Application Document
**POST** `/admin/admissions/applications/:applicationId/documents`

### Verify Application Document
**PUT** `/admin/admissions/applications/:applicationId/documents/:documentId/verify`

**Request Body:**
```json
{
  "status": "verified", // or "rejected"
  "remarks": "Document verified"
}
```

### Get Seat Capacity
**GET** `/admin/admissions/seat-capacity`

**Query Parameters:**
- `academicYear` (optional)
- `classId` (optional)

**Response:**
```json
{
  "data": [
    {
      "classId": "class-1",
      "className": "Grade 9",
      "totalSeats": 100,
      "occupiedSeats": 80,
      "availableSeats": 20,
      "reservedSeats": 5,
      "academicYear": "2024-2025"
    }
  ]
}
```

### Update Seat Capacity
**PUT** `/admin/admissions/seat-capacity`

**Request Body:**
```json
{
  "classId": "class-1",
  "totalSeats": 100,
  "reservedSeats": 5,
  "academicYear": "2024-2025"
}
```

### Enroll Student
**POST** `/admin/admissions/applications/:applicationId/enroll`

---

## Communication

### Get Notices/Announcements
**GET** `/admin/communication/notices`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `type` (optional): `notice`, `announcement`, `circular`
- `target` (optional): `all`, `students`, `teachers`, `parents`
- `status` (optional): `draft`, `published`, `archived`

**Response:**
```json
{
  "data": [
    {
      "id": "notice-1",
      "title": "Parent-Teacher Meeting",
      "content": "PTM scheduled for next week",
      "type": "notice",
      "target": "parents",
      "priority": "high",
      "publishedAt": "2024-09-15T10:00:00Z",
      "expiresAt": "2024-09-30T23:59:59Z",
      "status": "published",
      "createdBy": "admin-1",
      "createdAt": "2024-09-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Create Notice
**POST** `/admin/communication/notices`

**Request Body:**
```json
{
  "title": "Parent-Teacher Meeting",
  "content": "PTM scheduled for next week",
  "type": "notice",
  "target": "parents",
  "priority": "high",
  "expiresAt": "2024-09-30T23:59:59Z",
  "attachments": []
}
```

### Update Notice
**PUT** `/admin/communication/notices/:noticeId`

### Delete Notice
**DELETE** `/admin/communication/notices/:noticeId`

### Publish Notice
**POST** `/admin/communication/notices/:noticeId/publish`

### Send SMS
**POST** `/admin/communication/sms`

**Request Body:**
```json
{
  "recipients": ["+91-98765-43210", "+91-98765-43211"],
  "message": "Your message here",
  "templateId": "template-1" // optional
}
```

### Send Email
**POST** `/admin/communication/email`

**Request Body:**
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Subject here",
  "body": "Email body",
  "templateId": "template-1" // optional
}
```

---

## Reports

### Generate Report
**POST** `/admin/reports/generate`

**Request Body:**
```json
{
  "reportType": "attendance", // attendance, exam, fee, student, etc.
  "format": "pdf", // pdf, excel, csv
  "parameters": {
    "classId": "class-1",
    "startDate": "2024-09-01",
    "endDate": "2024-09-30"
  }
}
```

**Response:**
```json
{
  "reportId": "report-123",
  "status": "processing",
  "downloadUrl": null
}
```

### Get Report Status
**GET** `/admin/reports/:reportId`

**Response:**
```json
{
  "reportId": "report-123",
  "status": "completed",
  "downloadUrl": "https://...",
  "createdAt": "2024-09-15T10:00:00Z",
  "completedAt": "2024-09-15T10:05:00Z"
}
```

### Download Report
**GET** `/admin/reports/:reportId/download`

---

## Settings

### Get Settings
**GET** `/admin/settings`

**Response:**
```json
{
  "academicYear": "2024-2025",
  "schoolName": "Greenwood High School",
  "timezone": "Asia/Kolkata",
  "dateFormat": "DD/MM/YYYY",
  "currency": "INR",
  "language": "en",
  "attendanceSettings": {
    "markingWindow": 30,
    "autoLockDays": 7
  },
  "feeSettings": {
    "lateFeePercentage": 5,
    "gracePeriodDays": 7
  }
}
```

### Update Settings
**PUT** `/admin/settings`

**Request Body:**
```json
{
  "academicYear": "2024-2025",
  "timezone": "Asia/Kolkata",
  "dateFormat": "DD/MM/YYYY",
  "currency": "INR",
  "language": "en"
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### Pagination Response
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

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## Notes

1. All dates should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
2. All monetary values should be in the smallest currency unit (e.g., paise for INR)
3. All file uploads should use multipart/form-data
4. Pagination defaults: page=1, limit=10
5. All endpoints require authentication unless specified otherwise
