# Admin Calendar — API requirements

Specification for backend APIs that power `/admin/calendar`. The UI shows a **month grid**, **category chips** (academic, event, finance, admin), and **events per day** (`src/app/admin/calendar/page.tsx` — static `eventsByDate`).

## 1. Scope and tenancy

- **Authenticated** school users; events belong to **`schoolId`** (optional **branchId**).

**Suggested base:** `/api/v1/schools/{schoolId}/calendar` or `/api/admin/calendar`.

## 2. Event model

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `title` | string | |
| `category` | enum | `academic`, `event`, `finance`, `admin` (match UI variants) |
| `startAt` | string (ISO 8601) | |
| `endAt` | string \| null | Null = all-day |
| `allDay` | boolean | UI uses “All Day” copy |
| `location` | string \| null | Optional |
| `description` | string \| null | Optional |
| `visibility` | enum | `school`, `staff`, `public` (product choice) |
| `relatedExamId` | string \| null | Optional link to exams module |
| `relatedFeeDueId` | string \| null | Optional link to finance |

## 3. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../events` | Query: `year`, `month` (1–12), optional `category`, `branchId` |
| GET | `.../events/{id}` | Detail |
| POST | `.../events` | Create |
| PATCH | `.../events/{id}` | Update |
| DELETE | `.../events/{id}` | Delete |

### Aggregates for chips (optional)

- **GET** `.../events/summary?year=&month=` → `{ category: string, count: number }[]` for chip badges.

## 4. Validation

- `endAt >= startAt` when both set.
- Recurring events — out of scope unless added (`rrule` optional future).

## 5. Errors

- **400**, **401**, **403**, **404**.

---

**Summary:** Month-scoped event CRUD with categories aligned to the calendar UI; optional summaries for filter chips.
