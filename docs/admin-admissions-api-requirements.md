# Admin Admissions — API requirements

Specification for backend APIs that power `/admin/admissions`, `/admin/admissions/applications`, `/admin/admissions/create`, and `/admin/admissions/[id]`. The UI uses **`admissionService`** with **in-memory mock data** (`src/services/admissionService.ts`, `src/services/mockAdmissionList.ts`); these endpoints replace that layer.

Reference types: `src/types/admission.ts` (`AdmissionApplication`, `AdmissionQuery`, `AdmissionStats`, `CreateAdmissionPayload`, nested `StudentInfo`, `ParentInfo`, `AcademicInfo`, `DocumentInfo`, `AdmissionTimelineItem`).

## 1. Scope and tenancy

- **Authenticated** admin (admissions office).
- Applications belong to one **`schoolId`**.

**Suggested base:** `/api/v1/schools/{schoolId}/admissions` or `/api/admin/admissions`.

## 2. Domain model

### 2.1 Status

`AdmissionStatus`: `pending` | `approved` | `rejected` | `draft` (align with UI filters).

### 2.2 Application (`AdmissionApplication`)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `studentName` | string | Denormalized or computed |
| `source` | enum | `Website`, `Referral`, `Walk-in`, `Campaign` |
| `status` | AdmissionStatus | |
| `submissionDate` | string (ISO) | |
| `remarks` | string \| optional | |
| `student` | StudentInfo | firstName, lastName, dateOfBirth, gender, classApplied, previousSchool, address |
| `parent` | ParentInfo | fatherName, motherName, guardian*, phones, email, occupation |
| `academic` | AcademicInfo | previousGrade, previousPercentage, transferCertificate, notes |
| `documents` | DocumentInfo[] | id, name, type, sizeKb, uploadedAt |
| `timeline` | AdmissionTimelineItem[] | audit trail: status, title, by, at, note |

### 2.3 Stats (`AdmissionStats`)

| Field | Type |
|-------|------|
| `totalApplications`, `approved`, `rejected`, `pending`, `draft` | number |
| `monthlyTrend` | `{ month, count }[]` |
| `funnel` | `{ stage, count }[]` |

## 3. Endpoints

### 3.1 List applications

- **GET** `.../applications`  
- **Query:** `search`, `status`, `classApplied`, `dateFrom`, `dateTo`, `page`, `pageSize`  
- **Response:** `{ items: AdmissionApplication[], total, page, pageSize }`

### 3.2 Stats

- **GET** `.../applications/stats` → `AdmissionStats`

### 3.3 Get one

- **GET** `.../applications/{id}` → full `AdmissionApplication`  
- **404** if missing / wrong tenant.

### 3.4 Create

- **POST** `.../applications`  
- **Body:** `CreateAdmissionPayload`: student, parent, academic, documents (metadata or upload ids), source, optional status, remarks.  
- **201** with created application including `id` and `timeline` initial event.

### 3.5 Update / workflow

- **PATCH** `.../applications/{id}` — edit fields, change status.  
- **POST** `.../applications/{id}/timeline` — append timeline entry (optional if PATCH auto-appends).

### 3.6 Documents

- Upload: multipart on create/update, or **POST** `.../applications/{id}/documents` + **GET** download with signed URL.

## 4. Validation

- Required student + parent fields per create form.
- `classApplied` must reference a valid class offering for the admission season.
- Document type/size allowlist.

## 5. Errors

- **400** field validation; **401**; **403**; **404**; **409** if business rules conflict.

---

**Summary:** Full admissions lifecycle with list filters, stats, CRUD, timeline, and document handling — mirror `AdmissionApplication` and `CreateAdmissionPayload` in code.
