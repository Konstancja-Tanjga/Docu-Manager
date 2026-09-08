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

import { BulkBar } from '../features/BulkBar';
import { partitionByRead, roleById } from '../data/permissions';
import { RETENTION_STATES, retentionOf } from '../data/retention';
import {
  DEFAULT_SORT,
  NO_FILTERS,
  SORT_KEYS,
  applyFilters,
  filtersAreActive,
  formatCount,
  formatDate,
  formatSize,
  naturalDirection,
  sortDocuments,
  statusTone,
  uniqueTags,
  type Filters,
  type ManagedDocument,
  type Sort,
  type SortKey,
} from '../data/documents';


const VIEWS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

/*
 * SRT-14: where the list is not a table there are no column headers, so the
 * same ordering has to be offered as an explicit control. Key and direction are
 * encoded in one value because they are one decision to the reader — "newest
 * first" is not two choices.
 *
 * Every key carries *both* directions, and that is not symmetry for its own
 * sake. The table's headers toggle direction on a second click, so a reader can
 * arrive here holding any key/direction pair; a pair with no matching option
 * left the `Select` rendering blank while the grid was genuinely sorted.
 */
const SORT_LABELS: Record<SortKey, { ascending: string; descending: string }> = {
  uploadDate: { descending: 'Uploaded — newest first', ascending: 'Uploaded — oldest first' },
  title: { ascending: 'Document — A to Z', descending: 'Document — Z to A' },
  type: { ascending: 'Type — A to Z', descending: 'Type — Z to A' },
  // Not "A to Z": the order is Pending, Rejected, Approved. SRT-3 calls the
  // alphabetical order of a status meaningless, and it is right.
  status: { ascending: 'Status — needs attention first', descending: 'Status — settled first' },
  fileSize: { descending: 'Size — largest first', ascending: 'Size — smallest first' },
  // Not alphabetical, for the same reason as status: "Due for review" is the
  // state that needs a person, so it leads.
  retention: {
    ascending: 'Retention — needs review first',
    descending: 'Retention — settled first',
  },
};

const SORT_OPTIONS = SORT_KEYS.flatMap((key) =>
  // Natural direction first, so the option a reader most likely wants is the
  // one they see before opening the list.
  ([naturalDirection(key), naturalDirection(key) === 'ascending' ? 'descending' : 'ascending'] as const).map(
    (direction) => ({ value: `${key}:${direction}`, label: SORT_LABELS[key][direction] }),
  ),
);

/** The design system's `Table` reports `key` as a plain string. */
function isSortKey(key: string): key is SortKey {
  return (SORT_KEYS as readonly string[]).includes(key);
}

export function Documents({
  documents,
  filters,
  onFiltersChange,
  onOpenDocument,
  onUpload,
  currentRole,
  onChangeDocument,
}: {
  documents: ManagedDocument[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenDocument: (id: string) => void;
  onUpload: () => void;
  currentRole: string;
  onChangeDocument: (id: string, change: (doc: ManagedDocument) => ManagedDocument) => void;
}) {
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /*
   * BLK-4: a selection survives paging within the same filter and is discarded
   * when the filter changes. There is no paging here, so the half that can be
   * honoured is the discard — a selection that outlived its filter would let a
   * bulk action reach documents the reader can no longer see.
   */
  const filterKey = `${filters.search}|${filters.type}|${filters.retention}|${filters.activeTags.join(',')}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    if (selected.size > 0) setSelected(new Set());
  }
  // SRT-5: the default is deliberate — the newest upload is what a reader
  // coming to a document library is looking for.
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  /*
   * Permissions run *before* the filters, because a document the reader may not
   * read is not a filter result they narrowed — it is not theirs to narrow.
   * `withheld` is the count XC-1 requires the interface to state.
   */
  const { visible, withheld } = partitionByRead(documents, currentRole);

  const tags = uniqueTags(visible);
  const filtered = sortDocuments(applyFilters(visible, filters), sort);
  const filtering = filtersAreActive(filters);
  const sortValue = `${sort.key}:${sort.direction}`;

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
    {
      key: 'fileSize',
      header: 'Size',
      sortable: true,
      align: 'end',
      width: '100px',
      cell: (doc) => formatSize(doc.fileSize),
    },
    {
      key: 'retention',
      header: 'Retention',
      sortable: true,
      width: '150px',
      cell: (doc) => {
        const { state, expiresOn } = retentionOf(doc);
        return (
          <span className="dm-rule">
            <span>{state}</span>
            {expiresOn && <span className="dm-rule__note">{formatDate(expiresOn)}</span>}
          </span>
        );
      },
    },
    {
      key: 'uploadDate',
      header: 'Uploaded',
      sortable: true,
      cell: (doc) => formatDate(doc.uploadDate),
    },
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
          Document library{' '}
          {/* FLT-7: matches against the total, so a filtered screen says what
              it is hiding rather than just how much is left. */}
          <span className="dm-count">
            ({formatCount(filtered.length)} of {formatCount(visible.length)})
          </span>
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
          {/*
            FLT-6 wants every active filter individually removable, and the
            design system's `placeholder` cannot do that: it renders
            `<option value="" disabled>`, which is correct for a required field
            and wrong for a filter — "any" is a legitimate choice, not the
            absence of one. So the empty value is a real option instead.
          */}
          <Select
            label="Type"
            value={filters.type}
            options={[
              { value: '', label: 'All types' },
              { value: 'Invoice', label: 'Invoice' },
              { value: 'Production Order', label: 'Production Order' },
            ]}
            onChange={(event) =>
              onFiltersChange({ ...filters, type: event.target.value as Filters['type'] })
            }
          />

          {/*
            RET-11: retention state filters like any other attribute. The
            values are the computed states, not a stored column.
          */}
          <Select
            label="Retention"
            value={filters.retention}
            options={[
              { value: '', label: 'Any state' },
              ...RETENTION_STATES.map((state) => ({ value: state, label: state })),
            ]}
            onChange={(event) =>
              onFiltersChange({ ...filters, retention: event.target.value })
            }
          />

          {/*
            SRT-14. Only in the grid: the table's own column headers are already
            the explicit control there, and two controls driving one sort is a
            way to show the reader a contradiction.
          */}
          {view === 'grid' && (
            <Select
              label="Sort by"
              value={sortValue}
              options={SORT_OPTIONS}
              onChange={(event) => {
                // Narrowed rather than asserted: the option values are built
                // from SORT_KEYS above, so an unknown key here would mean the
                // list and the type had drifted apart.
                const [key, direction] = event.target.value.split(':');
                if (!key || !isSortKey(key)) return;
                setSort({ key, direction: direction as Sort['direction'] });
              }}
            />
          )}

          {/*
            FLT-6 wants the individually removable controls *and* one way out of
            all of them. The chips and the type select are the former; this is
            the latter, and it only exists while there is something to clear.
          */}
          {filtering && (
            <Button variant="secondary" size="sm" onClick={() => onFiltersChange(NO_FILTERS)}>
              Clear filters
            </Button>
          )}
        </Toolbar>
      </div>

      {withheld > 0 && (
        /*
          XC-1: where permissions reduce a result set, the interface must say
          how many items were withheld. A silently shortened list is a
          correctness bug, not a security feature — the reader concludes the
          document is gone and files a ticket.
        */
        <div className="dm-note dm-note--withheld">
          <p className="dm-note__title">
            {withheld === 1
              ? 'One document is withheld from this role'
              : `${formatCount(withheld)} documents are withheld from this role`}
          </p>
          <p className="dm-note__body">
            Not shown because no rule grants {roleById(currentRole)?.name ?? currentRole} read
            access to them, or a deny rule removes it. The Permissions screen says which rule
            decides.
          </p>
        </div>
      )}

      {/*
        SRT-4: a sort change must be announced. The table's headers carry
        `aria-sort`, so they announce themselves; reordering the grid moves
        cards silently, and this is the grid's equivalent.
      */}
      <p aria-live="polite" className="bh-visually-hidden">
        {view === 'grid' ? `Sorted by ${SORT_LABELS[sort.key][sort.direction]}` : ''}
      </p>

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

      {view === 'list' && (
        <>
          {/*
            BLK-2 and BDL-3: selecting the whole filtered result is a distinct
            second action from the master checkbox, and it says which it did.
            With no paging the two coincide, so this is honest about being the
            same set rather than pretending to be a second scope.
          */}
          {filtered.length > 0 && selected.size !== filtered.length && (
            <div className="dm-row">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelected(new Set(filtered.map((doc) => doc.id)))}
              >
                Select all {formatCount(filtered.length)} filtered results
              </Button>
            </div>
          )}

          <BulkBar
            selected={selected}
            total={filtered.length}
            documents={filtered}
            currentRole={currentRole}
            onChange={onChangeDocument}
            onClear={() => setSelected(new Set())}
          />
        </>
      )}

      {view === 'list' ? (
        <Table
          caption="Documents"
          hideCaption
          columns={columns}
          rows={filtered}
          rowKey={(doc) => doc.id}
          /*
            BLK-1: the checkbox column and the tri-state select-all in the
            header are the design system's, not hand-rolled. The master
            checkbox selects what is loaded.
          */
          selection={{
            selected,
            onChange: setSelected,
            label: 'Select documents for a bulk action',
          }}
          sort={sort}
          onSortChange={(next) => {
            if (!isSortKey(next.key)) return;
            /*
             * SRT-3. The design system's `Table` starts every newly activated
             * column ascending, which gives oldest-first on a first click of
             * Uploaded. Toggling the column already sorted keeps the
             * direction the reader asked for; changing column applies that
             * column's own default.
             */
            setSort(
              next.key === sort.key
                ? { key: next.key, direction: next.direction }
                : { key: next.key, direction: naturalDirection(next.key) },
            );
          }}
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
                  <span>{formatDate(doc.uploadDate)}</span>
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
