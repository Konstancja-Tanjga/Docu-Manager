import { useState } from 'react';
import {
  Badge,
  DescriptionList,
  FilterChip,
  Input,
  SegmentedControl,
  StateBlock,
  Table,
  Toolbar,
  type Column,
} from '@bighat/ui';

import {
  OPERATION_LABELS,
  PERMISSION_RULES,
  ROLES,
  invalidRules,
  operationsForRole,
  predicateSummary,
  roleById,
  rulesForRole,
  type PermissionRule,
} from '../data/permissions';
import { formatCount, formatDate } from '../data/documents';

const VIEWS = [
  { value: 'rules', label: 'Rules' },
  { value: 'roles', label: 'Roles' },
];

export function Permissions({ currentRole }: { currentRole: string }) {
  const [view, setView] = useState('rules');
  const [search, setSearch] = useState('');
  const [showEnabled, setShowEnabled] = useState(true);
  const [showDisabled, setShowDisabled] = useState(true);
  const [showGrant, setShowGrant] = useState(true);
  const [showDeny, setShowDeny] = useState(true);

  const invalid = invalidRules();

  // PRM-10: filterable by enabled state and by type, searchable by name and
  // description. The reference design shows 354 rules; an unfiltered list of
  // those is not reviewable, so the controls exist even at seven.
  const needle = search.trim().toLowerCase();
  const rules = PERMISSION_RULES.filter((rule) => {
    const matchesState = rule.enabled ? showEnabled : showDisabled;
    const matchesType = rule.type === 'Grant' ? showGrant : showDeny;
    const matchesSearch =
      !needle ||
      rule.name.toLowerCase().includes(needle) ||
      rule.description.toLowerCase().includes(needle);
    return matchesState && matchesType && matchesSearch;
  });

  const filtering =
    Boolean(needle) || !showEnabled || !showDisabled || !showGrant || !showDeny;

  const columns: Column<PermissionRule>[] = [
    {
      key: 'name',
      header: 'Rule',
      sortable: true,
      width: 'minmax(220px, 2fr)',
      cell: (rule) => (
        <span className="dm-rule">
          <span className="dm-rule__name">{rule.name}</span>
          <span className="dm-rule__note">{rule.description}</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      width: '90px',
      // PRM-5: both directions expressible, and the type visible at a glance.
      // The word is the carrier; the tone is the redundant cue.
      cell: (rule) => (
        <Badge tone={rule.type === 'Deny' ? 'critical' : 'success'}>{rule.type}</Badge>
      ),
    },
    {
      key: 'enabled',
      header: 'State',
      sortable: true,
      width: '110px',
      // PRM-9: a disabled rule is visibly not enforced. "Disabled" is the
      // whole point of the column, so it is a word and not an absence.
      cell: (rule) =>
        rule.enabled ? (
          <Badge tone="neutral">Enforced</Badge>
        ) : (
          <Badge tone="warning">Disabled</Badge>
        ),
    },
    {
      key: 'operations',
      header: 'Operations',
      width: 'minmax(160px, 1fr)',
      cell: (rule) => rule.operations.map((op) => OPERATION_LABELS[op]).join(', '),
    },
    {
      key: 'roles',
      header: 'Roles',
      width: 'minmax(160px, 1fr)',
      cell: (rule) => (
        <span className="dm-rule__roles">
          {rule.roles.map((id) => {
            const role = roleById(id);
            if (!role) return <span key={id}>{id}</span>;
            return (
              <span key={id} className="dm-nowrap">
                {role.name}
                {role.missingFromDirectory && ' ⚠'}
              </span>
            );
          })}
        </span>
      ),
    },
    {
      key: 'predicate',
      header: 'Applies to',
      width: 'minmax(200px, 1fr)',
      // PRM-8: the plain-language summary belongs in the list, as text a
      // reviewer can check against intent.
      cell: (rule) => <span className="dm-rule__predicate">{predicateSummary(rule.predicate)}</span>,
    },
    {
      key: 'modifiedAt',
      header: 'Last changed',
      sortable: true,
      width: '150px',
      // PRM-11: when, and by whom.
      cell: (rule) => (
        <span className="dm-rule">
          <span>{formatDate(rule.modifiedAt)}</span>
          <span className="dm-rule__note">{rule.modifiedBy}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="dm-page">
      <div className="dm-page__header">
        <h1 className="dm-page__title">
          Permissions{' '}
          <span className="dm-count">
            ({formatCount(rules.length)} of {formatCount(PERMISSION_RULES.length)} rules)
          </span>
        </h1>

        <Toolbar
          ariaLabel="Filter and view permissions"
          flush
          end={
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
          {view === 'rules' && (
            <Input
              label="Search rules"
              placeholder="Name or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          )}
        </Toolbar>
      </div>

      {/*
        PRM-6 is stated here, in the interface, and not only in the source.
        A precedence a reviewer has to discover is a precedence nobody checked.
      */}
      <div className="dm-note">
        <p className="dm-note__title">Deny outranks Grant</p>
        <p className="dm-note__body">
          A document reachable by a grant rule and a deny rule at once is denied. Access is decided
          by what a document is — its metadata — never by where it is stored.
        </p>
      </div>

      {invalid.length > 0 && (
        /*
          PRM-2 and PRM-17: a rule naming a role that no longer exists is
          surfaced as invalid, and the affected rules are named. A rule that
          silently evaluates to nothing looks exactly like one that works.
        */
        <StateBlock
          state="error"
          scope="inline"
          title={
            invalid.length === 1
              ? 'One rule names a role that no longer exists'
              : `${invalid.length} rules name a role that no longer exists`
          }
          description={`${invalid
            .map((rule) => `${rule.id} ${rule.name}`)
            .join('; ')}. The role is retained and marked rather than dropped, and these rules confer nothing while it is missing.`}
        />
      )}

      {view === 'rules' ? (
        <>
          <div className="dm-chips" role="group" aria-label="Filter rules">
            <FilterChip
              label="Enforced"
              pressed={showEnabled}
              onClick={() => setShowEnabled((on) => !on)}
            />
            <FilterChip
              label="Disabled"
              pressed={showDisabled}
              onClick={() => setShowDisabled((on) => !on)}
            />
            <FilterChip label="Grant" pressed={showGrant} onClick={() => setShowGrant((on) => !on)} />
            <FilterChip label="Deny" pressed={showDeny} onClick={() => setShowDeny((on) => !on)} />
          </div>

          <Table
            caption="Content permission rules"
            hideCaption
            columns={columns}
            rows={rules}
            rowKey={(rule) => rule.id}
            responsive="scroll"
            state={
              rules.length === 0
                ? {
                    state: 'empty' as const,
                    title: filtering ? 'No rules match these filters' : 'No rules defined',
                    description: filtering
                      ? 'Clear a filter or broaden the search to see the rest.'
                      : 'Rules come from the directory integration.',
                  }
                : undefined
            }
          />
        </>
      ) : (
        <div className="dm-stack">
          {ROLES.map((role) => {
            const referenced = rulesForRole(role.id);
            const conferred = operationsForRole(role.id);
            return (
              <section key={role.id} className="dm-section" aria-labelledby={`role-${role.id}`}>
                <div className="dm-section__header">
                  <h2 className="dm-section__title" id={`role-${role.id}`}>
                    {role.name}
                  </h2>
                  {role.id === currentRole && <Badge tone="info">Acting as this role</Badge>}
                  {role.missingFromDirectory && <Badge tone="critical">Missing from directory</Badge>}
                </div>

                {/*
                  PRM-1: the source is shown and there is no rename or delete
                  control, because roles are read-only here. PRM-3 is the rest
                  of this list: which rules reference the role, and what they
                  confer — resolved against the rule set, not a folder tree.
                */}
                <DescriptionList
                  ariaLabel={`${role.name} details`}
                  items={[
                    { term: 'Source', value: `${role.source} · read-only in this product` },
                    {
                      term: 'Operations',
                      value: role.missingFromDirectory
                        ? 'None. The role is retained for review but confers nothing.'
                        : conferred.length > 0
                          ? conferred.map((op) => OPERATION_LABELS[op]).join(', ')
                          : 'None granted',
                      wide: true,
                    },
                    {
                      term: 'Referenced by',
                      value:
                        referenced.length > 0
                          ? referenced
                              .map((rule) => `${rule.id} ${rule.name}${rule.enabled ? '' : ' (disabled)'}`)
                              .join(' · ')
                          : 'No rules',
                      wide: true,
                    },
                  ]}
                />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
