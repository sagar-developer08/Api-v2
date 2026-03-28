#!/usr/bin/env bash
# Notice Board API — full curl reference (safe: this script only prints examples).
# Usage:
#   ./scripts/curl-notice-board-api.sh              # print all examples to stdout
#   BASE=http://localhost:3000 TOKEN=... ./scripts/curl-notice-board-api.sh  # print with env substituted
#
# Or open this file and copy the blocks from the heredoc below.

substitute() {
  local BASE="${BASE:-http://localhost:3000}"
  local TOKEN="${TOKEN:-YOUR_ADMIN_JWT}"
  local SCHOOL_ID="${SCHOOL_ID:-YOUR_SCHOOL_OBJECT_ID}"
  local NOTICE_ID="${NOTICE_ID:-YOUR_NOTICE_OBJECT_ID}"
  local ATTACHMENT_FILE="${ATTACHMENT_FILE:-/path/to/file.pdf}"
  sed -e "s|{{BASE}}|${BASE}|g" \
      -e "s|{{TOKEN}}|${TOKEN}|g" \
      -e "s|{{SCHOOL_ID}}|${SCHOOL_ID}|g" \
      -e "s|{{NOTICE_ID}}|${NOTICE_ID}|g" \
      -e "s|{{ATTACHMENT_FILE}}|${ATTACHMENT_FILE}|g"
}

substitute <<'CURL_REFERENCE'
# =============================================================================
# Notice Board API — curl examples
# Running this script substitutes template vars in curl lines from env: BASE, TOKEN, SCHOOL_ID, NOTICE_ID, ATTACHMENT_FILE (defaults shown in sed inside script).
# =============================================================================

# --- env (optional) ---
# export BASE="http://localhost:3000"
# export TOKEN="eyJhbGciOiJIUzI1NiIs..."
# export SCHOOL_ID="507f1f77bcf86cd799439011"
# export NOTICE_ID="507f191e810c19729de860ea"
# export ATTACHMENT_FILE="/path/to/file.pdf"

# Reference:
# Categories: Academic, Events, Maintenance, Arts, Finance, Notice, Training
# Write statuses: draft, active, scheduled
# List filter status: all | draft | active | scheduled | expired
# Sort: postAt_desc | postAt_asc

# =============================================================================
# A) SCHOOL-SCOPED — /api/v1/schools/{schoolId}/notices
# =============================================================================

# A1) List (pagination, filters, optional countsByEffectiveStatus)
curl -sS -X GET \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices?category=all&status=all&q=&sort=postAt_desc&page=1&pageSize=10&counts=1" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# A2) Get one
curl -sS -X GET \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# A3) Create (JSON)
curl -sS -X POST \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Holiday notice",
    "category": "Academic",
    "audience": "Students Grade 7-9",
    "content": "<p>School closed on Monday.</p>",
    "status": "active",
    "postAt": "2026-03-28T06:00:00.000Z",
    "expiresAt": "2026-04-30T23:59:59.999Z",
    "publisherRole": "Principal",
    "visualKey": "academic",
    "target": "all"
  }'

# A4) Create (draft)
curl -sS -X POST \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Draft notice",
    "category": "Notice",
    "audience": "All",
    "content": "",
    "status": "draft",
    "postAt": "2026-03-28T06:00:00.000Z",
    "expiresAt": "2026-04-30T23:59:59.999Z",
    "target": "all"
  }'

# A5) Create (multipart + attachment)
curl -sS -X POST \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json" \
  -F "title=Notice with PDF" \
  -F "category=Finance" \
  -F "audience=Parents" \
  -F "content=<p>Please see attachment.</p>" \
  -F "status=active" \
  -F "postAt=2026-03-28T06:00:00.000Z" \
  -F "expiresAt=2026-04-30T23:59:59.999Z" \
  -F "target=all" \
  -F "attachment=@{{ATTACHMENT_FILE}};type=application/pdf"

# A6) Update (JSON)
curl -sS -X PATCH \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Updated title",
    "content": "<p>Updated body</p>"
  }'

# A7) Update (replace attachment)
curl -sS -X PATCH \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json" \
  -F "title=Updated with new file" \
  -F "attachment=@{{ATTACHMENT_FILE}};type=application/pdf"

# A8) Update (remove attachment)
curl -sS -X PATCH \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"removeAttachment": true}'

# A9) Delete
curl -sS -X DELETE \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# A10) Download attachment
curl -sS -L -X GET \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}/attachment" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -o "downloaded-notice-attachment"

# A11) Publish (legacy — sets active + now)
curl -sS -X POST \
  "{{BASE}}/api/v1/schools/{{SCHOOL_ID}}/notices/{{NOTICE_ID}}/publish" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# =============================================================================
# B) ADMIN PATH (tenant from JWT) — /api/v1/admin/communication/notices
# =============================================================================

# B1) List
curl -sS -X GET \
  "{{BASE}}/api/v1/admin/communication/notices?category=all&status=all&q=&sort=postAt_desc&page=1&pageSize=10&counts=1" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# B2) Get one
curl -sS -X GET \
  "{{BASE}}/api/v1/admin/communication/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# B3) Create (JSON)
curl -sS -X POST \
  "{{BASE}}/api/v1/admin/communication/notices" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Admin path notice",
    "category": "Events",
    "audience": "All staff",
    "content": "<p>Event details</p>",
    "status": "scheduled",
    "postAt": "2026-04-01T09:00:00.000Z",
    "expiresAt": "2026-04-15T23:59:59.999Z",
    "target": "teachers"
  }'

# B4) Create (multipart)
curl -sS -X POST \
  "{{BASE}}/api/v1/admin/communication/notices" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json" \
  -F "title=With file" \
  -F "category=Notice" \
  -F "audience=Everyone" \
  -F "content=<p>See PDF</p>" \
  -F "status=active" \
  -F "postAt=2026-03-28T06:00:00.000Z" \
  -F "expiresAt=2026-05-01T23:59:59.999Z" \
  -F "target=all" \
  -F "attachment=@{{ATTACHMENT_FILE}};type=application/pdf"

# B5) Update (PATCH)
curl -sS -X PATCH \
  "{{BASE}}/api/v1/admin/communication/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"title":"Quick edit","content":"<p>Edited</p>"}'

# B6) Update (PUT)
curl -sS -X PUT \
  "{{BASE}}/api/v1/admin/communication/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"status":"draft"}'

# B7) Delete
curl -sS -X DELETE \
  "{{BASE}}/api/v1/admin/communication/notices/{{NOTICE_ID}}" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

# B8) Download attachment
curl -sS -L -X GET \
  "{{BASE}}/api/v1/admin/communication/notices/{{NOTICE_ID}}/attachment" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -o "admin-notice-attachment"

# B9) Publish
curl -sS -X POST \
  "{{BASE}}/api/v1/admin/communication/notices/{{NOTICE_ID}}/publish" \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Accept: application/json"

CURL_REFERENCE
