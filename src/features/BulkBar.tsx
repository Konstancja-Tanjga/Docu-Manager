import { useState } from 'react';
import { Button, Input, Select, StateBlock, Toolbar, useToast } from '@bighat/ui';

import {
  EXPORT_FORMATS,
  buildManifest,
  buildMetadata,
  downloadText,
  planExport,
  planSummary,
  type ExportFormat,
} from '../data/export';
import { CURRENT_USER, MAX_TAGS, auditEntry, formatCount, type ManagedDocument } from '../data/documents';
import { can, roleById } from '../data/permissions';

/** `BLK-5`: where a bulk action has a maximum, the limit is stated inline. */
const MAX_BULK_TAG = 25;

type ItemResult = { id: string; title: string; ok: boolean; reason?: string };

export function BulkBar({
  selected,
  total,
  documents,
  currentRole,
  onChange,
  onClear,
}: {
  selected: Set<string>;
  /** The relevant total — `BLK-3` says the count is stated against it. */
  total: number;
  documents: ManagedDocument[];
  currentRole: string;
  onChange: (id: string, change: (doc: ManagedDocument) => ManagedDocument) => void;
  onClear: () => void;
}) {
  const { notify } = useToast();
  const [tag, setTag] = useState('');
  const [format, setFormat] = useState<ExportFormat>('CSV');
  /** `BLK-11`: the result is delivered in two places, and this is the one that survives. */
  const [results, setResults] = useState<{ action: string; items: ItemResult[] } | null>(null);

  const chosen = documents.filter((doc) => selected.has(doc.id));
  const roleName = roleById(currentRole)?.name ?? currentRole;

  // BLK-6: the bar lists every action the selection permits — so the questions
  // are asked per document, not once for the role.
  const taggable = chosen.filter((doc) => can(doc, currentRole, 'edit'));
  const plan = planExport(chosen, (doc) => can(doc, currentRole, 'download'));

  if (chosen.length === 0) return null;

  function applyTag() {
    const value = tag.trim().toLowerCase();
    if (!value) return;

    // BLK-9: bulk tagging validates against the same constraints as single-
    // document tagging — the tag cap and the duplicate check, per document.
    const items: ItemResult[] = chosen.map((doc) => {
      if (!can(doc, currentRole, 'edit')) {
        return { id: doc.id, title: doc.title, ok: false, reason: 'No rule grants edit on it' };
      }
      if (doc.tags.includes(value)) {
        return { id: doc.id, title: doc.title, ok: false, reason: 'Already carries this tag' };
      }
      if (doc.tags.length >= MAX_TAGS) {
        return { id: doc.id, title: doc.title, ok: false, reason: `Already at ${MAX_TAGS} tags` };
      }
      return { id: doc.id, title: doc.title, ok: true };
    });

    for (const item of items.filter((entry) => entry.ok)) {
      onChange(item.id, (current) => ({
        ...current,
        tags: [...current.tags, value],
        auditTrail: [auditEntry(`Tag "${value}" added in a bulk action`), ...current.auditTrail],
      }));
    }

    const changed = items.filter((entry) => entry.ok).length;
    setResults({ action: `Tag “${value}”`, items });
    setTag('');

    // BLK-13: refused for every item explains once, not once per item.
    if (changed === 0) {
      notify({
        tone: 'critical',
        title: 'Nothing was tagged',
        description: `None of the ${chosen.length} selected documents could take this tag. The reasons are listed below.`,
      });
      return;
    }
    notify({
      tone: 'success',
      title: `${formatCount(changed)} of ${formatCount(items.length)} tagged`,
      description: changed === items.length ? undefined : 'The rest are listed below with reasons.',
    });
  }

  function exportSelection() {
    const criteria = `Explicit selection of ${chosen.length} document(s)`;
    const stamp = new Date().toISOString().slice(0, 10);

    downloadText(
      `documanager-metadata-${stamp}.${format.toLowerCase()}`,
      buildMetadata(plan, format),
      format === 'CSV' ? 'text/csv' : 'application/json',
    );
    downloadText(
      `documanager-manifest-${stamp}.json`,
      buildManifest(plan, criteria, CURRENT_USER, roleName),
      'application/json',
    );

    /*
     * BDL-15: one audit entry per bulk download, recording actor, time,
     * selection criteria and the resulting count — not one per document, which
     * would bury the fact that an export happened at all.
     */
    const first = plan.included[0] ?? chosen[0];
    if (first) {
      onChange(first.id, (current) => ({
        ...current,
        auditTrail: [
          auditEntry(
            `Bulk download: ${criteria}, ${plan.included.length} included, ${plan.excluded.length} excluded`,
          ),
          ...current.auditTrail,
        ],
      }));
    }

    setResults({
      action: `Export (${format})`,
      items: [
        ...plan.included.map((doc) => ({ id: doc.id, title: doc.title, ok: true })),
        ...plan.excluded.map((entry) => ({ ...entry, ok: false })),
      ],
    });
    notify({
      tone: plan.excluded.length > 0 ? 'warning' : 'success',
      title: `Exported ${planSummary(plan)}`,
      description:
        plan.excluded.length > 0
          ? `${plan.excluded.length} excluded. The reasons are listed below.`
          : 'Metadata and manifest downloaded.',
    });
  }

  const failures = results?.items.filter((item) => !item.ok) ?? [];

  return (
    <div className="dm-bulk">
      <Toolbar ariaLabel="Actions for the selected documents" flush>
        {/* BLK-3: the count, against the relevant total, at all times. */}
        <p className="dm-bulk__count">
          <strong>{formatCount(chosen.length)}</strong> of {formatCount(total)} selected
        </p>

        <span className="dm-bulk__field">
          <Input
            label="Add a tag to the selection"
            description={`Up to ${MAX_BULK_TAG} documents at a time · ${taggable.length} of ${chosen.length} may be edited`}
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyTag();
              }
            }}
          />
        </span>
        <Button
          variant="secondary"
          onClick={applyTag}
          disabled={!tag.trim() || chosen.length > MAX_BULK_TAG}
          title={
            chosen.length > MAX_BULK_TAG
              ? `Bulk tagging takes at most ${MAX_BULK_TAG} documents. Narrow the selection.`
              : undefined
          }
        >
          Add tag
        </Button>

        <Select
          label="Export format"
          value={format}
          options={EXPORT_FORMATS.map((value) => ({ value, label: value }))}
          onChange={(event) => setFormat(event.target.value as ExportFormat)}
        />
        <Button
          variant="secondary"
          onClick={exportSelection}
          disabled={plan.included.length === 0}
          title={
            plan.included.length === 0
              ? `Nothing in this selection may be downloaded by ${roleName}`
              : undefined
          }
        >
          Export {planSummary(plan)}
        </Button>

        <Button variant="ghost" onClick={onClear}>
          Clear selection
        </Button>
      </Toolbar>

      {/*
        BDL-2 and BDL-4: what the export will contain and what it will leave
        out, before it is requested rather than as a surprise afterwards.
      */}
      {plan.excluded.length > 0 && (
        <div className="dm-note dm-note--withheld">
          <p className="dm-note__title">
            {plan.excluded.length === 1
              ? 'One selected document will not be exported'
              : `${formatCount(plan.excluded.length)} selected documents will not be exported`}
          </p>
          <p className="dm-note__body">
            {plan.excluded.map((entry) => `${entry.title} — ${entry.reason}`).join('; ')}.
          </p>
        </div>
      )}

      {/*
        BLK-11: the toast is transient, so the result also lands somewhere that
        survives it. BLK-12: a partial failure lists the documents that did not
        change, individually, with the reason for each — a batch-level "3 of 8
        failed" is not actionable.
      */}
      {results && failures.length > 0 && (
        <>
          <StateBlock
            state="error"
            scope="inline"
            title={`${results.action}: ${formatCount(failures.length)} of ${formatCount(results.items.length)} did not change`}
            description="Every one of them is named below, with its own reason."
            action={
              <Button size="sm" variant="secondary" onClick={() => setResults(null)}>
                Dismiss
              </Button>
            }
          />

          {/*
            BLK-12 wants the documents listed *individually*, so the list is
            visible rather than behind a disclosure. `StateBlock`'s
            `diagnostics` slot was tried and rejected: it is collapsed by
            default, which is right for a correlation id and wrong for the
            content the requirement is actually about. The description renders
            inside a `<p>`, so the list cannot go there either.
          */}
          <ul className="dm-failures">
            {failures.map((item) => (
              <li key={item.id}>
                <span className="dm-failures__name">{item.title}</span> — {item.reason}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
