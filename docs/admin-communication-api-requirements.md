# Admin Communication — API requirements

Specification for backend APIs that power `/admin/communication`. The UI has tabs: **Send** (compose), **Fee reminders**, **Attendance alerts**, **Log** (`src/app/admin/communication/page.tsx` — static tables).

## 1. Scope and tenancy

- **Authenticated** admin / communications role.
- Messages scoped to **`schoolId`**; audience may be **segments** (all parents, class, grade).

**Suggested base:** `/api/v1/schools/{schoolId}/communication` or `/api/admin/communication`.

*Note:* **Notice board** is a separate module (`admin-notice-board-api-requirements.md`). Communication covers **direct/outbound messaging** and **automated notification logs** unless product merges them.

## 2. Audience targeting

Support UI dropdown concepts: `all`, `parents`, `students`, `teachers`, **class-specific** (e.g. class 9). Backend may use:

- `audienceType` enum + optional `classId` / `sectionId` / `gradeId`.

## 3. Send message

- **POST** `.../messages`  
- **Body:** `channel` (`email` | `sms` | `in_app` | multi), `subject`, `body`, `audience` descriptor, optional `scheduledAt`  
- **Response:** `{ messageId, status }`

Optional **draft** + **POST** `.../messages/{id}/send`.

## 4. Fee reminders tab

Either dedicated resource or filtered **message** type.

- **GET** `.../notifications?type=fee_reminder&page=`  
- Row: `id`, `sentAt`, `audienceLabel`, `subject`, `status` (`Sent`, `Failed`, `Queued`)

Triggering may be **manual** from UI or **scheduled** job reading finance dues — document if API only lists history.

## 5. Attendance alerts tab

- **GET** `.../notifications?type=attendance_alert`  
- Row: `id`, `sentAt`, `studentId` / display ref, `message`, `status`

May be created by **attendance** service when absence is recorded (internal) with read-only listing here.

## 6. Communication log (unified)

- **GET** `.../communication-log`  
- **Query:** `from`, `to`, `type` (notice, fee reminder, attendance, custom), `page`, `pageSize`  
- Row: `date`, `type`, `audience`, `subject` (align **Log** tab columns)

## 7. Provider integration

- Email/SMS gateways are implementation details; API returns delivery **status** and **failure reason** per recipient optionally.

## 8. Errors

- **400** invalid audience; **401**; **403**; **429** rate limits.

---

**Summary:** Outbound messaging with audience scoping, typed notification history for fee/attendance tabs, and a unified log aligned to the communication UI.
