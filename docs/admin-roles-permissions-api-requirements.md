# Admin Roles & Permissions — API requirements

Specification for backend APIs that power `/admin/roles-permissions`. The UI manages **role definitions** (name, category, description, active), **module permission matrix** per role, and **staff ↔ role assignments** (`src/app/admin/roles-permissions/page.tsx` — `RoleDefinition`, `StaffAssignment`, `MODULES` list).

## 1. Scope and tenancy

- **Authenticated** super-admin **or** school admin with “manage roles” capability (product decision).
- For **per-school** custom roles: scope to **`schoolId`**. Platform default roles may be **read-only** templates.

**Suggested base:** `/api/v1/schools/{schoolId}/rbac` or `/api/admin/rbac`.

## 2. Module keys

Align with UI `MODULES` array (extend as nav grows), e.g. `Dashboard`, `Students`, `Teachers`, `Staffs`, `Attendance`, `Finance`, `Timetable`, `Notice Board`, `Reports`, `Settings`.

Backend may use **snake_case** keys; document stable **slug** ↔ label mapping.

## 3. Role definition

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Stable slug e.g. `teacher` |
| `name` | string | Display |
| `category` | enum | `Leadership`, `Academic`, `Operations`, `Support` |
| `description` | string | |
| `active` | boolean | |
| `createdAt` | string | |

**Endpoints**

- **GET** `.../roles` — list roles for tenant  
- **POST** `.../roles` — create custom role  
- **PATCH** `.../roles/{id}` — update metadata / deactivate  
- **DELETE** `.../roles/{id}` — if no assignments

## 4. Permissions matrix

For each role, map **module** → **allowed** (boolean) or finer **actions** (`read`, `write`, `delete`).

- **GET** `.../roles/{id}/permissions`  
- **PUT** `.../roles/{id}/permissions` — body: `{ permissions: Record<moduleSlug, boolean> }` or nested actions

Seed defaults for system roles (`teacher`, `principal`, …) as in UI `BASE_PERMISSIONS`.

## 5. Staff assignments

| Field | Type | Notes |
|-------|------|--------|
| `staffId` | string | Links to staff module |
| `roleId` | string | |
| `status` | enum | e.g. `Assigned`, `Review` |

**Endpoints**

- **GET** `.../role-assignments?roleId=&search=`  
- **POST** `.../role-assignments` — assign  
- **PATCH** `.../role-assignments/{id}` — change role / status  
- **DELETE** `.../role-assignments/{id}` — unassign

## 6. Auth enforcement

- JWT or session should include **effective permissions** or **role ids**; **this API** is the admin CRUD that **updates** what auth middleware reads (eventual consistency acceptable with re-login).

## 7. Errors

- **400** invalid module key; **401**; **403** if caller cannot manage RBAC; **404**; **409** delete role with active users.

---

**Summary:** Tenant-scoped roles, module permission matrix, and staff assignments matching the roles & permissions UI; enforce via auth layer separately.
