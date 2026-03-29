# Admin Reports — API requirements

Specification for backend APIs that power `/admin/reports`. The UI is expected to evolve around **exportable tables and charts**; this doc defines a minimal contract for **report definitions**, **runs**, and **downloads**.

## 1. Scope and tenancy

- **Authenticated** school admin (or roles with `Reports` permission — see roles module).
- All data scoped to **`schoolId`** (and optional **branch**, **academicYearId**).

**Suggested base:** `/api/v1/schools/{schoolId}/reports` or `/api/admin/reports`.

## 2. Report catalog

List available reports for the UI (labels, categories, required filters).

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Stable key, e.g. `attendance_summary` |
| `name` | string | Display name |
| `description` | string \| null | |
| `category` | string | e.g. Academics, Finance, Attendance |
| `formats` | string[] | `pdf`, `xlsx`, `csv` |
| `filters` | object[] | `{ key, label, type: "dateRange" \| "class" \| "section" \| "select", required }` |

### Endpoint

- **GET** `.../reports/catalog` → `{ data: ReportCatalogItem[] }`

## 3. Report execution (preview / async)

### 3.1 Sync preview (small datasets)

- **POST** `.../reports/{reportId}/preview`  
- **Body:** `{ filters: Record<string, unknown>, limit?: number }`  
- **Response:** `{ columns: { key, header }[], rows: Record<string, unknown>[] }` for table UI.

### 3.2 Async export (large datasets)

- **POST** `.../reports/{reportId}/jobs`  
- **Body:** `{ filters, format: "pdf" \| "xlsx" \| "csv" }`  
- **Response:** `{ jobId, status: "queued" }`

- **GET** `.../reports/jobs/{jobId}` → `{ status, downloadUrl?, error? }`  
- **GET** signed `downloadUrl` (time-limited) or **GET** `.../reports/jobs/{jobId}/file` stream.

## 4. Suggested report IDs (align with product)

Examples only — adjust to roadmap:

| `id` | Purpose |
|------|---------|
| `student_directory` | Students with class/section/contact |
| `attendance_monthly` | Roll-up by class/section/month |
| `fee_outstanding` | Balances by student/class |
| `exam_results_summary` | By exam / class (ties to exams module) |

## 5. Validation

- Reject unknown `reportId` → **404**.  
- Validate required filters → **400** with field errors.  
- Enforce max date range / row cap on preview → **400** if exceeded.

## 6. Errors

- **401**, **403**, **404**, **400** as above; **429** if export rate limited.

---

**Summary:** Catalog + preview + async export jobs with tenant-scoped filters, suitable for a reports hub and future scheduling (out of scope unless added).
