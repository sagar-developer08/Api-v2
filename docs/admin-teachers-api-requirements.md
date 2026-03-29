# Admin Teachers — API requirements

Specification for backend APIs that power `/admin/teachers`, `/admin/teachers/create`, and `/admin/teachers/[id]`. The UI currently uses **in-page mock rows and charts**; these endpoints replace that layer.

*Note:* Teaching staff may overlap with **Staff** (`/admin/staffs`) when `employeeType === Teaching`. Backend may use one **person** store with role flags or separate **teachers** aggregate — document the chosen model for the client.

## 1. Scope and tenancy

- **Authenticated** admin.
- **`schoolId`** from session or path.

**Suggested base:** `/api/v1/schools/{schoolId}/teachers` or `/api/admin/teachers`.

## 2. Teacher list row

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `fullName` | string | |
| `primarySubject` or `subjects` | string \| string[] | UI shows primary subject |
| `department` | string \| null | For filters / chart |
| `phone` | string | |
| `email` | string | |
| `status` | string | Active, On Leave, etc. |
| `photoUrl` | string \| null | Optional |
| `socialLinks` | object \| null | Optional: linkedin, twitter, instagram flags or URLs |

## 3. Teacher detail

| Area | Fields (examples) |
|------|-------------------|
| Profile | bio, employee code, joining date, qualifications |
| Teaching | subjects, classes, timetable summary |
| Contact | same as list + emergency |
| HR link | `staffProfileId` if unified with staff module |

## 4. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../teachers` | List with `search`, `department`, `subject`, `status`, `page`, `pageSize` |
| GET | `.../teachers/{id}` | Detail |
| POST | `.../teachers` | Create (minimal: name, subject, contact; extend to match create form) |
| PATCH | `.../teachers/{id}` | Update |
| DELETE | `.../teachers/{id}` | Or archive |

## 5. Dashboard widgets (teachers page)

Optional dedicated endpoints or fold into admin dashboard:

- **Department distribution** (counts per department for pie/donut).
- **Attendance overview** (teacher check-in or class coverage — clarify product).
- **Workload** (classes per week, hours) — **GET** `.../teachers/workload?from=&to=` returning series per teacher or top N.

## 6. Validation

- Unique work email per school if used for login.
- Valid `subjectIds` / `classIds` if referenced by academics module.

## 7. Errors

- **400**, **401**, **403**, **404**, **409** duplicate email.

---

**Summary:** CRUD + list filters + optional analytics endpoints for the teachers hub; align with staff module if teachers are a subset of staff records.
