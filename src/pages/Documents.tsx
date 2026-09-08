import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  FilterChip,
  SegmentedControl,
  Select,
  StateBlock,
  Table,
  Toolbar,
  type Column,
} from '@bighat/ui';

import {
  NO_FILTERS,
  applyFilters,
  filtersAreActive,
  statusTone,
  uniqueTags,
  type Filters,
  type ManagedDocument,
} from '../data/documents';

const VIEWS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

export function Documents({
  documents,
  filters,
  onFiltersChange,
  onOpenDocument,
  onUpload,
}: {
  documents: ManagedDocument[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenDocument: (id: string) => void;
  onUpload: () => void;
}) {
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
    key: 'uploadDate',
    direction: 'descending',
  });

  const tags = uniqueTags(documents);
  const filtered = sortRows(applyFilters(documents, filters), sort);
  const filtering = filtersAreActive(filters);

  const columns: Column<ManagedDocument>[] = [
    {
      key: 'title',
      header: 'Document',
      sortable: true,
      width: 'minmax(200px, 2fr)',
      cell: (doc) => doc.title,
    },
    { key: 'type', header: 'Type', sortable: true, cell: (doc) => doc.type },
    { key: 'linkedRecord', header: 'Linked record', cell: (doc) => doc.linkedRecord },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (doc) => <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>,
    },
    { key: 'uploadDate', header: 'Uploaded', sortable: true, cell: (doc) => doc.uploadDate },
    {
      key: 'open',
      header: 'Actions',
      align: 'end',
      width: '120px',
      /*
       * `Table` has no row-activation model, and it is right not to invent one —
       * a clickable row has no accessible name and no keyboard story. The action
       * is an explicit button, named for the row it belongs to.
       */
      cell: (doc) => (
        <Button variant="ghost" size="sm" onClick={() => onOpenDocument(doc.id)}>
          Open
        </Button>
      ),
    },
  ];

  /*
   * "Empty" is two screens. Filtered-to-nothing needs a way out of the filter;
   * a library with nothing in it needs an upload. Using one for both is the
   * mistake the design system calls out by name.
   */
  const emptyState = filtering
    ? {
        state: 'empty' as const,
        title: 'No documents match these filters',
        description: 'Try a broader search, or clear the filters to see everything.',
        action: (
          <Button size="sm" variant="secondary" onClick={() => onFiltersChange(NO_FILTERS)}>
            Clear filters
          </Button>
        ),
      }
    : {
        state: 'empty' as const,
        title: 'No documents yet',
        description: 'Upload an invoice or a production order to get started.',
        action: (
          <Button size="sm" onClick={onUpload}>
            Upload
          </Button>
        ),
      };

  return (
    <div className="dm-page">
      <div className="dm-page__header">
        <h1 className="dm-page__title">
          Document library <span className="dm-count">({filtered.length})</span>
        </h1>

        {/*
          `Toolbar` owns the grouping and the Home/End/arrow behaviour, so the
          filter and the view switch are one named region rather than two
          controls that happen to sit next to each other.
        */}
        <Toolbar
          ariaLabel="Filter and view documents"
          flush
          end={
            /*
             * The legend is shown, not hidden. Both controls in this toolbar
             * then carry a label above the control, which is what lines them
             * up — with the legend hidden, the segmented control floated
             * against the Select's label rather than its field.
             */
            <SegmentedControl
              legend="View"
              showLegend
              options={VIEWS}
              value={view}
              onChange={setView}
              size="sm"
            />
          }
        >
          {/*
            `Select` has no `hideLabel` — only `Input` does. So the label is
            visible here, which is the better default anyway.
          */}
          <Select
            label="Type"
            placeholder="All types"
            value={filters.type}
            options={[
              { value: 'Invoice', label: 'Invoice' },
              { value: 'Production Order', label: 'Production Order' },
            ]}
            onChange={(event) =>
              onFiltersChange({ ...filters, type: event.target.value as Filters['type'] })
            }
          />
        </Toolbar>
      </div>

      {tags.length > 0 && (
        <div className="dm-chips" role="group" aria-label="Filter by tag">
          {tags.map((tag) => (
            <FilterChip
              key={tag}
              label={`#${tag}`}
              pressed={filters.activeTags.includes(tag)}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  activeTags: filters.activeTags.includes(tag)
                    ? filters.activeTags.filter((active) => active !== tag)
                    : [...filters.activeTags, tag],
                })
              }
            />
          ))}
        </div>
      )}

      {view === 'list' ? (
        <Table
          caption="Documents"
          hideCaption
          columns={columns}
          rows={filtered}
          rowKey={(doc) => doc.id}
          sort={sort}
          onSortChange={setSort}
          state={filtered.length === 0 ? emptyState : undefined}
        />
      ) : filtered.length === 0 ? (
        <StateBlock {...emptyState} />
      ) : (
        <div className="dm-grid">
          {filtered.map((doc) => (
            <Card
              key={doc.id}
              onClick={() => onOpenDocument(doc.id)}
              ariaLabel={`Open ${doc.title}`}
              elevation="raised"
            >
              {/*
               * A Card with onClick is a <button>, so everything inside has to
               * be phrasing content — spans, not paragraphs.
               */}
              <span className="dm-doccard">
                <span className="dm-doccard__thumb" aria-hidden="true">
                  {doc.type === 'Invoice' ? 'Invoice' : 'Order'}
                </span>
                <span className="dm-doccard__title">{doc.title}</span>
                <span className="dm-doccard__meta">{doc.linkedRecord}</span>
                <span className="dm-doccard__footer">
                  <span>{doc.uploadDate}</span>
                  <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
                </span>
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function sortRows(
  rows: ManagedDocument[],
  sort: { key: string; direction: 'ascending' | 'descending' },
): ManagedDocument[] {
  const factor = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = String(a[sort.key as keyof ManagedDocument] ?? '');
    const right = String(b[sort.key as keyof ManagedDocument] ?? '');
    return left.localeCompare(right) * factor;
  });
}
