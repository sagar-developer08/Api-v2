# Admin Notice Board — API Requirements

Specification for backend APIs that power `/admin/notice-board` and `/admin/notice-board/create`. The UI currently uses in-memory mock data; these endpoints replace that layer.

## 1. Scope and tenancy

- All routes are **authenticated** and restricted to **admin** (or equivalent) users.
- Every notice belongs to a **school / tenant**. Resolve `schoolId` from the session or host; reject cross-tenant access (`404` or `403` per product policy).

**Suggested base path:** `/api/v1/schools/{schoolId}/notices` (or tenant implied by auth: `/api/v1/notices`).

## 2. Domain model

### 2.1 Notice (response shape)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string (UUID) | Stable identifier |
| `title` | string | Required |
| `category` | enum | `Academic`, `Events`, `Maintenance`, `Arts`, `Finance`, `Notice`, `Training` |
| `audience` | string | Human-readable label (e.g. Students Grade 7-9) |
| `content` | string | Rich text / HTML from editor |
| `status` | enum | `draft`, `active`, `scheduled` (stored). See section 2.2 for `expired` |
| `postAt` | string (ISO 8601) | Start of visibility / publication time |
| `expiresAt` | string (ISO 8601) | End of visibility |
| `createdBy` | string | Display name (or denormalized from staff) |
| `publisherRole` | string or null | Optional; UI fallback if null |
| `createdByUserId` | string or null | Optional FK to staff/user who created |
| `attachment` | object or null | See section 2.3 |
| `visualKey` | enum or null | Optional UI bucket: academic, events, etc. (can default from `category`) |
| `audienceReachCount` | number or null | Optional; maps to mock tagCount if you track reach |
| `createdAt`, `updatedAt` | string (ISO 8601) | Audit |

Client list/table can format `postAt` / `expiresAt` as localized date strings.

### 2.2 Status and expired

- **Stored:** `draft`, `active`, `scheduled`.
- **expired:** Derived when `now > expiresAt` and stored status is `active` or `scheduled` (not `draft`), unless you archive. Expose either **effectiveStatus** (`draft` | `active` | `scheduled` | `expired`) or keep stored `status` and document client-side expiry.

**Scheduled:** `postAt > now` and user chose scheduled publish: store `scheduled` until a job promotes to `active`, or store `active` with future `postAt` and filter in queries.

**Archive (UI Archive notice):** Set stored status to `draft` (or add `archived` if preferred).

### 2.3 Attachment

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | File record id |
| `fileName` | string | Original name |
| `mimeType` | string | e.g. application/pdf |
| `sizeBytes` | number | For display |
| `storageKey` | string | Internal; omit from client if using signed URLs |

Allowed types (match create form): PDF, DOC/DOCX, PNG, JPG/JPEG. Enforce max size (e.g. 10 to 25 MB).

## 3. Endpoints

### 3.1 List notices (admin table)

- **GET** `.../notices`

**Query parameters**

| Param | Description |
|-------|-------------|
| `category` | Omit or `all` = any; else filter by category enum |
| `status` | `all` or `draft` or `active` or `scheduled` or `expired` (if filter supported) |
| `q` | Search across title, audience, category, createdBy (case-insensitive) |
| `sort` | `postAt_desc` (default, Latest) or `postAt_asc` (Oldest) |
| `page`, `pageSize` | Pagination |

**Response:** `{ data: Notice[], meta: { total, page, pageSize } }`

Optionally include **countsByEffectiveStatus** for status chips: `{ all, active, scheduled, draft, expired }`.

### 3.2 Get one notice

- **GET** `.../notices/{noticeId}`
- **404** if missing or wrong tenant.

### 3.3 Create notice

- **POST** `.../notices`
- **Body:** JSON or `multipart/form-data` if file is uploaded in the same request.

**JSON fields (minimum):** `title`, `category`, `audience`, `createdBy` (or fill from session), `status` (`draft` | `active` | `scheduled`), `postAt`, `expiresAt` (validate `expiresAt > postAt`), `content`, optional `publisherRole`, `createdByUserId`, `visualKey`.

**File:** multipart field `attachment`, or two-step upload (section 3.6) then reference `attachmentId`.

- **201** with full Notice. **400** validation with field-level messages.

### 3.4 Update notice

- **PATCH** `.../notices/{noticeId}`
- Quick edit from list modal: `title`, `content` at minimum.
- Full parity with create: category, audience, schedule, status, attachment replace/remove.

### 3.5 Delete notice

- **DELETE** `.../notices/{noticeId}`
- Hard delete or soft delete; UI says cannot be undone.

### 3.6 Attachment download

- **GET** `.../notices/{noticeId}/attachment`
- **302** to signed URL, or **200** stream with `Content-Disposition: attachment`.
- **404** if no attachment.

### 3.7 Optional: presigned upload

- **POST** `.../notices/attachments/upload-url` returns `{ uploadUrl, fileId, expiresAt }`, then **PATCH** notice with `attachmentId`.

## 4. Validation (align with UI)

| Rule | Source |
|------|--------|
| title non-empty | Step 0 |
| postAt, expiresAt required; expiresAt after postAt | Step 1 |
| content non-empty for publish | Step 2 |
| category in enum | Dropdown |
| status in allowed set | Create form |
| attachment type and size | accept list plus server allowlist |

**Save as Draft** may relax rules (e.g. empty content until publish); product decision.

## 5. Background jobs

- If using `scheduled`, promote to `active` when `postAt` elapses.
- Optional: treat expired as computed only (no DB write).

## 6. Errors

- **400** — validation: `{ errors: { field: message[] } }`
- **401** — unauthenticated
- **403** — wrong role or tenant
- **404** — notice not found
- **413** — attachment too large
- **415** — unsupported media type

## 7. Future: parent/student portal

Read-only list/detail with audience filtering and `effectiveStatus === active` and `postAt <= now <= expiresAt`. Separate route namespace; limit exposed fields if needed.

---

**Summary:** CRUD plus list filters, sort, pagination, attachment upload/download, and clear datetime/status semantics so admin list, view modal, edit modal, delete, archive, and create wizard can replace mock data.
