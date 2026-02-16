# Student App - API Documentation

## Overview
This document outlines all API endpoints required for the Student application. The Student app allows students to view their classes, assignments, grades, attendance, timetable, exams, fees, and more.

**Base URL**: `https://vidhyaapi.sagecrafts.in/api/v1`

**Authentication**: All endpoints require Bearer token authentication in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Table of Contents
1. [Dashboard](#dashboard)
2. [Profile](#profile)
3. [Classes](#classes)
4. [Subjects](#subjects)
5. [Assignments](#assignments)
6. [Grades](#grades)
7. [Attendance](#attendance)
8. [Timetable](#timetable)
9. [Exams](#exams)
10. [Fees](#fees)
11. [Documents](#documents)
12. [Content](#content)
13. [Communication](#communication)
14. [Settings](#settings)

---

## Dashboard

### Get Student Dashboard Statistics
**GET** `/student/dashboard/stats`

**Query Parameters:**
- `academicYear` (optional): Filter by academic year

**Response:**
```json
{
  "totalClasses": 1,
  "totalSubjects": 8,
  "totalAssignments": 15,
  "pendingAssignments": 3,
  "averageGrade": 85.5,
  "attendancePercentage": 95.0,
  "upcomingExams": 2,
  "pendingFees": {
    "count": 2,
    "amount": 25000
  },
  "recentAnnouncements": 3
}
```

---

## Profile

### Get Student Profile
**GET** `/student/profile`

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
  "admissionDate": "2024-04-01",
  "status": "active",
  "profilePhoto": "https://...",
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-01T00:00:00Z"
}
```

### Update Student Profile
**PUT** `/student/profile`

**Request Body:**
```json
{
  "phone": "+91-98765-43210",
  "address": "123 Main St",
  "profilePhoto": "https://..."
}
```

---

## Classes

### Get My Classes
**GET** `/student/classes`

**Query Parameters:**
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
      "subjects": [
        {
          "id": "subject-1",
          "name": "Mathematics",
          "code": "MATH",
          "teacherId": "teacher-1",
          "teacherName": "Sarah Johnson"
        }
      ],
      "roomNumber": "101",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Class Details
**GET** `/student/classes/:classId`

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
  "roomNumber": "101",
  "classTeacher": {
    "id": "teacher-1",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@school.com",
    "phone": "+91-98765-43210",
    "profilePhoto": "https://...",
    "designation": "Class Teacher",
    "department": "Mathematics"
  },
  "students": [
    {
      "id": "student-1",
      "name": "John Doe",
      "rollNumber": "1",
      "admissionNumber": "ADM001",
      "profilePhoto": "https://..."
    }
  ],
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-01T00:00:00Z"
}
```

### Get Class Students
**GET** `/student/classes/:classId/students`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "student-1",
      "name": "John Doe",
      "rollNumber": "1",
      "admissionNumber": "ADM001",
      "profilePhoto": "https://...",
      "email": "john.doe@school.com",
      "phone": "+91-98765-43210"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Get Class Teacher
**GET** `/student/classes/:classId/teacher`

**Response:**
```json
{
  "id": "teacher-1",
  "name": "Sarah Johnson",
  "email": "sarah.johnson@school.com",
  "phone": "+91-98765-43210",
  "profilePhoto": "https://...",
  "designation": "Class Teacher",
  "department": "Mathematics"
}
```

---

## Subjects

### Get My Subjects
**GET** `/student/subjects`

**Query Parameters:**
- `academicYear` (optional): Filter by academic year

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
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "credits": 4,
      "status": "active",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Subject Details
**GET** `/student/subjects/:subjectId`

**Response:**
```json
{
  "id": "subject-1",
  "name": "Mathematics",
  "code": "MATH",
  "description": "Algebra, Geometry, Calculus",
  "departmentId": "dept-1",
  "departmentName": "Mathematics",
  "teacherId": "teacher-1",
  "teacherName": "Sarah Johnson",
  "credits": 4,
  "status": "active",
  "teacher": {
    "id": "teacher-1",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@school.com",
    "phone": "+91-98765-43210",
    "profilePhoto": "https://...",
    "designation": "Senior Teacher",
    "department": "Mathematics"
  },
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-01T00:00:00Z"
}
```

---

## Assignments

### Get My Assignments
**GET** `/student/assignments`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by title
- `classId` (optional): Filter by class
- `subjectId` (optional): Filter by subject
- `status` (optional): Filter by status (`pending`, `submitted`, `graded`, `late`)

**Response:**
```json
{
  "data": [
    {
      "id": "assignment-1",
      "title": "Algebra Practice Problems",
      "description": "Complete exercises 1-20 from chapter 3",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "dueDate": "2024-09-20T23:59:59Z",
      "maxScore": 100,
      "status": "published",
      "mySubmission": {
        "id": "submission-1",
        "status": "submitted",
        "submittedAt": "2024-09-18T10:00:00Z",
        "score": null,
        "gradedAt": null
      },
      "createdAt": "2024-09-10T00:00:00Z",
      "updatedAt": "2024-09-10T00:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### Get Assignment Details
**GET** `/student/assignments/:assignmentId`

**Response:**
```json
{
  "id": "assignment-1",
  "title": "Algebra Practice Problems",
  "description": "Complete exercises 1-20 from chapter 3",
  "classId": "class-1",
  "className": "Grade 9-A",
  "subjectId": "subject-1",
  "subjectName": "Mathematics",
  "teacherId": "teacher-1",
  "teacherName": "Sarah Johnson",
  "dueDate": "2024-09-20T23:59:59Z",
  "maxScore": 100,
  "status": "published",
  "attachments": [
    {
      "id": "file-1",
      "fileName": "assignment.pdf",
      "fileUrl": "https://...",
      "fileSize": 1024000
    }
  ],
  "mySubmission": {
    "id": "submission-1",
    "submissionText": "Completed all exercises",
    "attachments": [],
    "submittedAt": "2024-09-18T10:00:00Z",
    "status": "submitted",
    "score": null,
    "gradedAt": null,
    "remarks": null
  },
  "createdAt": "2024-09-10T00:00:00Z",
  "updatedAt": "2024-09-10T00:00:00Z"
}
```

### Get My Submission
**GET** `/student/assignments/:assignmentId/submission`

**Response:**
```json
{
  "id": "submission-1",
  "assignmentId": "assignment-1",
  "studentId": "student-123",
  "studentName": "John Doe",
  "submissionText": "Completed all exercises",
  "attachments": [
    {
      "id": "file-1",
      "fileName": "assignment.pdf",
      "fileUrl": "https://...",
      "fileSize": 1024000
    }
  ],
  "submittedAt": "2024-09-18T10:00:00Z",
  "status": "submitted",
  "score": null,
  "gradedAt": null,
  "remarks": null,
  "createdAt": "2024-09-18T10:00:00Z",
  "updatedAt": "2024-09-18T10:00:00Z"
}
```

### Submit Assignment
**POST** `/student/assignments/:assignmentId/submit`

**Request Body:**
```json
{
  "submissionText": "Completed all exercises",
  "attachments": [
    {
      "fileName": "assignment.pdf",
      "fileUrl": "https://...",
      "fileSize": 1024000
    }
  ]
}
```

**Note:** For file uploads, use multipart/form-data with the file field.

### Update Submission
**PUT** `/student/assignments/:assignmentId/submission`

**Request Body:**
```json
{
  "submissionText": "Updated submission",
  "attachments": []
}
```

**Note:** Can only update if assignment is not yet graded and due date has not passed.

---

## Grades

### Get My Grades
**GET** `/student/grades`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by subject name, title
- `subjectId` (optional): Filter by subject
- `gradeType` (optional): Filter by grade type (`exam`, `assignment`, `quiz`, `project`)
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "grade-1",
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
      "gradedBy": "teacher-1",
      "gradedByName": "Sarah Johnson",
      "remarks": "Good performance",
      "createdAt": "2024-09-15T10:00:00Z",
      "updatedAt": "2024-09-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Get Grade Details
**GET** `/student/grades/:gradeId`

**Response:**
```json
{
  "id": "grade-1",
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
  "gradedBy": "teacher-1",
  "gradedByName": "Sarah Johnson",
  "remarks": "Good performance",
  "createdAt": "2024-09-15T10:00:00Z",
  "updatedAt": "2024-09-15T10:00:00Z"
}
```

### Get Grades Summary
**GET** `/student/grades/summary`

**Query Parameters:**
- `academicYear` (optional)
- `subjectId` (optional)

**Response:**
```json
{
  "overall": {
    "averageScore": 85.5,
    "overallGrade": "B",
    "totalGrades": 50,
    "rank": 5
  },
  "bySubject": [
    {
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "averageScore": 85.5,
      "grade": "B",
      "totalGrades": 10
    }
  ],
  "byGradeType": [
    {
      "gradeType": "exam",
      "averageScore": 88.0,
      "totalGrades": 15
    }
  ]
}
```

---

## Attendance

### Get My Attendance
**GET** `/student/attendance`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `subjectId` (optional): Filter by subject
- `status` (optional): Filter by status (`present`, `absent`, `late`, `excused`)

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
      "classId": "class-1",
      "className": "Grade 9-A",
      "remarks": "",
      "markedBy": "teacher-1",
      "markedByName": "Sarah Johnson",
      "createdAt": "2024-09-15T08:00:00Z",
      "updatedAt": "2024-09-15T08:00:00Z"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 10,
  "totalPages": 20,
  "summary": {
    "totalDays": 200,
    "present": 190,
    "absent": 10,
    "late": 3,
    "excused": 2,
    "percentage": 95.0
  }
}
```

### Get Attendance Summary
**GET** `/student/attendance/summary`

**Query Parameters:**
- `academicYear` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "overall": {
    "totalDays": 200,
    "present": 190,
    "absent": 10,
    "late": 3,
    "excused": 2,
    "percentage": 95.0
  },
  "bySubject": [
    {
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "totalDays": 50,
      "present": 48,
      "absent": 2,
      "percentage": 96.0
    }
  ],
  "byMonth": [
    {
      "month": "2024-09",
      "totalDays": 20,
      "present": 19,
      "absent": 1,
      "percentage": 95.0
    }
  ]
}
```

### Get Attendance Calendar
**GET** `/student/attendance/calendar`

**Query Parameters:**
- `month` (required): Month in YYYY-MM format
- `subjectId` (optional): Filter by subject

**Response:**
```json
{
  "month": "2024-09",
  "attendance": [
    {
      "date": "2024-09-01",
      "status": "present",
      "subjectId": "subject-1",
      "subjectName": "Mathematics"
    },
    {
      "date": "2024-09-02",
      "status": "absent",
      "subjectId": "subject-1",
      "subjectName": "Mathematics"
    }
  ],
  "summary": {
    "totalDays": 20,
    "present": 19,
    "absent": 1,
    "percentage": 95.0
  }
}
```

---

## Timetable

### Get My Timetable
**GET** `/student/timetable`

**Query Parameters:**
- `academicYear` (optional)
- `dayOfWeek` (optional): Filter by day (`monday`, `tuesday`, etc.)

**Response:**
```json
{
  "classId": "class-1",
  "className": "Grade 9-A",
  "academicYear": "2024-2025",
  "periods": [
    {
      "id": "slot-1",
      "dayOfWeek": "monday",
      "period": 1,
      "startTime": "08:00",
      "endTime": "09:00",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "roomNumber": "101"
    }
  ],
  "totalPeriods": 40
}
```

### Get Timetable for Day
**GET** `/student/timetable/day/:dayOfWeek`

**Response:**
```json
{
  "dayOfWeek": "monday",
  "periods": [
    {
      "id": "slot-1",
      "period": 1,
      "startTime": "08:00",
      "endTime": "09:00",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "teacherId": "teacher-1",
      "teacherName": "Sarah Johnson",
      "roomNumber": "101"
    }
  ]
}
```

---

## Exams

### Get My Exams
**GET** `/student/exams`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by name, subject
- `examType` (optional): Filter by exam type (`unit_test`, `midterm`, `final`, `quiz`)
- `status` (optional): Filter by status (`scheduled`, `ongoing`, `completed`)
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "exam-1",
      "examId": "EXM-001",
      "name": "Midterm Exam - Mathematics",
      "examType": "midterm",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "academicYear": "2024-2025",
      "examDate": "2026-03-15",
      "startTime": "09:00",
      "endTime": "12:00",
      "duration": 180,
      "maxMarks": 100,
      "passingMarks": 40,
      "status": "scheduled",
      "hallTicketsGenerated": true,
      "resultsPublished": false,
      "venue": "Hall A",
      "myResult": null,
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Exam Details
**GET** `/student/exams/:examId`

**Response:**
```json
{
  "id": "exam-1",
  "examId": "EXM-001",
  "name": "Midterm Exam - Mathematics",
  "examType": "midterm",
  "classId": "class-1",
  "className": "Grade 9-A",
  "subjectId": "subject-1",
  "subjectName": "Mathematics",
  "academicYear": "2024-2025",
  "examDate": "2026-03-15",
  "startTime": "09:00",
  "endTime": "12:00",
  "duration": 180,
  "maxMarks": 100,
  "passingMarks": 40,
  "status": "scheduled",
  "hallTicketsGenerated": true,
  "resultsPublished": false,
  "venue": "Hall A",
  "instructions": "Bring calculator and ID card",
  "myHallTicket": {
    "id": "ticket-1",
    "seatNumber": "A-15",
    "instructions": "Bring calculator and ID card. No mobile phones allowed."
  },
  "myResult": null,
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### Get My Exam Results
**GET** `/student/exams/results`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by exam name, subject
- `subjectId` (optional): Filter by subject
- `examType` (optional): Filter by exam type
- `academicYear` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "result-1",
      "examId": "exam-4",
      "examName": "Unit Test - English",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-4",
      "subjectName": "English",
      "marksObtained": 42,
      "maxMarks": 50,
      "percentage": 84,
      "grade": "A",
      "rank": 3,
      "percentile": 88,
      "examDate": "2026-01-15",
      "publishedAt": "2026-01-17T10:00:00Z",
      "createdAt": "2026-01-17T10:00:00Z",
      "updatedAt": "2026-01-17T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### Get Exam Result Details
**GET** `/student/exams/:examId/result`

**Response:**
```json
{
  "id": "result-1",
  "examId": "exam-4",
  "examName": "Unit Test - English",
  "classId": "class-1",
  "className": "Grade 9-A",
  "subjectId": "subject-4",
  "subjectName": "English",
  "marksObtained": 42,
  "maxMarks": 50,
  "percentage": 84,
  "grade": "A",
  "rank": 3,
  "percentile": 88,
  "examDate": "2026-01-15",
  "publishedAt": "2026-01-17T10:00:00Z",
  "createdAt": "2026-01-17T10:00:00Z",
  "updatedAt": "2026-01-17T10:00:00Z"
}
```

### Get Hall Ticket
**GET** `/student/exams/:examId/hall-ticket`

**Response:**
```json
{
  "id": "ticket-1",
  "examId": "exam-1",
  "examName": "Midterm Exam - Mathematics",
  "studentId": "student-123",
  "studentName": "John Doe",
  "examDate": "2026-03-15",
  "startTime": "09:00",
  "endTime": "12:00",
  "venue": "Hall A",
  "seatNumber": "A-15",
  "instructions": "Bring calculator and ID card. No mobile phones allowed.",
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

---

## Fees

### Get My Fees
**GET** `/student/fees`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `academicYear` (optional)
- `status` (optional): Filter by status (`pending`, `partial`, `paid`, `overdue`)

**Response:**
```json
{
  "data": [
    {
      "id": "student-fee-1",
      "feeStructureId": "fee-structure-1",
      "feeStructureName": "Grade 9 Fee Structure",
      "academicYear": "2024-2025",
      "totalAmount": 55000,
      "paidAmount": 30000,
      "dueAmount": 25000,
      "status": "partial",
      "dueDate": "2024-04-01",
      "payments": [
        {
          "id": "payment-1",
          "amount": 30000,
          "paymentMethod": "online",
          "paymentDate": "2024-04-15",
          "transactionId": "TXN123456",
          "receiptNumber": "RCP001"
        }
      ],
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "summary": {
    "totalDue": 25000,
    "totalPaid": 30000,
    "totalAmount": 55000
  }
}
```

### Get Fee Details
**GET** `/student/fees/:feeId`

**Response:**
```json
{
  "id": "student-fee-1",
  "feeStructureId": "fee-structure-1",
  "feeStructureName": "Grade 9 Fee Structure",
  "academicYear": "2024-2025",
  "totalAmount": 55000,
  "paidAmount": 30000,
  "dueAmount": 25000,
  "status": "partial",
  "dueDate": "2024-04-01",
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
  "payments": [
    {
      "id": "payment-1",
      "amount": 30000,
      "paymentMethod": "online",
      "paymentDate": "2024-04-15",
      "transactionId": "TXN123456",
      "receiptNumber": "RCP001",
      "remarks": "First installment"
    }
  ],
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### Get Payments
**GET** `/student/fees/payments`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
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
      "createdAt": "2024-04-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Payment Receipt
**GET** `/student/fees/payments/:paymentId/receipt`

**Response:** PDF file or JSON with receipt data

---

## Documents

### Get My Documents
**GET** `/student/documents`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `documentType` (optional): Filter by document type

**Response:**
```json
{
  "data": [
    {
      "id": "document-1",
      "documentType": "admission",
      "fileName": "admission_form.pdf",
      "fileUrl": "https://...",
      "fileSize": 1024000,
      "uploadedAt": "2024-04-01T00:00:00Z",
      "status": "verified",
      "verifiedBy": "admin-1",
      "verifiedAt": "2024-04-02T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Document Details
**GET** `/student/documents/:documentId`

### Upload Document
**POST** `/student/documents`

**Request:** Multipart form data
- `file`: File to upload
- `documentType`: Type of document
- `description`: Optional description

### Delete Document
**DELETE** `/student/documents/:documentId`

---

## Content

### Get Content Library
**GET** `/student/content`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional)
- `subjectId` (optional)
- `contentType` (optional): `video`, `document`, `link`, `quiz`
- `classId` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "content-1",
      "title": "Introduction to Algebra",
      "description": "Basic algebra concepts",
      "contentType": "video",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "classId": "class-1",
      "className": "Grade 9-A",
      "url": "https://...",
      "thumbnail": "https://...",
      "duration": 1200,
      "createdBy": "teacher-1",
      "createdByName": "Sarah Johnson",
      "createdAt": "2024-09-10T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Get Content Details
**GET** `/student/content/:contentId`

**Response:**
```json
{
  "id": "content-1",
  "title": "Introduction to Algebra",
  "description": "Basic algebra concepts",
  "contentType": "video",
  "subjectId": "subject-1",
  "subjectName": "Mathematics",
  "classId": "class-1",
  "className": "Grade 9-A",
  "url": "https://...",
  "thumbnail": "https://...",
  "duration": 1200,
  "createdBy": "teacher-1",
  "createdByName": "Sarah Johnson",
  "createdAt": "2024-09-10T00:00:00Z",
  "views": 150,
  "myProgress": {
    "watched": true,
    "progress": 100,
    "lastWatchedAt": "2024-09-12T10:00:00Z"
  }
}
```

### Track Content Progress
**POST** `/student/content/:contentId/progress`

**Request Body:**
```json
{
  "progress": 75,
  "completed": false
}
```

---

## Communication

### Get Notices/Announcements
**GET** `/student/communication/notices`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `type` (optional): `notice`, `announcement`, `circular`
- `status` (optional): `published`, `archived`

**Response:**
```json
{
  "data": [
    {
      "id": "notice-1",
      "title": "Parent-Teacher Meeting",
      "content": "PTM scheduled for next week",
      "type": "notice",
      "target": "students",
      "priority": "high",
      "publishedAt": "2024-09-15T10:00:00Z",
      "expiresAt": "2024-09-30T23:59:59Z",
      "status": "published",
      "createdBy": "admin-1",
      "createdAt": "2024-09-15T10:00:00Z",
      "isRead": false
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### Get Notice Details
**GET** `/student/communication/notices/:noticeId`

### Mark Notice as Read
**POST** `/student/communication/notices/:noticeId/read`

### Get Messages
**GET** `/student/communication/messages`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `type` (optional): `sent`, `received`
- `status` (optional): `unread`, `read`

**Response:**
```json
{
  "data": [
    {
      "id": "message-1",
      "senderId": "teacher-1",
      "senderName": "Sarah Johnson",
      "senderType": "teacher",
      "recipientId": "student-123",
      "recipientName": "John Doe",
      "recipientType": "student",
      "subject": "Assignment Reminder",
      "message": "Please submit your assignment by tomorrow",
      "priority": "normal",
      "status": "unread",
      "createdAt": "2024-09-18T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Message Details
**GET** `/student/communication/messages/:messageId`

### Send Message
**POST** `/student/communication/messages`

**Request Body:**
```json
{
  "recipientId": "teacher-1",
  "recipientType": "teacher",
  "subject": "Question about Assignment",
  "message": "I have a question about problem 15",
  "priority": "normal"
}
```

### Mark Message as Read
**POST** `/student/communication/messages/:messageId/read`

---

## Settings

### Get Settings
**GET** `/student/settings`

**Response:**
```json
{
  "notifications": {
    "email": true,
    "sms": false,
    "push": true
  },
  "preferences": {
    "language": "en",
    "timezone": "Asia/Kolkata",
    "dateFormat": "DD/MM/YYYY"
  }
}
```

### Update Settings
**PUT** `/student/settings`

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "sms": false,
    "push": true
  },
  "preferences": {
    "language": "en",
    "timezone": "Asia/Kolkata",
    "dateFormat": "DD/MM/YYYY"
  }
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
2. All file uploads should use multipart/form-data
3. Pagination defaults: page=1, limit=10
4. All endpoints require authentication unless specified otherwise
5. Student endpoints automatically filter data to only show data for the authenticated student
6. Students can only view their own data and cannot modify most records (except submissions, profile updates, etc.)

