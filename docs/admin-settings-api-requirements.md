# Admin Settings — API requirements

Specification for backend APIs that power `/admin/settings`. The UI currently shows **static form controls** (school name, read-only school code, timezone, account email, change password, notifications toggles) in `src/app/admin/settings/page.tsx` without persistence.

## 1. Scope and tenancy

- **Authenticated** user; **school-level** settings require admin role.
- **User-level** settings (email display, password) apply to the **logged-in account**.

**Suggested paths**

- School: `/api/v1/schools/{schoolId}/settings` or reuse **school profile** / **config** section (`SchoolProfileConfigInfo` in `src/types/school-profile.ts`).
- User: `/api/v1/auth/profile` or `/api/v1/users/me` (align with `AUTH_API.profile` in `src/lib/api-urls.ts`).

## 2. School settings (General section)

| Field | Type | Notes |
|-------|------|--------|
| `displayName` | string | “School name” in UI |
| `schoolCode` | string | Read-only after creation |
| `timezone` | string | IANA id, e.g. `Asia/Kolkata` |

**Endpoints**

- **GET** `.../settings/school`  
- **PATCH** `.../settings/school` — only mutable fields

*Alternative:* PATCH `SchoolProfileData.configInfo` / `basicInfo` only — document single endpoint to avoid duplication.

## 3. Account settings

| Field | Type | Notes |
|-------|------|--------|
| `email` | string | Often read-only if OTP verified |
| — | — | Change password flow below |

### Change password

- **POST** `.../auth/change-password` — body: `currentPassword`, `newPassword`  
- Or use existing **reset-password** flow with session context.

## 4. Preferences (Notifications section in UI)

| Field | Type | Notes |
|-------|------|--------|
| `emailNotifications` | boolean | |
| `smsAlerts` | boolean | |
| `weeklyDigest` | boolean | |

**GET/PATCH** `.../users/me/preferences` or embed in profile response.

## 5. Validation

- Password policy (length, complexity).
- Timezone must be valid IANA identifier.

## 6. Errors

- **400** weak password / invalid timezone; **401** wrong current password; **403**.

---

**Summary:** Persist school display settings and user preferences; integrate password change with existing auth APIs; deduplicate with school profile where fields overlap.
