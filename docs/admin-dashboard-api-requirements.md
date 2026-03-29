# Admin Dashboard — API requirements

Specification for backend APIs that power `/admin/dashboard`. The UI currently uses **static / timed mock data** for KPIs, charts, and calendar widgets; these endpoints replace that layer.

## 1. Scope and tenancy

- Routes are **authenticated** for **school admin** (or equivalent).
- Resolve **`schoolId`** (and optional **branch**) from session or query; reject cross-tenant access (`403` / `404`).

**Suggested base path:** `GET /api/v1/schools/{schoolId}/admin/dashboard` or `GET /api/admin/dashboard` (tenant from token), consistent with `src/services/students.ts` / `classes.ts` style if you standardize on `/api/admin/...`.

## 2. Aggregated payload (suggested)

Single **GET** returning everything the page needs, or split into small resources if caching differs.

### 2.1 KPI cards

| Field | Type | Notes |
|-------|------|--------|
| `totalStudents` | number | |
| `totalTeachers` | number | Teaching staff count for dashboard |
| `totalStaff` | number | Optional; if distinct from teachers |
| `attendanceTodayPercent` | number \| null | Whole-school or default branch |
| `feeCollectionPercent` | number \| null | Optional |
| `openIncidents` | number \| null | Optional alerts |
| `asOf` | string (ISO 8601) | Snapshot time |

### 2.2 Charts (series-ready)

Expose either **pre-bucketed** arrays for ECharts or **raw facts** the client aggregates.

| Widget | Suggested shape |
|--------|------------------|
| Student performance by grade / month | `{ labels: string[], series: { name: string, data: number[] }[] }` |
| Earnings vs expenses (monthly) | Same pattern |
| Students by gender | `{ segments: { label: string, value: number }[] }` |
| Weekly attendance bars | `{ labels: string[], values: number[] }` |

Support **query params** for range: `academicYearId`, `from`, `to`, `gradeId`, `branchId`.

### 2.3 Mini calendar / events teaser

| Field | Type |
|-------|------|
| `events` | `{ id, title, startAt, endAt?, allDay?, type? }[]` |

Limit to visible month or next N items; full calendar can use the calendar module API.

### 2.4 Notices / announcements strip (optional)

Short list: `id`, `title`, `postAt`, `category` — or link UI to the notice list API only.

## 3. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../dashboard` | Summary + chart datasets + optional events |
| GET | `.../dashboard/kpis` | Optional split for heavy pages |

**Response:** `{ success: boolean, data: { ... } }` or plain `data` object; match existing Vidhya conventions.

## 4. Caching and performance

- Dashboard is read-heavy; **ETag** or short **TTL** (e.g. 60s) acceptable.
- Prefer **async pre-aggregation** (jobs) for large schools if queries are expensive.

## 5. Errors

- **401** — unauthenticated  
- **403** — wrong role / tenant  
- **400** — invalid filter params  

---

**Summary:** One (or few) read-only, tenant-scoped endpoints supplying KPIs, chart series, and light calendar/notice teasers for the admin home dashboard.
