#!/usr/bin/env bash
# Notice Board API — curl examples
# Base paths:
#   /api/v1/schools/{schoolId}/notices  (tenant in URL; must match admin's school)
#   /api/v1/admin/communication/notices  (tenant from JWT)
#
# Usage: set variables below, then copy/paste individual curl blocks, or: bash -x scripts/curl-notice-board-api.sh (if you uncomment calls).

set -euo pipefail

# --- set these ---
BASE="${BASE:-http://localhost:3000}"
TOKEN="${TOKEN:-REPLACE_WITH_ADMIN_JWT}"
SCHOOL_ID="${SCHOOL_ID:-REPLACE_WITH_SCHOOL_OBJECT_ID}"
NOTICE_ID="${NOTICE_ID:-REPLACE_WITH_NOTICE_OBJECT_ID}"
# PDF path for multipart examples (optional)
ATTACHMENT_FILE="${ATTACHMENT_FILE:-/path/to/file.pdf}"

# =============================================================================
# SCHOOL-SCOPED: /api/v1/schools/{schoolId}/notices
# =============================================================================

# List (filters, sort, pagination, optional status counts)
curl -sS -X GET \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices?category=all&status=all&q=&sort=postAt_desc&page=1&pageSize=10&counts=1" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# Get one
curl -sS -X GET \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# Create (JSON, no file)
curl -sS -X POST \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices" \
  -H "Authorization: Bearer ${TOKEN}" \
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
echo

# Create (draft — content may be empty)
curl -sS -X POST \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices" \
  -H "Authorization: Bearer ${TOKEN}" \
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
echo

# Create (multipart + attachment)
curl -sS -X POST \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  -F "title=Notice with PDF" \
  -F "category=Finance" \
  -F "audience=Parents" \
  -F "content=<p>Please see attachment.</p>" \
  -F "status=active" \
  -F "postAt=2026-03-28T06:00:00.000Z" \
  -F "expiresAt=2026-04-30T23:59:59.999Z" \
  -F "target=all" \
  -F "attachment=@${ATTACHMENT_FILE};type=application/pdf"
echo

# Update (JSON)
curl -sS -X PATCH \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Updated title",
    "content": "<p>Updated body</p>"
  }'
echo

# Update — replace attachment (multipart)
curl -sS -X PATCH \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  -F "title=Updated with new file" \
  -F "attachment=@${ATTACHMENT_FILE};type=application/pdf"
echo

# Update — remove attachment
curl -sS -X PATCH \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"removeAttachment": true}'
echo

# Delete
curl -sS -X DELETE \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# Download attachment (-o writes file)
curl -sS -L -X GET \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}/attachment" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o "downloaded-notice-attachment"
echo "Saved attachment to ./downloaded-notice-attachment"

# Publish (sets active + postAt/publishedAt to now)
curl -sS -X POST \
  "${BASE}/api/v1/schools/${SCHOOL_ID}/notices/${NOTICE_ID}/publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# =============================================================================
# ADMIN PATH (tenant from session): /api/v1/admin/communication/notices
# =============================================================================

# List
curl -sS -X GET \
  "${BASE}/api/v1/admin/communication/notices?category=all&status=all&q=&sort=postAt_desc&page=1&pageSize=10&counts=1" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# Get one
curl -sS -X GET \
  "${BASE}/api/v1/admin/communication/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# Create (JSON)
curl -sS -X POST \
  "${BASE}/api/v1/admin/communication/notices" \
  -H "Authorization: Bearer ${TOKEN}" \
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
echo

# Create (multipart)
curl -sS -X POST \
  "${BASE}/api/v1/admin/communication/notices" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  -F "title=With file" \
  -F "category=Notice" \
  -F "audience=Everyone" \
  -F "content=<p>See PDF</p>" \
  -F "status=active" \
  -F "postAt=2026-03-28T06:00:00.000Z" \
  -F "expiresAt=2026-05-01T23:59:59.999Z" \
  -F "target=all" \
  -F "attachment=@${ATTACHMENT_FILE};type=application/pdf"
echo

# Update (PATCH)
curl -sS -X PATCH \
  "${BASE}/api/v1/admin/communication/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"title":"Quick edit","content":"<p>Edited</p>"}'
echo

# Update (PUT — same handler)
curl -sS -X PUT \
  "${BASE}/api/v1/admin/communication/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"status":"draft"}'
echo

# Delete
curl -sS -X DELETE \
  "${BASE}/api/v1/admin/communication/notices/${NOTICE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# Attachment download
curl -sS -L -X GET \
  "${BASE}/api/v1/admin/communication/notices/${NOTICE_ID}/attachment" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o "admin-notice-attachment"
echo "Saved attachment to ./admin-notice-attachment"

# Publish
curl -sS -X POST \
  "${BASE}/api/v1/admin/communication/notices/${NOTICE_ID}/publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json"
echo

# =============================================================================
# Reference
# =============================================================================
# Categories: Academic, Events, Maintenance, Arts, Finance, Notice, Training
# Write statuses: draft, active, scheduled
# List status filter: all | draft | active | scheduled | expired
# Sort: postAt_desc | postAt_asc
# Max attachment: NOTICE_MAX_ATTACHMENT_BYTES env or 25 MB default
# Allowed types: PDF, DOC/DOCX, PNG, JPEG
