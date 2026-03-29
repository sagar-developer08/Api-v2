# Admin Attendance — API requirements

Specification for backend APIs that power `/admin/attendance`. The UI has tabs: **overview** (charts for students/teachers/staff), **mark** (daily grid for a class/section), **reports** (`src/app/admin/attendance/page.tsx`). Data is **mock**; these endpoints replace it.

## 1. Scope and tenancy

- **Authenticated** users with attendance permission.
- Records scoped to **`schoolId`**, **`academicYearId`**, optional **branchId**.

**Suggested base:** `/api/v1/schools/{schoolId}/attendance` or `/api/admin/attendance`.

## 2. Status values

Align with UI cells: `present` | `absent` | `late` | `excused` | `none` (unmarked). Document mapping if backend uses integers.

## 3. Endpoints

### 3.1 Overview / analytics

- **GET** `.../attendance/summary`  
- **Query:** `from`, `to`, `cohort` (`students` | `teachers` | `staff`), optional `classId`  
- **Response:** time series or monthly rollups for charts (percent or headcount).

### 3.2 Calendar matrix (student cohort)

- **GET** `.../attendance/matrix`  
- **Query:** `classId`, `sectionId`, `from`, `to` (date range)  
- **Response:** `{ students: { id, name, rollNumber }[], dates: string[], cells: Record<studentId_date, Status> }` or row-major array.

### 3.3 Mark day (bulk save)

- **GET** `.../attendance/day?date=&classId=&sectionId=` — roster + current statuses  
- **PUT** `.../attendance/day` — body: `{ date, classId, sectionId, entries: { studentId, status }[] }`

Idempotent replace per section/day or PATCH per student — document choice.

### 3.4 Teacher / staff attendance (if product includes)

- **GET/PUT** `.../attendance/staff-day` — same pattern with `staffIds` or department filter.

### 3.5 Reports export

- **GET** `.../attendance/reports/monthly` — query month, class; returns table or triggers report job (see reports module).

## 4. Validation

- `date` must be a **school working day** unless override role.
- No future-dated bulk mark unless allowed.

## 5. Integration

- **Communication** module may consume “absent” events for parent notifications.
- Policy text may come from **school profile** (`policiesInfo.minAttendancePercentage`).

## 6. Errors

- **400** invalid date/class; **401**; **403**; **404** roster not found.

---

**Summary:** Read/write daily attendance per class-section, matrix views, aggregated summaries for dashboard charts, optional staff attendance parity.
