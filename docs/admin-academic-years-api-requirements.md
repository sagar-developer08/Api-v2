# Admin Academic Years — API requirements

Specification for backend APIs that power `/admin/academic-years`. The UI uses **local mock rows** (`MOCK_YEARS` in `src/app/admin/academic-years/page.tsx`); these endpoints replace that layer.

## 1. Scope and tenancy

- **Authenticated** admin.
- Academic years belong to **`schoolId`**.

**Suggested base:** `/api/v1/schools/{schoolId}/academic-years` or `/api/admin/academic-years`.

## 2. Domain model

### Academic year row

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `name` | string | Display label, e.g. `2024-2025` |
| `startDate` | string | ISO date |
| `endDate` | string | ISO date; must be after start |
| `status` | enum | `Draft`, `Active`, `Closed` (align with UI badges) |
| `isCurrent` | boolean | At most one current per school (enforce server-side) |

Setup wizard may return academic years inside `SchoolSetupWizard` — keep **one source of truth** or document sync rules (`src/types/school-profile.ts` `SchoolProfileAcademicYear`).

## 3. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../academic-years` | List; optional `status` filter |
| GET | `.../academic-years/{id}` | Single year |
| POST | `.../academic-years` | Create |
| PATCH | `.../academic-years/{id}` | Update |
| POST | `.../academic-years/{id}/set-current` | Promote to current; demote others |
| DELETE | `.../academic-years/{id}` | Only if `Draft` or no enrollments (policy) |

## 4. Validation

- Non-overlapping date ranges vs other years (configurable: allow overlap for planning).
- Cannot close year with active enrollments without migration — product rule.

## 5. Errors

- **400** invalid range / duplicate name; **401**; **403**; **404**; **409** set-current conflict.

---

**Summary:** CRUD for academic years plus explicit “set as current” consistent with the table actions in the UI.
