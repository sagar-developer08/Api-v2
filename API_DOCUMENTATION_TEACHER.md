# Teacher App - API Documentation

## Overview
This document outlines all API endpoints required for the Teacher application. The Teacher app allows teachers to manage their classes, students, assignments, grades, attendance, and more.

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
4. [Students](#students)
5. [Assignments](#assignments)
6. [Grades](#grades)
7. [Attendance](#attendance)
8. [Timetable](#timetable)
9. [Exams](#exams)
10. [Content](#content)
11. [Communication](#communication)
12. [Leave](#leave)
13. [Settings](#settings)

---

## Dashboard

### Get Teacher Dashboard Statistics
**GET** `/teacher/dashboard/stats`

**Query Parameters:**
- `academicYear` (optional): Filter by academic year

**Response:**
```json
{
  "totalClasses": 3,
  "totalStudents": 90,
  "totalAssignments": 15,
  "pendingGradings": 5,
  "todayClasses": 2,
  "upcomingExams": 3,
  "attendanceToday": {
    "marked": 2,
    "pending": 1
  },
  "recentAnnouncements": 2
}
```

---

## Profile

### Get Teacher Profile
**GET** `/teacher/profile`

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
  "createdAt": "2020-04-01T00:00:00Z",
  "updatedAt": "2020-04-01T00:00:00Z"
}
```

### Update Teacher Profile
**PUT** `/teacher/profile`

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "phone": "+91-98765-43210",
  "address": "456 Oak St",
  "profilePhoto": "https://..."
}
```

### Get Teacher Qualifications
**GET** `/teacher/profile/qualifications`

### Add Teacher Qualification
**POST** `/teacher/profile/qualifications`

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
**DELETE** `/teacher/profile/qualifications/:qualificationId`

### Get Teacher Documents
**GET** `/teacher/profile/documents`

### Upload Teacher Document
**POST** `/teacher/profile/documents`

**Request:** Multipart form data
- `file`: File to upload
- `documentType`: Type of document
- `description`: Optional description

### Delete Teacher Document
**DELETE** `/teacher/profile/documents/:documentId`

---

## Classes

### Get My Classes
**GET** `/teacher/classes`

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
      "studentCount": 30,
      "maxStudents": 35,
      "subjects": [
        {
          "id": "subject-1",
          "name": "Mathematics",
          "code": "MATH",
          "periodsPerWeek": 6,
          "isClassTeacher": true
        }
      ],
      "roomNumber": "101",
      "createdAt": "2024-04-01T00:00:00Z",
      "updatedAt": "2024-04-01T00:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Get Class Details
**GET** `/teacher/classes/:classId`

**Response:**
```json
{
  "id": "class-1",
  "name": "Grade 9-A",
  "code": "G9A",
  "grade": "9",
  "section": "A",
  "academicYear": "2024-2025",
  "studentCount": 30,
  "maxStudents": 35,
  "subjects": [
    {
      "id": "subject-1",
      "name": "Mathematics",
      "code": "MATH",
      "periodsPerWeek": 6,
      "isClassTeacher": true
    }
  ],
  "roomNumber": "101",
  "students": [
    {
      "id": "student-1",
      "studentId": "ST001",
      "firstName": "John",
      "lastName": "Doe",
      "rollNumber": "1",
      "profilePhoto": "https://..."
    }
  ],
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-01T00:00:00Z"
}
```

### Get Class Students
**GET** `/teacher/classes/:classId/students`

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
      "studentId": "ST001",
      "firstName": "John",
      "lastName": "Doe",
      "rollNumber": "1",
      "email": "john.doe@school.com",
      "phone": "+91-98765-43210",
      "profilePhoto": "https://...",
      "attendancePercentage": 95.0,
      "averageGrade": 85.5
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

## Students

### Get My Students
**GET** `/teacher/students`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by name, student ID
- `classId` (optional): Filter by class
- `sectionId` (optional): Filter by section

**Response:**
```json
{
  "data": [
    {
      "id": "student-1",
      "studentId": "ST001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@school.com",
      "phone": "+91-98765-43210",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "rollNumber": "1",
      "profilePhoto": "https://...",
      "attendancePercentage": 95.0,
      "averageGrade": 85.5
    }
  ],
  "total": 90,
  "page": 1,
  "limit": 10,
  "totalPages": 9
}
```

### Get Student Details
**GET** `/teacher/students/:studentId`

**Response:**
```json
{
  "id": "student-1",
  "studentId": "ST001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "phone": "+91-98765-43210",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "classId": "class-1",
  "className": "Grade 9-A",
  "sectionId": "section-1",
  "sectionName": "A",
  "rollNumber": "1",
  "profilePhoto": "https://...",
  "parentName": "Jane Doe",
  "parentEmail": "jane.doe@email.com",
  "parentPhone": "+91-98765-43211",
  "attendancePercentage": 95.0,
  "averageGrade": 85.5
}
```

### Get Student Attendance
**GET** `/teacher/students/:studentId/attendance`

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

### Get Student Grades
**GET** `/teacher/students/:studentId/grades`

**Query Parameters:**
- `subjectId` (optional): Filter by subject
- `gradeType` (optional): Filter by grade type

**Response:**
```json
{
  "data": [
    {
      "id": "grade-1",
      "gradeType": "exam",
      "title": "Midterm Exam",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "maxScore": 100,
      "obtainedScore": 85,
      "percentage": 85,
      "letterGrade": "B",
      "date": "2024-09-15",
      "remarks": "Good performance"
    }
  ],
  "summary": {
    "averageScore": 85.5,
    "overallGrade": "B",
    "totalGrades": 10
  }
}
```

---

## Assignments

### Get My Assignments
**GET** `/teacher/assignments`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by title
- `classId` (optional): Filter by class
- `subjectId` (optional): Filter by subject
- `status` (optional): Filter by status (`draft`, `published`, `closed`)

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
      "dueDate": "2024-09-20T23:59:59Z",
      "maxScore": 100,
      "status": "published",
      "submissionCount": 25,
      "totalStudents": 30,
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
**GET** `/teacher/assignments/:assignmentId`

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
  "dueDate": "2024-09-20T23:59:59Z",
  "maxScore": 100,
  "status": "published",
  "attachments": [],
  "submissions": [
    {
      "id": "submission-1",
      "studentId": "student-1",
      "studentName": "John Doe",
      "submittedAt": "2024-09-18T10:00:00Z",
      "status": "submitted",
      "score": null,
      "gradedAt": null
    }
  ],
  "createdAt": "2024-09-10T00:00:00Z",
  "updatedAt": "2024-09-10T00:00:00Z"
}
```

### Create Assignment
**POST** `/teacher/assignments`

**Request Body:**
```json
{
  "title": "Algebra Practice Problems",
  "description": "Complete exercises 1-20 from chapter 3",
  "classId": "class-1",
  "subjectId": "subject-1",
  "dueDate": "2024-09-20T23:59:59Z",
  "maxScore": 100,
  "attachments": []
}
```

### Update Assignment
**PUT** `/teacher/assignments/:assignmentId`

**Request Body:** (Same as Create, all fields optional)

### Delete Assignment
**DELETE** `/teacher/assignments/:assignmentId`

### Publish Assignment
**POST** `/teacher/assignments/:assignmentId/publish`

### Close Assignment
**POST** `/teacher/assignments/:assignmentId/close`

### Get Assignment Submissions
**GET** `/teacher/assignments/:assignmentId/submissions`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `status` (optional): `submitted`, `graded`, `late`

**Response:**
```json
{
  "data": [
    {
      "id": "submission-1",
      "studentId": "student-1",
      "studentName": "John Doe",
      "submissionText": "Completed all exercises",
      "attachments": [],
      "submittedAt": "2024-09-18T10:00:00Z",
      "status": "submitted",
      "score": null,
      "gradedAt": null,
      "remarks": null
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Get Submission Details
**GET** `/teacher/assignments/:assignmentId/submissions/:submissionId`

**Response:**
```json
{
  "id": "submission-1",
  "assignmentId": "assignment-1",
  "studentId": "student-1",
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
  "remarks": null
}
```

### Grade Submission
**PUT** `/teacher/assignments/:assignmentId/submissions/:submissionId/grade`

**Request Body:**
```json
{
  "score": 85,
  "remarks": "Good work, but needs improvement in problem 15"
}
```

---

## Grades

### Get My Grades
**GET** `/teacher/grades`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by student name, title
- `classId` (optional): Filter by class
- `subjectId` (optional): Filter by subject
- `gradeType` (optional): Filter by grade type (`exam`, `assignment`, `quiz`, `project`)
- `studentId` (optional): Filter by student

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
      "remarks": "Good performance",
      "createdAt": "2024-09-15T10:00:00Z",
      "updatedAt": "2024-09-15T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### Create Grade
**POST** `/teacher/grades`

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
**PUT** `/teacher/grades/:gradeId`

**Request Body:**
```json
{
  "obtainedScore": 88,
  "remarks": "Updated remarks"
}
```

### Delete Grade
**DELETE** `/teacher/grades/:gradeId`

### Bulk Create Grades
**POST** `/teacher/grades/bulk`

**Request Body:**
```json
{
  "classId": "class-1",
  "subjectId": "subject-1",
  "gradeType": "exam",
  "title": "Midterm Exam",
  "maxScore": 100,
  "date": "2024-09-15",
  "grades": [
    {
      "studentId": "student-1",
      "obtainedScore": 85,
      "remarks": "Good"
    },
    {
      "studentId": "student-2",
      "obtainedScore": 92,
      "remarks": "Excellent"
    }
  ]
}
```

---

## Attendance

### Get My Attendance Records
**GET** `/teacher/attendance`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `date` (optional): Specific date (YYYY-MM-DD)
- `startDate` (optional): Start date range
- `endDate` (optional): End date range
- `classId` (optional): Filter by class
- `sectionId` (optional): Filter by section
- `subjectId` (optional): Filter by subject
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
      "createdAt": "2024-09-15T08:00:00Z",
      "updatedAt": "2024-09-15T08:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 10,
  "totalPages": 50
}
```

### Mark Attendance (Bulk)
**POST** `/teacher/attendance/bulk`

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
**PUT** `/teacher/attendance/:attendanceId`

**Request Body:**
```json
{
  "status": "present",
  "remarks": "Updated"
}
```

### Delete Attendance
**DELETE** `/teacher/attendance/:attendanceId`

### Get Attendance Statistics
**GET** `/teacher/attendance/statistics`

**Query Parameters:**
- `classId` (optional)
- `sectionId` (optional)
- `subjectId` (optional)
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

### Get Class Attendance for Date
**GET** `/teacher/attendance/class/:classId/date/:date`

**Query Parameters:**
- `subjectId` (optional): Filter by subject

**Response:**
```json
{
  "date": "2024-09-15",
  "classId": "class-1",
  "className": "Grade 9-A",
  "subjectId": "subject-1",
  "subjectName": "Mathematics",
  "attendances": [
    {
      "id": "attendance-1",
      "studentId": "student-1",
      "studentName": "John Doe",
      "rollNumber": "1",
      "status": "present",
      "remarks": ""
    }
  ],
  "summary": {
    "total": 30,
    "present": 28,
    "absent": 2,
    "percentage": 93.33
  }
}
```

---

## Timetable

### Get My Timetable
**GET** `/teacher/timetable`

**Query Parameters:**
- `academicYear` (optional)
- `dayOfWeek` (optional): Filter by day (`monday`, `tuesday`, etc.)

**Response:**
```json
{
  "teacherId": "teacher-123",
  "academicYear": "2024-2025",
  "periods": [
    {
      "id": "slot-1",
      "dayOfWeek": "monday",
      "period": 1,
      "startTime": "08:00",
      "endTime": "09:00",
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "roomNumber": "101"
    }
  ],
  "totalPeriods": 30,
  "freePeriods": 5
}
```

### Get Timetable for Day
**GET** `/teacher/timetable/day/:dayOfWeek`

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
      "classId": "class-1",
      "className": "Grade 9-A",
      "sectionId": "section-1",
      "sectionName": "A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "roomNumber": "101"
    }
  ]
}
```

---

## Exams

### Get My Exams
**GET** `/teacher/exams`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional): Search by name
- `classId` (optional): Filter by class
- `subjectId` (optional): Filter by subject
- `examType` (optional): Filter by exam type
- `status` (optional): Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": "exam-1",
      "examId": "EXM-001",
      "name": "Unit Test 1 - Mathematics",
      "examType": "unit_test",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "academicYear": "2024-2025",
      "examDate": "2024-02-15",
      "startTime": "09:00",
      "endTime": "11:00",
      "duration": 120,
      "maxMarks": 50,
      "passingMarks": 20,
      "status": "completed",
      "hallTicketsGenerated": true,
      "resultsPublished": false,
      "venue": "Hall A",
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
**GET** `/teacher/exams/:examId`

### Get Exam Results
**GET** `/teacher/exams/:examId/results`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional): Search by student name

**Response:**
```json
{
  "data": [
    {
      "id": "result-1",
      "examId": "exam-1",
      "examName": "Unit Test 1 - Mathematics",
      "studentId": "student-1",
      "studentName": "John Doe",
      "classId": "class-1",
      "className": "Grade 9-A",
      "subjectId": "subject-1",
      "subjectName": "Mathematics",
      "marksObtained": 42,
      "maxMarks": 50,
      "percentage": 84,
      "grade": "A",
      "rank": 3,
      "percentile": 88,
      "examDate": "2024-02-15",
      "publishedAt": "2024-02-20T10:00:00Z",
      "createdAt": "2024-02-20T10:00:00Z",
      "updatedAt": "2024-02-20T10:00:00Z"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### Create Exam Result
**POST** `/teacher/exams/:examId/results`

**Request Body:**
```json
{
  "studentId": "student-1",
  "marksObtained": 42
}
```

### Update Exam Result
**PUT** `/teacher/exams/:examId/results/:resultId`

**Request Body:**
```json
{
  "marksObtained": 45
}
```

### Bulk Create Exam Results
**POST** `/teacher/exams/:examId/results/bulk`

**Request Body:**
```json
{
  "results": [
    {
      "studentId": "student-1",
      "marksObtained": 42
    },
    {
      "studentId": "student-2",
      "marksObtained": 48
    }
  ]
}
```

---

## Content

### Get Content Library
**GET** `/teacher/content`

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
      "createdBy": "teacher-123",
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
**GET** `/teacher/content/:contentId`

### Create Content
**POST** `/teacher/content`

**Request Body:**
```json
{
  "title": "Introduction to Algebra",
  "description": "Basic algebra concepts",
  "contentType": "video",
  "subjectId": "subject-1",
  "classId": "class-1",
  "url": "https://...",
  "thumbnail": "https://..."
}
```

### Update Content
**PUT** `/teacher/content/:contentId`

### Delete Content
**DELETE** `/teacher/content/:contentId`

---

## Communication

### Get Notices/Announcements
**GET** `/teacher/communication/notices`

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
      "target": "teachers",
      "priority": "high",
      "publishedAt": "2024-09-15T10:00:00Z",
      "expiresAt": "2024-09-30T23:59:59Z",
      "status": "published",
      "createdBy": "admin-1",
      "createdAt": "2024-09-15T10:00:00Z"
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### Get Notice Details
**GET** `/teacher/communication/notices/:noticeId`

### Send Message to Student
**POST** `/teacher/communication/messages`

**Request Body:**
```json
{
  "recipientId": "student-1",
  "recipientType": "student",
  "subject": "Assignment Reminder",
  "message": "Please submit your assignment by tomorrow",
  "priority": "normal"
}
```

### Get Messages
**GET** `/teacher/communication/messages`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `type` (optional): `sent`, `received`
- `status` (optional): `unread`, `read`

---

## Leave

### Get Leave Requests
**GET** `/teacher/leave/requests`

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `status` (optional): `pending`, `approved`, `rejected`
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "leave-1",
      "leaveType": "sick",
      "startDate": "2024-09-20",
      "endDate": "2024-09-22",
      "days": 3,
      "reason": "Medical emergency",
      "status": "pending",
      "appliedAt": "2024-09-18T10:00:00Z",
      "reviewedBy": null,
      "reviewedAt": null,
      "remarks": null
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Create Leave Request
**POST** `/teacher/leave/requests`

**Request Body:**
```json
{
  "leaveType": "sick",
  "startDate": "2024-09-20",
  "endDate": "2024-09-22",
  "reason": "Medical emergency",
  "attachments": []
}
```

### Update Leave Request
**PUT** `/teacher/leave/requests/:requestId`

### Cancel Leave Request
**DELETE** `/teacher/leave/requests/:requestId`

### Get Leave Balance
**GET** `/teacher/leave/balance`

**Response:**
```json
{
  "sick": {
    "total": 12,
    "used": 3,
    "remaining": 9
  },
  "casual": {
    "total": 10,
    "used": 2,
    "remaining": 8
  },
  "earned": {
    "total": 15,
    "used": 5,
    "remaining": 10
  }
}
```

---

## Settings

### Get Settings
**GET** `/teacher/settings`

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
**PUT** `/teacher/settings`

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
5. Teacher endpoints automatically filter data to only show classes/subjects assigned to the authenticated teacher

