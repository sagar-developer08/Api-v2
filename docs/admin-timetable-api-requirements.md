# Admin Class timetable — API requirements

Specification for backend APIs that power `/admin/timetable`. The UI manages **period definitions** (name, start, end, order) and a **weekly grid** per class selection (day × period → subject + teacher) (`src/app/admin/timetable/page.tsx` — local state).

## 1. Scope and tenancy

- **Authenticated** admin / academic roles.
- Timetables belong to **`schoolId`**, **`academicYearId`**, and a target **class** (and optionally **section** if section-specific).

**Suggested base:** `/api/v1/schools/{schoolId}/timetables` or nested under class.

## 2. Period template

School-wide or per academic year.

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `name` | string | e.g. Period 1 |
| `startTime` | string | `HH:mm` |
| `endTime` | string | `HH:mm` |
| `order` | number | Sort index |
| `type` | enum \| optional | `lesson`, `break`, `lunch` |

**Endpoints**

- **GET** `.../timetable-periods?academicYearId=`  
- **POST** / **PATCH** / **DELETE** `.../timetable-periods/{id}`

## 3. Weekly grid

Keyed by **classSection** (e.g. `classId` + `sectionId`) or composite id.

| Field | Type | Notes |
|-------|------|--------|
| `dayOfWeek` | enum | `Mon` … `Sun` (store 0–6 or ISO weekday consistently) |
| `periodId` | string | |
| `subjectId` | string \| null | |
| `teacherId` | string \| null | |
| `room` | string \| null | Optional |

**Endpoints**

- **GET** `.../class-timetables?classId=&sectionId=&academicYearId=`  
- **PUT** `.../class-timetables` — replace full grid or use **PATCH** per cell id

## 4. Validation

- Period times non-overlapping within same day template.
- Teacher double-booking — **409** or warning flag per product policy.
- Subject must be assigned to class (subjects module).

## 5. Relation to Exams tab timetable

- **Class timetable** = recurring weekly schedule.
- **Exam timetable** = date-based (see `admin-exams-api-requirements.md`); keep separate resources.

## 6. Errors

- **400**, **401**, **403**, **404**, **409** conflicts.

---

**Summary:** CRUD for period templates and per class-section weekly grids with subject/teacher assignment.
