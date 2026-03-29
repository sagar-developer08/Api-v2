# Admin Exams — API requirements

Specification for backend APIs that power `/admin/exams`. The UI is organized as **tabs**: Setup (exam list), Subjects mapping, Timetable, Hall ticket, Marks entry, Grading, Results, Reports (`src/app/admin/exams/page.tsx` and `components/*`). Data is largely **mock/local**; these endpoints replace that layer.

## 1. Scope and tenancy

- **Authenticated** admin / academic roles.
- All entities scoped to **`schoolId`** and **`academicYearId`** where relevant.

**Suggested base:** `/api/v1/schools/{schoolId}/exams` with sub-resources (or `/api/admin/exams` with tenant from token).

## 2. Core resources

### 2.1 Exam (setup list)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `name` | string | e.g. Midterm, Final |
| `academicYearId` | string | |
| `startDate`, `endDate` | string (ISO date) | Session window |
| `status` | enum | `draft`, `published`, `completed` (align UI) |
| `applicableClassIds` | string[] | |

### 2.2 Subject mapping (per exam)

Links **exam** + **class** + **subject** + optional **maxMarks**, **passMarks**.

- **GET/PUT** `.../exams/{examId}/subject-mapping` — bulk replace or diff API.

### 2.3 Exam timetable (per exam)

Rows: **date**, **start**, **end**, **subjectId**, **classId**, **room**, **instructions**.

- **GET** `.../exams/{examId}/timetable`
- **PATCH** `.../exams/{examId}/timetable` (or CRUD on row ids)

*Note:* Class-level weekly timetable lives under the **Class timetable** module; exam timetable is **session-specific**.

### 2.4 Hall tickets

- **GET** `.../exams/{examId}/hall-tickets` — query `classId`, `sectionId`, `studentId`
- **GET** `.../exams/{examId}/hall-tickets/{studentId}.pdf` or printable HTML payload

### 2.5 Marks entry

- **GET** `.../exams/{examId}/marks?classId=&sectionId=&subjectId=` — grid of students + current marks
- **PATCH** `.../exams/{examId}/marks` — body: `{ entries: { studentId, subjectId, marksObtained, remarks? }[] }`

### 2.6 Grade scales

- **GET/POST/PATCH/DELETE** `.../grade-scales` — define bands (A+, A, …) per school or per exam board.

### 2.7 Results

- **POST** `.../exams/{examId}/results/publish` — freeze marks, compute grades
- **GET** `.../exams/{examId}/results?classId=&sectionId=` — report cards / summaries

### 2.8 Analytics (reports tab)

- **GET** `.../exams/{examId}/analytics` — distribution, subject-wise pass %, etc.

## 3. Cross-module dependencies

- **Students**, **classes**, **sections**, **subjects** modules supply IDs.
- Optional link to **attendance** for eligibility rules (product-specific).

## 4. Validation

- Marks within `[0, maxMarks]`; cannot edit after **published** unless role allows **reopen**.
- Overlapping exam sessions — warn or block.

## 5. Errors

- **400**, **401**, **403**, **404**, **409** (immutable published results).

---

**Summary:** Exam lifecycle from setup through marks, grading, results, and hall tickets — split endpoints per UI tab but one consistent `examId` namespace.
