import {
  Badge,
  DescriptionList,
  StateBlock,
  Table,
  type Column,
} from '@bighat/ui';

import {
  RETENTION_POLICIES,
  dueForReview,
  governingPolicy,
  periodLabel,
  retentionOf,
  type RetentionPolicy,
} from '../data/retention';
import { formatCount, formatDate, type ManagedDocument } from '../data/documents';
import { partitionByRead } from '../data/permissions';

function stateTone(state: RetentionPolicy['state']): 'success' | 'neutral' | 'warning' {
  if (state === 'Active') return 'success';
  if (state === 'Draft') return 'neutral';
  return 'warning';
}

export function Retention({
  documents,
  currentRole,
  onOpenDocument,
}: {
  documents: ManagedDocument[];
  currentRole: string;
  onOpenDocument: (id: string) => void;
}) {
  // A policy screen must not become a way around the read rules.
  const { visible } = partitionByRead(documents, currentRole);
  const review = dueForReview(visible);

  const columns: Column<RetentionPolicy>[] = [
    {
      key: 'name',
      header: 'Policy',
      sortable: true,
      width: 'minmax(240px, 2fr)',
      cell: (policy) => (
        <span className="dm-rule">
          <span className="dm-rule__name">
            {policy.name} <span className="dm-nowrap">v{policy.version}</span>
          </span>
          <span className="dm-rule__note">{policy.description}</span>
        </span>
      ),
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      width: '110px',
      // RET-5: exactly one of three, and the word carries it.
      cell: (policy) => <Badge tone={stateTone(policy.state)}>{policy.state}</Badge>,
    },
    {
      key: 'period',
      header: 'Period',
      width: '120px',
      // RET-2: a value and a unit, never a free-text duration.
      cell: (policy) => periodLabel(policy),
    },
    {
      key: 'startEvent',
      header: 'Counts from',
      width: '160px',
      // RET-3: the policy names the event, because "7 years" alone is not a rule.
      cell: (policy) => policy.startEvent,
    },
    { key: 'appliesTo', header: 'Applies to', sortable: true, width: '150px', cell: (p) => p.appliesTo },
    {
      key: 'governs',
      header: 'Governs',
      align: 'end',
      width: '110px',
      // RET-7 made visible: a retired policy still holds documents.
      cell: (policy) =>
        formatCount(visible.filter((doc) => governingPolicy(doc)?.id === policy.id).length),
    },
    {
      key: 'modifiedAt',
      header: 'Last changed',
      sortable: true,
      width: '150px',
      cell: (policy) => (
        <span className="dm-rule">
          <span>{formatDate(policy.modifiedAt)}</span>
          <span className="dm-rule__note">{policy.modifiedBy}</span>
        </span>
      ),
    },
  ];

  const reviewColumns: Column<ManagedDocument>[] = [
    { key: 'title', header: 'Document', width: 'minmax(220px, 2fr)', cell: (doc) => doc.title },
    { key: 'type', header: 'Type', width: '150px', cell: (doc) => doc.type },
    {
      key: 'policy',
      header: 'Under',
      width: 'minmax(180px, 1fr)',
      cell: (doc) => {
        const { policy } = retentionOf(doc);
        return policy ? `${policy.name} v${policy.version}` : '—';
      },
    },
    {
      key: 'expiresOn',
      header: 'Expired',
      sortable: true,
      width: '140px',
      cell: (doc) => {
        const { expiresOn } = retentionOf(doc);
        return expiresOn ? formatDate(expiresOn) : '—';
      },
    },
    {
      key: 'open',
      header: 'Actions',
      align: 'end',
      width: '120px',
      cell: (doc) => (
        <button type="button" className="dm-link-button bh-focusable" onClick={() => onOpenDocument(doc.id)}>
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="dm-page">
      <div className="dm-page__header">
        <h1 className="dm-page__title">
          Retention <span className="dm-count">({formatCount(RETENTION_POLICIES.length)} policies)</span>
        </h1>
      </div>

      {/*
        RET-1 is the requirement this screen exists to honour, and RET-6 is the
        limit of what is built. Both stated here rather than left implicit.
      */}
      <div className="dm-note">
        <p className="dm-note__title">A policy is an object with a lifecycle, not a number on a type</p>
        <p className="dm-note__body">
          Draft governs nothing. Active governs documents. Retired stops new assignments while
          continuing to govern what it already holds — retirement never releases documents already
          counting. Policies are read-only here: there is no editor, so the constraints on editing
          an active policy are specified and not built.
        </p>
      </div>

      <Table
        caption="Retention policies"
        hideCaption
        columns={columns}
        rows={RETENTION_POLICIES}
        rowKey={(policy) => policy.id}
        responsive="scroll"
      />

      <section className="dm-section" aria-labelledby="dm-review">
        <div className="dm-section__header">
          <h2 className="dm-section__title" id="dm-review">
            Disposition review
          </h2>
          <Badge tone={review.length > 0 ? 'warning' : 'neutral'}>
            {formatCount(review.length)} waiting
          </Badge>
        </div>

        {/*
          RET-12: expiry moves a document into a review queue and does nothing
          else. It does not delete, and it does not stop being retained — the
          decision is a person's.
        */}
        <div className="dm-note">
          <p className="dm-note__title">Expiry is a queue, not a deletion</p>
          <p className="dm-note__body">
            A document whose period has elapsed appears here and is otherwise untouched. Nothing is
            destroyed without a person deciding. A document on legal hold never reaches this queue,
            and its computed expiry date is unchanged by the hold.
          </p>
        </div>

        {review.length === 0 ? (
          <StateBlock
            state="empty"
            scope="inline"
            title="Nothing is due for review"
            description="Every document you can read is either still inside its retention period, on legal hold, or has not started counting."
          />
        ) : (
          <Table
            caption="Documents due for disposition review"
            hideCaption
            columns={reviewColumns}
            rows={review}
            rowKey={(doc) => doc.id}
            responsive="scroll"
          />
        )}
      </section>
    </div>
  );
}

export function RetentionSummary({ doc }: { doc: ManagedDocument }) {
  const { state, policy, expiresOn, reason } = retentionOf(doc);
  return (
    <DescriptionList
      ariaLabel="Retention"
      items={[
        { term: 'Retention', value: state, wide: false },
        {
          term: 'Policy',
          value: policy ? `${policy.name} v${policy.version} · ${periodLabel(policy)} from ${policy.startEvent.toLowerCase()}` : 'No policy applies to this type',
          wide: true,
        },
        {
          term: state === 'On legal hold' ? 'Would expire' : 'Expires',
          value: expiresOn ? formatDate(expiresOn) : (reason ?? 'Not calculated'),
          wide: true,
        },
      ]}
    />
  );
}
