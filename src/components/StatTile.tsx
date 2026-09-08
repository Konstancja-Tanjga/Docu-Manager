import { Card } from '@bighat/ui';

/**
 * LOCAL COMPOSITION — built from the system's `Card`, not a new primitive.
 *
 * Worth being precise about the difference: this is not a gap in the system the
 * way `Tabs` is. `Card` supplies the surface; all this adds is the label-above-
 * number arrangement, which is product layout. If a second product wants the
 * same tile, *then* it is a system component.
 *
 * `accent` is the `Card` prop, and it is decorative — the tone never carries the
 * meaning on its own. That is what the label is for.
 */
export function StatTile({
  label,
  value,
  accent = 'none',
}: {
  label: string;
  value: number;
  accent?: 'none' | 'info' | 'success' | 'warning' | 'critical';
}) {
  return (
    <Card accent={accent}>
      <p className="dm-stat__label">{label}</p>
      <p className="dm-stat__value">{value}</p>
    </Card>
  );
}
