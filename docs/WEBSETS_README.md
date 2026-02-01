# Webset Management System

## Overview

The Webset Management System is a comprehensive module for managing structured data with version history, citations, and export capabilities. It provides a complete solution for data enrichment with audit trails and collaborative features.

## Features

### 1. Webset Management
- Create websets with custom column definitions
- Update webset metadata and structure
- Version control for all changes
- Support for draft, active, and archived statuses
- Row and column-based data organization

### 2. Version History
- Automatic versioning on every change
- Complete snapshot of data at each version
- Change descriptions for audit trails
- Ability to revert to any previous version
- User tracking for all changes

### 3. Cell Management
- Update individual cells with metadata
- Confidence scores for data quality
- Automatic version creation on cell updates
- Support for custom metadata per cell

### 4. Citations
- Link sources to specific cells
- Store search provider information
- Content snippets for reference
- URL tracking for verification

### 5. Export
- CSV export
- XLSX (Excel) export
- Google Sheets integration
- Async processing for large datasets
- Export status tracking

### 6. Enrichment
- Async job processing via BullMQ
- LLM and search provider integration
- Batch cell enrichment
- Progress tracking
- Citation generation during enrichment

## Architecture

### Database Entities

#### Webset
Main entity for storing webset metadata:
- `id`: UUID primary key
- `name`: Webset name
- `description`: Optional description
- `userId`: Owner user ID
- `columnDefinitions`: JSONB array of column definitions
- `status`: Enum (draft, active, archived)
- `currentVersion`: Current version number
- `rowCount`: Number of rows

#### WebsetVersion
Stores version snapshots:
- `id`: UUID primary key
- `websetId`: Reference to webset
- `version`: Version number
- `data`: JSONB snapshot of complete webset state
- `changedBy`: User who made the change
- `changeDescription`: Description of changes
- `createdAt`: Timestamp

#### WebsetCell
Individual cell data:
- `id`: UUID primary key
- `websetId`: Reference to webset
- `versionId`: Optional reference to version
- `row`: Row number
- `column`: Column ID
- `value`: Cell value (text)
- `confidenceScore`: Data quality score (0-1)
- `metadata`: JSONB for additional data
- Unique constraint on (websetId, row, column)

#### WebsetCitation
Source citations for cells:
- `id`: UUID primary key
- `cellId`: Reference to cell
- `url`: Source URL
- `title`: Page title
- `contentSnippet`: Relevant content excerpt
- `searchProviderId`: Reference to search provider
- `createdAt`: Timestamp

#### WebsetExport
Export job tracking:
- `id`: UUID primary key
- `websetId`: Reference to webset
- `userId`: User who requested export
- `format`: Enum (csv, xlsx, gsheet)
- `exportUrl`: URL to exported file/sheet
- `status`: Enum (pending, processing, completed, failed)
- `errorMessage`: Error details if failed

## API Endpoints

### Websets

#### Create Webset
```
POST /websets
Authorization: Bearer <token>

Request Body:
{
  "name": "Company Research",
  "description": "Research data for companies",
  "columnDefinitions": [
    {
      "id": "company_name",
      "name": "Company Name",
      "type": "text",
      "required": true
    },
    {
      "id": "website",
      "name": "Website",
      "type": "url"
    }
  ],
  "status": "draft"
}

Response: Webset object
```

#### List Websets
```
GET /websets
Authorization: Bearer <token>

Response: Array of websets
```

#### Get Webset
```
GET /websets/:id
Authorization: Bearer <token>

Response: Webset object with relations
```

#### Update Webset
```
PATCH /websets/:id
Authorization: Bearer <token>

Request Body:
{
  "name": "Updated Name",
  "status": "active"
}

Response: Updated webset
```

#### Delete Webset
```
DELETE /websets/:id
Authorization: Bearer <token>

Response: 200 OK
```

#### Update Cell
```
POST /websets/:id/cells
Authorization: Bearer <token>

Request Body:
{
  "row": 0,
  "column": "company_name",
  "value": "Acme Corp",
  "confidenceScore": 1.0,
  "metadata": {
    "source": "manual"
  },
  "changeDescription": "Added company name"
}

Response: Updated cell object
```

#### Get Cells
```
GET /websets/:id/cells
Authorization: Bearer <token>

Response: Array of cells with citations
```

#### Get Versions
```
GET /websets/:id/versions
Authorization: Bearer <token>

Response: Array of versions
```

#### Revert to Version
```
POST /websets/:id/revert
Authorization: Bearer <token>

Request Body:
{
  "version": 3,
  "changeDescription": "Reverted due to error"
}

Response: Updated webset
```

### Citations

#### Create Citation
```
POST /citations
Authorization: Bearer <token>

Request Body:
{
  "cellId": "uuid",
  "url": "https://example.com",
  "title": "Example Page",
  "contentSnippet": "Relevant content...",
  "searchProviderId": "uuid"
}

Response: Citation object
```

#### Create Batch Citations
```
POST /citations/batch
Authorization: Bearer <token>

Request Body: Array of citation objects

Response: Array of created citations
```

#### Get Citations by Cell
```
GET /citations/cell/:cellId
Authorization: Bearer <token>

Response: Array of citations
```

#### Get Citation
```
GET /citations/:id
Authorization: Bearer <token>

Response: Citation object
```

#### Delete Citation
```
DELETE /citations/:id
Authorization: Bearer <token>

Response: 200 OK
```

### Export

#### Create Export
```
POST /export/websets/:websetId
Authorization: Bearer <token>

Request Body:
{
  "format": "csv|xlsx|gsheet",
  "googleAccessToken": "token" // Required for gsheet format
}

Response: 
{
  "id": "uuid",
  "status": "pending",
  ...
}
```

#### List Exports
```
GET /export
Authorization: Bearer <token>

Response: Array of exports
```

#### Get Export
```
GET /export/:id
Authorization: Bearer <token>

Response: Export object with status and URL
```

### Enrichment

#### Enrich Cells
```
POST /enrichment/enrich
Authorization: Bearer <token>

Request Body:
{
  "websetId": "uuid",
  "column": "company_industry",
  "rows": [0, 1, 2, 3],
  "prompt": "Find the industry for this company",
  "llmProviderId": "uuid",
  "searchProviderId": "uuid"
}

Response:
{
  "jobId": "job-uuid"
}
```

#### Get Job Status
```
GET /enrichment/jobs/:jobId
Authorization: Bearer <token>

Response:
{
  "jobId": "job-uuid",
  "state": "completed",
  "progress": 100,
  "result": {
    "enrichedCells": 4,
    "totalRows": 4
  }
}
```

## Usage Examples

### Creating a Webset and Adding Data

```typescript
// 1. Create a webset
const webset = await fetch('/websets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Tech Companies',
    columnDefinitions: [
      { id: 'name', name: 'Company Name', type: 'text', required: true },
      { id: 'website', name: 'Website', type: 'url' },
      { id: 'industry', name: 'Industry', type: 'text' }
    ]
  })
});

// 2. Add data to cells
await fetch(`/websets/${webset.id}/cells`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    row: 0,
    column: 'name',
    value: 'Google'
  })
});

// 3. Enrich data
const enrichJob = await fetch('/enrichment/enrich', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    websetId: webset.id,
    column: 'industry',
    rows: [0],
    prompt: 'What industry is this company in?'
  })
});

// 4. Export to Excel
await fetch(`/export/websets/${webset.id}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'xlsx'
  })
});
```

### Version Control

```typescript
// Get all versions
const versions = await fetch(`/websets/${websetId}/versions`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Revert to previous version
await fetch(`/websets/${websetId}/revert`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    version: 3,
    changeDescription: 'Reverting to fix data error'
  })
});
```

## Dependencies

The system uses the following key dependencies:
- **NestJS**: Framework for building the API
- **TypeORM**: ORM for database operations
- **BullMQ**: Job queue for async processing
- **XLSX**: Excel file generation
- **googleapis**: Google Sheets integration
- **google-auth-library**: OAuth2 authentication for Google

## Configuration

Required environment variables:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=enrichify
DATABASE_PASSWORD=password
DATABASE_NAME=enrichify

REDIS_HOST=localhost
REDIS_PORT=6379
```

## Security

- All endpoints require JWT authentication
- Users can only access their own websets
- Exports are user-scoped
- Citations track source providers

## Performance Considerations

1. **Batch Operations**: Use batch citation creation for efficiency
2. **Async Processing**: Enrichment and export run asynchronously
3. **Indexing**: Unique index on (websetId, row, column) for fast cell lookups
4. **Pagination**: Consider implementing pagination for large websets

## Future Enhancements

- Real-time collaboration with WebSockets
- Cell comments and discussions
- Advanced search within websets
- Data validation rules
- Automated enrichment triggers
- Webhook notifications for export completion
- Sharing and permissions management
