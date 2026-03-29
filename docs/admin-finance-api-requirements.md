# Admin Finance — API requirements

Specification for backend APIs that power **Fee Types** (`/admin/finance/fee-types`), **Fee Structure** (`/admin/finance/fee-structure`), **Fees** / collection (`/admin/finance/fees-collection`), and **Expenses** (`/admin/finance/expenses`). UI uses **local mock state**; these endpoints replace it.

## 1. Scope and tenancy

- **Authenticated** finance / admin roles.
- All monetary records scoped to **`schoolId`**, **`academicYearId`** where applicable.

**Suggested base:** `/api/v1/schools/{schoolId}/finance/...` or `/api/admin/finance/...`.

---

## 2. Fee types

Reference UI: name + short **code** (`src/app/admin/finance/fee-types/page.tsx`).

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `name` | string | e.g. Tuition |
| `code` | string | Unique per school, e.g. TUI |

**Endpoints:** `GET/POST/PATCH/DELETE` `.../fee-types` (and `.../fee-types/{id}`).

**Validation:** unique `code`; cannot delete if referenced by fee structure or invoices.

---

## 3. Fee structure

Per **academic year**, **class**, **fee type**: amount + **due date** (`fee-structure/page.tsx`).

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `academicYearId` | string | |
| `classId` | string | |
| `feeTypeId` | string | |
| `amount` | number | Minor currency unit recommended (paise/cents) |
| `currency` | string | ISO 4217 |
| `dueDate` | string | ISO date |

**Endpoints**

- **GET** `.../fee-structure` — query `academicYearId`, `classId`, `feeTypeId`, pagination  
- **POST** / **PATCH** / **DELETE** row resources

**Validation:** one active row per (year, class, feeType) unless versioned intentionally.

---

## 4. Fees collection / student fee ledger

UI shows **summary cards**, **progress by category**, **student rows** (paid / pending / partial), **record payment** modal (`fees-collection/page.tsx`).

### 4.1 Summary

- **GET** `.../fees/summary?academicYearId=&asOf=`  
- Returns: `collectedTotal`, `pendingTotal`, `overdueTotal`, optional breakdown by fee type.

### 4.2 Student fee lines

- **GET** `.../fees/invoices` or `.../fees/ledger`  
- **Query:** `studentId`, `classId`, `status`, `search`, `page`, `pageSize`  
- Row fields: student id/name/class, **fee category** (fee type), **amount**, **dueDate**, **status** (`Paid` | `Pending` | `Partially Paid`), **paidAmount**, **balance**.

### 4.3 Record payment

- **POST** `.../fees/payments`  
- Body: `studentId`, `lines: { ledgerLineId, amount }[]`, `method`, `reference`, `paidAt`  
- **Response:** updated balances; optional receipt PDF URL.

### 4.4 Waivers / adjustments (optional)

- **POST** `.../fees/adjustments` with audit fields.

---

## 5. Expenses

UI: **reimbursement requests** (staff, amount, status) and **expense line items** by department (`expenses/page.tsx`).

### 5.1 Reimbursements

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Request id |
| `staffId` | string | |
| `amount` | number | |
| `note` | string | |
| `submittedAt` | string | |
| `status` | enum | `Approved`, `Declined`, `Review` |

**Endpoints:** `GET` list + filters, **PATCH** status (approver role), **POST** create.

### 5.2 Expense entries

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `date` | string | |
| `department` | string | |
| `category` | enum | e.g. Supplies, Maintenance, Events |
| `description` | string | |
| `quantity` | string \| number | UI allows text |
| `amount` | number | |

**Endpoints:** CRUD + **GET** aggregates for charts (trend, by category).

---

## 6. Currency and rounding

- Store amounts in **minor units**; expose formatted strings only in UI, not as source of truth.
- Document tax/GST if added later.

## 7. Errors

- **400** validation; **401**; **403**; **404**; **409** double payment / locked period.

---

**Summary:** Fee master data (types + structure), student ledger/payments, and operational expenses/reimbursements with reporting hooks for the finance hub.
