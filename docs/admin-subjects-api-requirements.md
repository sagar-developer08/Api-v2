# Admin Subjects — API requirements

Specification for backend APIs that power `/admin/subjects`. The UI uses **mock table rows**, metrics, and modals (code, name, type Core/Elective, classes served, teacher, periods/week, status); these endpoints replace that layer.

## 1. Scope and tenancy

- **Authenticated** admin.
- Subjects belong to **`schoolId`**; assignments link to **classes** and **teachers**.

**Suggested base:** `/api/v1/schools/{schoolId}/subjects` or `/api/admin/subjects`.

## 2. Domain model

### Subject row

| Field | Type | Notes |
|-------|------|--------|
| `id` or `code` | string | UI uses `code` e.g. SUB-MTH-07 |
| `name` | string | e.g. Mathematics |
| `type` | enum | `Core`, `Elective` |
| `classIds` | string[] | Assigned classes |
| `classesLabel` | string \| optional | Denormalized e.g. “G7, G8, G9” |
| `assignedTeacherId` | string \| null | |
| `assignedTeacherName` | string | Display |
| `periodsPerWeek` | number | |
| `status` | enum | `Active`, `Planned` |

## 3. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../subjects` | List: filters `status`, `type`, `classId`, `search`, pagination |
| GET | `.../subjects/{id}` | Detail |
| POST | `.../subjects` | Create |
| PATCH | `.../subjects/{id}` | Update |
| DELETE | `.../subjects/{id}` | If unused in timetable/exams |

### Optional metrics (charts on page)

- **GET** `.../subjects/metrics` — distribution by type, workload buckets, etc.

## 4. Validation

- Unique `code` per school.
- `periodsPerWeek` > 0.
- Teacher and class IDs valid for tenant.

## 5. Errors

- **400**, **401**, **403**, **404**, **409** if subject in use.

---

**Summary:** CRUD + list filters + optional metrics; supports many-to-many class assignment as IDs with denormalized labels for the UI.
