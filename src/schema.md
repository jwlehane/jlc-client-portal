# Firestore Data Schema

## Collections

### `projects`
- Document ID: `<unique_project_id>`
- Fields:
  - `name`: string (e.g., "Timely Signs Lifecycle")
  - `clientName`: string (e.g., "Timely Signs")
  - `clientEmail`: string (e.g., "paul@timelysigns.com")
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### `documents` (Sub-collection of `projects`)
- Path: `projects/{projectId}/documents/{documentId}`
- Fields:
  - `title`: string (e.g., "Process Map")
  - `content`: string (Markdown source)
  - `status`: string ("draft", "review", "approved")
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### `versions` (Sub-collection of `documents`)
- Path: `projects/{projectId}/documents/{documentId}/versions/{versionId}`
- Fields:
  - `content`: string (Markdown source at time of version)
  - `createdAt`: timestamp
  - `createdBy`: string (e.g., "admin" or "client")

## Rationale
Using a sub-collection for documents keeps them tightly coupled to the project, allowing for easier security rule enforcement and clean querying by `projectId`.
