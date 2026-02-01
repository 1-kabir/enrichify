# Webset UI Components

This directory contains all the React components for the Enrichify webset interface.

## Overview

The webset UI provides a powerful, spreadsheet-like interface for managing and enriching datasets. It features inline editing, confidence score visualization, citations, version history, and AI-powered enrichment.

## Pages

### `/app/websets/page.tsx`
Main websets listing page with grid and list views. Features:
- Search and filter websets
- Grid/list view toggle
- Quick actions (edit, archive, delete)
- Status badges and metadata display

### `/app/websets/new/page.tsx`
Create new webset page. Features:
- Basic information form (name, description, status)
- Column definition builder
- Add/edit/delete columns
- Column type selection and validation

### `/app/websets/[id]/page.tsx`
Individual webset view/edit page. Features:
- Interactive table with inline editing
- Toolbar with actions (export, enrich, version history)
- Sidebar with column management and filters
- Real-time enrichment progress
- Provider selection for AI enrichment

## Components

### Core Table Components

#### `WebsetTable`
Main table component using @tanstack/react-table. Features:
- Sortable columns
- Row selection with checkboxes
- Inline cell editing
- Confidence score indicators
- Citation badges
- Responsive design with horizontal scroll

#### `WebsetCellComponent`
Individual cell component. Features:
- Color-coded confidence scores
- Citation count badges
- Hover tooltips with metadata
- Click to edit
- Animated confidence bar

#### `CellEditor`
Dialog for editing individual cells. Features:
- Value input
- Confidence score slider
- Citation viewer integration
- Metadata display

### UI Elements

#### `WebsetToolbar`
Action bar at the top of the webset page. Features:
- Add row button
- Enrich button
- Export button
- Version history button
- Bulk actions (delete, duplicate)
- Share menu

#### `WebsetSidebar`
Right sidebar for column and filter management. Features:
- Column list with visibility toggles
- Drag to reorder columns
- Add/edit columns
- Quick filters (high confidence, with citations, empty cells)
- Search filter

#### `ColumnEditor`
Dialog for adding/editing columns. Features:
- Column name input
- Type selection (text, number, url, email, date, boolean)
- Required toggle
- Default value input
- Delete column option

### Enrichment Components

#### `ProviderSelector`
Dialog for selecting LLM and search providers. Features:
- LLM provider dropdown
- Search provider dropdown (optional)
- Active provider filtering
- Provider type badges

#### `EnrichmentDialog`
Dialog for configuring enrichment. Features:
- Custom prompt input
- Row count display
- Column selection
- Provider confirmation

#### `EnrichmentProgress`
Progress cards for active enrichment jobs. Features:
- Status badges (pending, running, completed, failed)
- Progress bar
- Row completion count
- Animated updates

### Other Components

#### `CitationViewer`
Dialog showing citations for a cell. Features:
- Citation list with titles and snippets
- External links
- Provider badges
- Scrollable list

#### `VersionHistory`
Dialog showing version history. Features:
- Version list with timestamps
- Change descriptions
- Current version badge
- Restore previous version
- Animated list items

#### `ExportDialog`
Dialog for exporting websets. Features:
- Format selection (CSV, XLSX, Google Sheets)
- File name input
- Progress indicator
- Download handling

## Styling

All components use:
- **Tailwind CSS** for styling
- **shadcn/ui** component primitives
- **Framer Motion** for animations
- **Lucide React** for icons

### Design Principles

1. **Clean & Modern**: Minimal design inspired by Exa Websets
2. **Confidence Visualization**: Color-coded cells based on confidence scores
   - Green (≥80%): High confidence
   - Yellow (60-79%): Medium confidence
   - Red (<60%): Low confidence
3. **Progressive Disclosure**: Advanced features hidden in menus/dialogs
4. **Responsive**: Mobile-friendly with horizontal scroll for tables
5. **Smooth Animations**: Framer Motion for delightful micro-interactions

## Data Flow

```
User Action → Component Handler → API Call → State Update → UI Re-render
```

### Example: Cell Update
1. User clicks cell → `WebsetCellComponent` opens `CellEditor`
2. User edits value → State stored in `CellEditor`
3. User saves → `onSave` callback to parent
4. Parent calls `onCellUpdate` → API call to backend
5. Response updates local state
6. Table re-renders with new data

## Features

### Implemented
- ✅ Grid/list view for websets
- ✅ Create new webset with columns
- ✅ Interactive table with sorting
- ✅ Inline cell editing
- ✅ Confidence score visualization
- ✅ Citation badges and viewer
- ✅ Column management (add/edit/delete/toggle)
- ✅ Provider selection
- ✅ Enrichment dialog
- ✅ Enrichment progress tracking
- ✅ Export dialog (CSV, XLSX, Google Sheets)
- ✅ Version history viewer
- ✅ Responsive design
- ✅ Animations with Framer Motion

### To Implement
- ⬜ Actual API integration (currently using mock data)
- ⬜ Real-time updates via WebSocket
- ⬜ Drag-to-reorder columns
- ⬜ Advanced filters
- ⬜ Share functionality
- ⬜ Google Sheets integration
- ⬜ Bulk editing
- ⬜ Undo/redo

## Usage Example

```tsx
import { WebsetTable } from '@/components/websets';

function MyWebsetPage() {
  const [cells, setCells] = useState<WebsetCell[]>([]);
  
  const handleCellUpdate = async (
    row: number,
    column: string,
    value: string,
    confidenceScore?: number
  ) => {
    await api.updateCell({ row, column, value, confidenceScore });
    // Update local state
  };

  return (
    <WebsetTable
      columns={columns}
      cells={cells}
      rowCount={100}
      visibleColumns={visibleColumns}
      onCellUpdate={handleCellUpdate}
      onRowSelect={setSelectedRows}
    />
  );
}
```

## Dependencies

- `@tanstack/react-table` - Table component
- `@radix-ui/*` - UI primitives
- `framer-motion` - Animations
- `lucide-react` - Icons
- `next` - React framework
- `tailwindcss` - Styling

## TypeScript Types

All types are defined in `/types/webset.ts`:
- `Webset` - Main webset entity
- `WebsetCell` - Individual cell data
- `WebsetCitation` - Citation data
- `WebsetVersion` - Version history
- `ColumnDefinition` - Column metadata
- `LLMProvider` / `SearchProvider` - Provider info
- `EnrichmentJob` - Enrichment job status
- DTOs for API calls

## Performance Considerations

1. **Virtual Scrolling**: For large datasets, consider implementing virtual scrolling
2. **Memoization**: Components use `useMemo` and `useCallback` where appropriate
3. **Lazy Loading**: Load cells on-demand for very large websets
4. **Optimistic Updates**: Update UI immediately, sync with backend asynchronously

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management in dialogs
- Screen reader friendly
- High contrast mode support

## Testing

To test components:
```bash
npm run dev
# Navigate to http://localhost:3000/websets
```

## Future Enhancements

1. **Collaborative Editing**: Real-time multi-user editing
2. **Comments**: Cell-level comments and discussions
3. **Formulas**: Excel-like formulas for computed columns
4. **Charts**: Visualize data with charts and graphs
5. **Import**: Import from CSV, Excel, Google Sheets
6. **Templates**: Pre-built webset templates
