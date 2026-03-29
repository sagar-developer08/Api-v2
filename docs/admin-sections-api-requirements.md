# Admin Sections — API requirements

Specification for backend APIs that power `/admin/sections`. The UI uses **client-side mock rows** and modals; these endpoints replace that layer.

## 1. Scope and tenancy

- **Authenticated** admin.
- Sections belong to a **class** within **`schoolId`**.

**Suggested base:** `/api/v1/schools/{schoolId}/classes/{classId}/sections` or flat `/api/admin/sections?classId=`.

## 2. Domain model

### Section row (UI-aligned)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `sectionName` | string | e.g. A, B, C |
| `classId` | string | FK |
| `className` | string | Denormalized for table |
| `classTeacherId` | string \| null | FK to teacher/staff |
| `classTeacherName` | string | Display |
| `students` or `studentCount` | number | Denormalized |
| `room` | string \| null | Room / block label |
| `capacity` | number \| null | From modal |
| `status` | enum | `Active`, `Archived` |

## 3. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../sections` | Query: `classId`, `status`, `search`, `page`, `pageSize` |
| GET | `.../sections/{id}` | Detail |
| POST | `.../sections` | Body: classId, sectionName, capacity, classTeacherId, room, status |
| PATCH | `.../sections/{id}` | Partial update |
| DELETE | `.../sections/{id}` | If no students — or archive |

## 4. Validation

- Unique **section name per class** (e.g. only one “A” under Grade 7).
- `classTeacherId` must be teaching staff in same school.

## 5. Errors

- **400**, **401**, **403**, **404**, **409** duplicate section / students present.

---

**Summary:** CRUD for sections scoped to class, with counts and teacher assignment matching the admin sections table and modal.
