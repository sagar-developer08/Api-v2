# Admin School Profile — API requirements

Specification for backend APIs that power `/admin/school-profile` and `/admin/school-profile/create` (setup wizard). The client fetches via **`fetchSchoolProfile`** in `src/services/school-profile.ts` using **`SCHOOL_API.setupWizard`** (`src/lib/api-urls.ts`):

- `GET /api/v1/schools/setup-wizard` (tenant from token), or  
- `GET /api/v1/schools/{schoolId}/setup-wizard`

Response is mapped into **`SchoolProfileData`** (`src/types/school-profile.ts`).

## 1. Scope and tenancy

- **Authenticated** school admin.
- **GET/PATCH** must enforce tenant match.

## 2. Response shape (UI target)

Reference: `SchoolProfileData` — sections:

| Section | Types |
|---------|--------|
| Basic | `SchoolProfileBasicInfo` — name, code, logo, establishment, type, board, category, recognition/affiliation |
| Contact | `SchoolProfileContactInfo` — emails, phones, website, `SchoolProfileAddress` |
| Administrative | `SchoolProfileAdministrativeInfo` — principal, admin officer, capacity, current academic year label |
| Academic | `SchoolProfileAcademicInfo` — classes offered, mediums, working days, grading system, nested academic years |
| Timings | `SchoolProfileTimingsInfo` — start/end, period duration, lunch window |
| Policies | `SchoolProfilePoliciesInfo` — min attendance %, text policies |
| Optional | `SchoolProfileOptionalInfo` — motto, tax/GST, bank details |
| Meta | `SchoolProfileMeta` — `schoolId`, `status`, `setupWizardStep`, `isSetup`, `updatedAt` |
| Config | `SchoolProfileConfigInfo` — timezone, academic year start month, geo, `setupLocked`, `readOnly` |
| Structure | `structureInfo` — `classes`, `sections`, `branches` summaries |

Raw API types: `SchoolSetupWizardDataRaw` and nested `SchoolSetupAcademicYearRaw`, `SchoolSetupClassRaw`, etc. — **document the wire format** the server returns today and extend as the UI adds fields.

## 3. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/schools/setup-wizard` or `.../schools/{schoolId}/setup-wizard` | Read profile / wizard state |
| PATCH | same | Partial update (prefer JSON Merge Patch or explicit sections) |
| POST | `.../setup-wizard/complete` | Mark setup finished (optional) |

Logo upload: **POST** multipart `.../school-profile/logo` returning URL, or presigned URL pattern.

## 4. Alignment with other modules

- **Academic years**, **classes**, **sections** may duplicate between setup wizard and dedicated admin pages — define **single source of truth** or sync rules.
- **Settings** page (`admin-settings-api-requirements.md`) may overlap **timezone** / display name — avoid conflicting PATCH targets.

## 5. Validation

- Required fields for “setup complete” (product-defined).
- Read-only fields (`schoolCode`) enforced server-side.

## 6. Errors

- **400** validation; **401**; **403**; **404**.

---

**Summary:** Read/update school profile and wizard state consistent with `SchoolProfileData` and the existing setup-wizard GET path in `api-urls.ts`.
