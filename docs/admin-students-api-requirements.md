# Admin Students — API requirements

Specification for backend APIs that power `/admin/students/dashboard`, `/admin/students`, `/admin/students/create`, and `/admin/students/[id]`. The list view is partially wired to the backend via `src/services/students.ts`; detail and create flows may still use mock or partial integration.

Reference (list item shape): `StudentApiItem` in `src/services/students.ts`.

## 1. Scope and tenancy

- **Authenticated** admin (and other roles per RBAC).
- Tenant from **`schoolId`** in path or JWT.

**Current client list URL:** `GET ${VIDHYA_API_BASE_URL}/api/admin/students` with `Authorization: Bearer`.

**Suggested normalized paths (pick one style):**

- `GET /api/admin/students` (tenant from token), or  
- `GET /api/v1/schools/{schoolId}/students`

## 2. List row (`StudentApiItem` and extensions)

| Field | Type | Notes |
|-------|------|--------|
| `_id` | string | Primary id |
| `admissionNumber` | string | |
| `rollNumber` | string | |
| `fullName` | string | |
| `className` | string | Display |
| `sectionName` | string | Display |
| `gender` | string | `Male` \| `Female` \| `Other` |
| `academicYearLabel` | string \| optional | |
| `phone`, `email` | string \| optional | |
| `attendancePercent` | number \| optional | |
| `status` | string | e.g. active, inactive, transferred |
| `feeStatus` | string \| optional | |
| `pendingFeeAmount` | number \| optional | |
| `transportRequired` | boolean \| optional | |

## 3. List endpoint

- **GET** `.../students`

**Query:** `page`, `limit` (or `pageSize`), `search`, `classId`, `sectionId`, `status`, optional `academicYearId`, `branchId`.

**Response (current shape):**

```json
{
  "success": true,
  "data": {
    "items": [/* StudentApiItem */],
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## 4. Student detail

- **GET** `.../students/{studentId}`  
- Full profile: personal info, guardians, address, medical notes (if UI shows them), class/section history, documents metadata, fee snapshot links.

**404** if wrong tenant or missing id.

## 5. Create / update / delete

- **POST** `.../students` — body aligns with create wizard fields (multi-step form on `/admin/students/create`): personal, parent/guardian, academic placement, documents (multipart or staged upload + `documentIds`).
- **PATCH** `.../students/{studentId}` — partial updates.
- **DELETE** or **POST** `.../students/{studentId}/archive` — product choice for hard vs soft delete.

**Validation:** required names, DOB, gender, class/section for active enrollment; unique admission/roll numbers per school/year.

## 6. Student dashboard aggregates

`/admin/students/dashboard` may need:

- **GET** `.../students/metrics` or include in dashboard bundle: counts by class, new admissions, attendance highlight — same tenancy rules.

## 7. Print IDs / bulk (if enabled)

- **POST** `.../students/print-id-cards` with `studentIds[]` → job or PDF URL.

## 8. Errors

- **400** validation; **401**; **403**; **404**; **409** duplicate admission/roll.

---

**Summary:** Paginated, filterable list (already started in code), full CRUD + detail + optional metrics and print flows, all tenant-scoped.
