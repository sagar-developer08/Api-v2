# Admin Classes — API requirements

Specification for backend APIs that power `/admin/classes`. The UI calls **`fetchClasses`** from `src/services/classes.ts` against `GET /api/admin/classes` and maps into table rows; create/edit still **update local state** until POST/PATCH exist.

Reference type: `ClassApiItem` in `src/services/classes.ts`.

## 1. Scope and tenancy

- **Bearer** auth; tenant from token (current implementation) or explicit `schoolId`.

**Implemented:**

- `GET ${VIDHYA_API_BASE_URL}/api/admin/classes` → `{ success, data: ClassApiItem[] }`
- `GET ${VIDHYA_API_BASE_URL}/api/admin/classes/{id}` → `{ success, data: ClassApiItem }`

## 2. `ClassApiItem` (list/detail)

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | |
| `name` | string | e.g. Grade 7 |
| `homeroom` | string \| optional | UI column “homeroom” |
| `sectionCount` | number \| optional | Denormalized count |
| `studentCount` | number \| optional | Denormalized count |
| `classTeacherName` | string \| optional | Display |
| `status` | string | `Active`, `Draft`, etc. |

### Extended fields for create/edit modal (UI form)

| Field | Type | Notes |
|-------|------|--------|
| `displayOrder` | number \| optional | Sort order |
| `capacity` | number \| optional | Max students |

## 3. Endpoints (full CRUD)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/classes` | List (keep response shape) |
| GET | `/api/admin/classes/{id}` | Detail |
| POST | `/api/admin/classes` | Create |
| PATCH | `/api/admin/classes/{id}` | Update |
| DELETE | `/api/admin/classes/{id}` | Or archive if sections/students exist |

Optional query: `status`, `search`, `academicYearId`.

## 4. Validation

- Unique class **name** (or name + academic year) per school.
- Cannot delete if sections attached — **409** or soft-delete.

## 5. Errors

- **400**, **401**, **403**, **404**, **409** as above.

---

**Summary:** Extend existing GET list/detail with POST/PATCH/DELETE so modal save persists; align payload with `ClassApiItem` + form fields.
