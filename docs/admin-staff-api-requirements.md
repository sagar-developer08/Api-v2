# Admin Staff module — API requirements

Specification for backend APIs that power `/admin/staffs`, `/admin/staffs/create`, `/admin/staffs/[id]`, and `/admin/staffs/[id]/edit`. The UI currently uses client-side mock data (`staff.store`); these endpoints replace that layer.

Reference types: `src/types/staff.ts` (`StaffProfile`, `StaffListItem`, nested qualification / experience / document models).

---

## 1. Scope and tenancy

- All routes are **authenticated** and restricted to **school admin** (or equivalent) unless noted.
- Every staff record belongs to exactly one **school / tenant**. Resolve `schoolId` from the session/JWT or explicit path; reject cross-tenant access (`403` / `404` per policy).
- Optional **platform** routes for super-admin are out of scope unless you add a separate multi-school staff view.

**Suggested base paths (pick one style and use consistently):**

| Style | Example |
|--------|---------|
| Explicit tenant | `GET /api/v1/schools/{schoolId}/staff` |
| Session tenant (admin) | `GET /api/v1/admin/hr/staff` or `GET /api/v1/admin/staff` |

Mirror the pattern used elsewhere (e.g. notices: `/api/v1/schools/{schoolId}/…` vs `/api/v1/admin/communication/…`).

---

## 2. Domain model

### 2.1 Staff status and enums

**`status`** (lifecycle; align strings with UI):

- `Active` | `On Leave` | `Inactive` | `Resigned` | `Retired`

**`employeeType`:**

- `Teaching` | `Non-Teaching`

**`gender`:**

- `Male` | `Female` | `Other`

Backend may store **snake_case** or lowercase keys if preferred; document the mapping for the client (e.g. `on_leave` → `On Leave`).

### 2.2 Staff list row (`StaffListItem`)

Used by the data table and links to detail. Minimum fields:

| Field | Type | Notes |
|--------|------|--------|
| `id` | string | Primary key (UUID recommended); used in URLs |
| `staffId` | string | Human-readable code (unique per school); may equal `id` or a separate sequence |
| `photoUrl` | string \| null | Optional absolute or signed URL |
| `firstName`, `middleName`, `lastName` | string | `middleName` / `lastName` optional |
| `department` | string | Filterable |
| `designation` | string | Filterable |
| `mobile` | string | Normalized (e.g. 10-digit) for display/search |
| `email` | string | |
| `joiningDate` | string | ISO date (`YYYY-MM-DD`) or full ISO 8601 |
| `status` | enum | See §2.1 |
| `employeeType` | enum | See §2.1 |

### 2.3 Full staff profile (`StaffProfile`)

Superset of list fields. Additional / detailed fields (mirror `StaffProfile` in code):

**Identity & personal**

| Field | Type | Notes |
|--------|------|--------|
| `dateOfBirth` | string | ISO date |
| `bloodGroup` | string \| null | e.g. `A+` |
| `aadhaar` | string \| null | Store hashed/masked at rest; expose masked in list/detail if required by policy |
| `pan` | string \| null | |

**Contact & address**

| Field | Type |
|--------|------|
| `alternateMobile` | string \| null |
| `emergencyContactName`, `emergencyContactPhone` | string \| null |
| `addressLine1` | string |
| `addressLine2` | string \| null |
| `city`, `state`, `pincode` | string |

**Employment**

| Field | Type | Notes |
|--------|------|--------|
| `employmentType` | string | e.g. `Full-time`, `Part-time`, `Contract`, `Intern` |
| `workShift` | string \| null | |
| `reportingManagerId` | string \| null | FK to another staff `id` in same school |

**Teaching-specific (when `employeeType === Teaching`)**

| Field | Type |
|--------|------|
| `subjectsTaught` | string[] | Prefer subject IDs if academics module uses IDs |
| `classesAssigned`, `sectionsAssigned` | string[] | Prefer class/section IDs |
| `isClassTeacher` | boolean |
| `classTeacherOf` | `{ classId, sectionId }` \| null |
| `teachingExperienceYears` | number \| null |

**Salary & bank (sensitive)**

| Field | Type |
|--------|------|
| `salaryType` | string \| null |
| `basicSalary` | number \| null |
| `allowances` | string \| null |
| `bankName`, `accountNumber`, `ifscCode` | string \| null |

Encrypt or restrict these fields by role; consider omitting from generic list APIs.

**System access**

| Field | Type | Notes |
|--------|------|--------|
| `hasSystemAccess` | boolean | |
| `username` | string \| null | |
| `loginEmail` | string \| null | Often same as work email |
| `roleId` | string \| null | Maps to school roles |
| `permissionIds` | string[] | Optional fine-grained permissions |

Provisioning/credential flows may live on **auth/user** services; staff API should still persist flags and identifiers the UI edits.

**Other**

| Field | Type |
|--------|------|
| `notes` | string \| null |
| `qualifications` | `StaffQualification[]` |
| `experience` | `StaffExperience[]` |
| `documents` | `StaffDocument[]` |
| `createdAt`, `updatedAt` | string (ISO 8601) | Recommended |

### 2.4 Nested: `StaffQualification`

| Field | Type |
|--------|------|
| `id` | string |
| `degree` | string |
| `institution`, `boardOrUniversity` | string \| null |
| `year` | number \| null |
| `percentageOrCgpa` | string \| null |

### 2.5 Nested: `StaffExperience`

| Field | Type |
|--------|------|
| `id` | string |
| `organisation` | string |
| `role` | string \| null |
| `fromDate`, `toDate` | string (ISO date); `toDate` null = current |
| `description` | string \| null |

### 2.6 Nested: `StaffDocument`

| Field | Type |
|--------|------|
| `id` | string |
| `type` | enum — align with UI: `Resume`, `Aadhaar Front`, `Aadhaar Back`, `PAN`, `Education Certificate`, `Experience Certificate`, `Other` |
| `fileName` | string |
| `fileSize` | number \| optional |
| `uploadedAt` | string \| optional |

**Note:** The detail page dropdown currently includes a generic `Aadhaar` label; backend and client should standardize on **`Aadhaar Front`** / **`Aadhaar Back`** to match create flow and `StaffDocumentType`.

---

## 3. List staff (admin table + filters)

**GET** `…/staff`

**Query parameters**

| Param | Description |
|--------|-------------|
| `department` | Omit or `all`; else exact match (or ID if departments are normalized) |
| `designation` | Omit or `all` |
| `employeeType` | `all` \| `Teaching` \| `Non-Teaching` |
| `status` | `all` or single status value |
| `q` | Search across name, `staffId`, mobile, email (case-insensitive) |
| `sort` | e.g. `joiningDate_desc` \| `joiningDate_asc` \| `name_asc` (define allowed values) |
| `page`, `pageSize` | Pagination |

**Response**

- `{ data: StaffListItem[], meta: { total, page, pageSize } }`  
  or `{ data: { items, total, page, pageSize } }` — **document chosen shape** for the frontend adapter.

**Optional:** `counts=1` returning aggregate counts by `status` (and/or `department`) for metric cards without loading the full list.

---

## 4. Dashboard metrics & charts (optional)

The list page shows:

- Total staff, counts by department slice (e.g. Administration), Active count, On Leave count.
- Charts: **Staff Attendance** (weekly mock), **Department Distribution** (pie mock).

**Option A — derive from list + summary**

- Same **GET** list with `counts` / small **GET** `…/staff/summary` returning `{ total, byStatus, byDepartment[] }`.

**Option B — attendance**

- Real attendance belongs to the **Attendance** module; expose **GET** `…/staff/attendance-summary?range=weekly` when ready, or keep chart static until integrated.

---

## 5. Get one staff

**GET** `…/staff/{staffId}`

- `staffId` is the primary **`id`** (UUID), not necessarily the display `staffId` code — **pick one canonical path param** and document it (recommend: internal `id`).
- **404** if not found or wrong tenant.
- Response: full **`StaffProfile`** including nested arrays (or lazy-load nested resources via separate endpoints — see §8).

---

## 6. Create staff

**POST** `…/staff`

**Option 1 — JSON only**

- Body: core profile fields + nested `qualifications`, `experience` (without file binaries).
- **Photo** and **documents** via follow-up uploads (§8).

**Option 2 — Multipart**

- `multipart/form-data` with scalar fields + optional `photo` file + optional `aadhaarFront`, `aadhaarBack`, `pan` (matches current wizard).

**Validation (align with UI wizard)**

- Step basics: `firstName`, `gender`, `dateOfBirth` required.
- Contact: `mobile` (valid 10-digit), `email`, `addressLine1`, `city`, `state`, `pincode` (6-digit) required.
- Employment: `employeeType`, `department`, `designation`, `joiningDate`, `employmentType` required.
- Access step: if policy requires KYC on create: **Aadhaar front & back** files required unless `draft` mode is supported.

**`staffId` (display code)**

- Optional on create; if omitted, **server generates** unique per school.

**System access**

- If `hasSystemAccess: true`, validate `loginEmail` (and `roleId` if required). User creation may be **synchronous** in same transaction or **async** job; return clear errors if email already exists.

**Response:** **201** with full `StaffProfile` (or `{ id }` + **GET** to hydrate).

---

## 7. Update staff

**PATCH** `…/staff/{id}`

- Partial updates for any scalar/nested fields the edit form supports.
- Nested arrays (`qualifications`, `experience`): either **replace entire array** or support dedicated sub-routes (§8) to avoid accidental overwrites.

**PUT** (optional)

- Same handler as PATCH if you want idempotent full replace; document behavior.

**Activate / Deactivate** (from list row menu)

- **PATCH** `…/staff/{id}` with `{ "status": "Active" }` or `{ "status": "Inactive" }`  
  or dedicated **POST** `…/staff/{id}/activate` / `deactivate`.

---

## 8. Delete staff

**DELETE** `…/staff/{id}`

- **Hard delete** vs **soft delete** (`status` / `deletedAt`): document behavior. UI copy says deletion is destructive — align with GDPR/retention policy.

---

## 9. Photo

**Option A:** Multipart on create/update with field `photo`.

**Option B:** **POST** `…/staff/{id}/photo` (multipart file).

- Accept: JPEG, PNG, WebP; max size (e.g. 2 MB) per UI hint.
- Response: updated `photoUrl` (signed URL or path).

**DELETE** `…/staff/{id}/photo` — clear photo optional.

---

## 10. Documents

**POST** `…/staff/{id}/documents` — `multipart/form-data`: `file`, `type` (enum from §2.6).

**GET** `…/staff/{id}/documents` — list metadata (`StaffDocument[]`).

**GET** `…/staff/{id}/documents/{documentId}/download` — stream or **302** to signed URL.

**DELETE** `…/staff/{id}/documents/{documentId}`.

---

## 11. Qualifications & experience (optional split)

If PATCH payloads become too large:

- **POST/PATCH/DELETE** `…/staff/{id}/qualifications/{qualificationId}`
- **POST/PATCH/DELETE** `…/staff/{id}/experience/{experienceId}`

Otherwise, **PATCH** staff with full `qualifications` / `experience` arrays is acceptable for v1.

---

## 12. Reporting manager

- `reportingManagerId` must reference an existing staff **`id`** in the same school (or null).
- **GET** list could support `include=managers` or a separate **GET** `…/staff?eligibleManagers=1` returning minimal `{ id, staffId, name }` for dropdowns.

---

## 13. Errors

| Code | Use |
|------|-----|
| **400** | Validation; prefer `{ errors: { field: string[] } }` or problem+json |
| **401** | Unauthenticated |
| **403** | Wrong role or tenant |
| **404** | Staff not found |
| **409** | Duplicate `staffId`, `loginEmail`, or mobile/email uniqueness rule |
| **413** | File too large |
| **415** | Unsupported file type |

---

## 14. Future / related modules

- **Teachers** route in the app may overlap teaching staff; clarify whether teachers are a **subset** of staff with `employeeType: Teaching` or a separate entity with a link `staffId`.
- **Roles & permissions** — staff `roleId` / `permissionIds` should stay consistent with `/admin/roles-permissions`.
- **Payroll** — salary fields may move to a dedicated finance API later; keep extension points.

---

## Summary

| Capability | Method | Path pattern |
|------------|--------|----------------|
| List + filters + search + pagination | GET | `…/staff` |
| Summary counts (optional) | GET | `…/staff?counts=1` or `…/staff/summary` |
| Get profile | GET | `…/staff/{id}` |
| Create | POST | `…/staff` (JSON or multipart) |
| Update | PATCH | `…/staff/{id}` |
| Delete | DELETE | `…/staff/{id}` |
| Photo | POST/DELETE | `…/staff/{id}/photo` (or multipart on PATCH) |
| Documents | CRUD + download | `…/staff/{id}/documents…` |

This document is the contract the frontend should implement against when replacing `useStaffStore` mock data with real HTTP clients.
