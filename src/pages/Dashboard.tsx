import { Badge, Button, List, ListItem, StateBlock } from '@bighat/ui';

import { StatTile } from '../components/StatTile';
import { CURRENT_USER, statusTone, type ManagedDocument } from '../data/documents';

export function Dashboard({
  documents,
  onOpenDocument,
  onSeeAll,
}: {
  documents: ManagedDocument[];
  onOpenDocument: (id: string) => void;
  onSeeAll: () => void;
}) {
  const invoices = documents.filter((doc) => doc.type === 'Invoice').length;
  const orders = documents.filter((doc) => doc.type === 'Production Order').length;
  const pending = documents.filter((doc) => doc.status === 'Pending').length;

  const recent = [...documents]
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
    .slice(0, 5);

  const firstName = CURRENT_USER.split(' ')[0];

  return (
    <div className="dm-page">
      <div className="dm-page__header">
        <h1 className="dm-page__title">Welcome back, {firstName}</h1>
      </div>

      <div className="dm-stats">
        <StatTile label="Total documents" value={documents.length} />
        <StatTile label="Invoices" value={invoices} />
        <StatTile label="Production orders" value={orders} />
        {/* The accent is decorative; "Pending approval" is what carries it. */}
        <StatTile label="Pending approval" value={pending} accent="warning" />
      </div>

      <section className="dm-section" aria-labelledby="dm-recent">
        <div className="dm-section__header">
          <h2 className="dm-section__title" id="dm-recent">
            Recent activity
          </h2>
          {documents.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onSeeAll}>
              View all
            </Button>
          )}
        </div>

        {recent.length === 0 ? (
          /*
           * First use, not filtered-to-nothing — so the action onboards rather
           * than offering a way out of a filter that is not set.
           */
          <StateBlock
            state="empty"
            title="No documents yet"
            description="Upload an invoice or a production order and it will show up here."
          />
        ) : (
          /*
           * Records with a title, a supporting line and a status — what `List`
           * is for. It used to be a column of clickable Cards, which drew five
           * raised surfaces for one list, and whose `ariaLabel` replaced the
           * row's content — so the status was never announced. `ListItem`
           * keeps `trailing` outside the button, where it is read on its own.
           */
          <List variant="inset" ariaLabel="Recently uploaded documents">
            {recent.map((doc) => (
              <ListItem
                key={doc.id}
                title={doc.title}
                description={`${doc.linkedRecord} • ${doc.uploadDate}`}
                onSelect={() => onOpenDocument(doc.id)}
                trailing={<Badge tone={statusTone(doc.status)}>{doc.status}</Badge>}
              />
            ))}
          </List>
        )}
      </section>
    </div>
  );
}
