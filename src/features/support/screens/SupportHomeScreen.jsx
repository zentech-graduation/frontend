import { useState } from 'react';

import { SupportLayout, WireNote } from '../components/SupportLayout';
import { TicketForm } from '../components/TicketForm';
import { WIRE_CATEGORIES, WIRE_OPEN_TICKET } from '../utils/wireframeFixtures';

import { OpenTicketPanel } from '../components/OpenTicketPanel';

/**
 * The authenticated help centre.
 *
 * Two first-class states rather than one plus an error. An account that already
 * holds an open ticket sees that ticket, because the backend permits exactly one
 * non-terminal ticket per account and discovering that through a rejected submit
 * would waste the message they had just written.
 */
export function SupportHomeScreen() {
  const [hasOpenTicket, setHasOpenTicket] = useState(false);
  const [draft, setDraft] = useState({ category: 'bug_report', subject: '', body: '' });

  if (hasOpenTicket) {
    return (
      <SupportLayout
        title="Your open request"
        subtitle="You can have one open request at a time. We will reply to this one first."
      >
        <OpenTicketPanel ticket={WIRE_OPEN_TICKET} />
        <WireNote>
          <strong>Wireframe.</strong> Toggling below stands in for the one-open-ticket check the
          backend performs on create.{' '}
          <button
            type="button"
            className="lx-support__button"
            onClick={() => setHasOpenTicket(false)}
          >
            Show the form instead
          </button>
        </WireNote>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout
      title="Contact support"
      subtitle="Tell us what happened and we will get back to you by email."
    >
      <TicketForm
        subject={draft.subject}
        body={draft.body}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        categorySlot={
          <div className="lx-support__field">
            <label className="lx-support__label" htmlFor="support-category">
              What is this about
            </label>
            <select
              id="support-category"
              className="lx-support__control"
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
            >
              {WIRE_CATEGORIES.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.displayName}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <div className="lx-support__actions">
        <button type="button" className="lx-support__button lx-support__button--primary">
          Send request
        </button>
      </div>
      <WireNote>
        <strong>Wireframe.</strong> Categories are stubbed. The backend holds them in
        support_category_configs but does not yet expose them through the vocabulary endpoint, so
        phase two either wires that up on the backend or reads the table another way.{' '}
        <button type="button" className="lx-support__button" onClick={() => setHasOpenTicket(true)}>
          Show the one-open-ticket state
        </button>
      </WireNote>
    </SupportLayout>
  );
}

export default SupportHomeScreen;
