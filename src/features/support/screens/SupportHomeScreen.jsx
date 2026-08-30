import { useState } from 'react';

import { OpenTicketPanel } from '../components/OpenTicketPanel';
import { SupportLayout } from '../components/SupportLayout';
import { TicketForm } from '../components/TicketForm';
import { useCreateTicket, useOwnTickets, useSupportCategories } from '../hooks/useSupport';
import { ticketSchema, toFieldErrors } from '../utils/supportSchemas';

const OPEN_STATUSES = new Set(['open', 'in_progress', 'escalated']);

/**
 * The authenticated help centre.
 *
 * Two first-class states rather than one plus an error. An account that already
 * holds an open ticket sees that ticket instead of a form, because the backend
 * permits exactly one non-terminal ticket per account and discovering that
 * through a rejected submit would throw away the message they had just written.
 */
export function SupportHomeScreen() {
  const tickets = useOwnTickets();
  const categories = useSupportCategories();
  const createTicket = useCreateTicket();
  const [draft, setDraft] = useState({ category: '', subject: '', body: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const openTicket = (tickets.data ?? []).find((ticket) => OPEN_STATUSES.has(ticket.status));

  // Appeal categories are excluded here. They need an audit row to appeal
  // against, which only a signed link supplies, and the backend refuses one on
  // any other path.
  const selectable = (categories.data ?? []).filter(
    (category) => category.isEnabled && !category.isAppeal
  );

  const submit = () => {
    const parsed = ticketSchema.safeParse({
      ...draft,
      category: draft.category || selectable[0]?.categoryKey || '',
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    createTicket.mutate(parsed.data, {
      onSuccess: () => setDraft({ category: '', subject: '', body: '' }),
    });
  };

  if (tickets.isLoading) {
    return (
      <SupportLayout title="Contact support">
        <div className="lx-support__card">Loading your requests.</div>
      </SupportLayout>
    );
  }

  if (openTicket) {
    return (
      <SupportLayout
        title="Your open request"
        subtitle="You can have one open request at a time. We will reply to this one first."
      >
        <OpenTicketPanel ticket={openTicket} />
      </SupportLayout>
    );
  }

  return (
    <SupportLayout
      title="Contact support"
      subtitle="Tell us what happened and we will get back to you by email."
    >
      {createTicket.isError ? (
        <div className="lx-support__notice lx-support__notice--error">
          {createTicket.error?.message ?? 'We could not send that. Try again shortly.'}
        </div>
      ) : null}
      <TicketForm
        subject={draft.subject}
        body={draft.body}
        errors={fieldErrors}
        disabled={createTicket.isPending}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        categorySlot={
          <div className="lx-support__field">
            <label className="lx-support__label" htmlFor="support-category">
              What is this about
            </label>
            <select
              id="support-category"
              className="lx-support__control"
              value={draft.category || selectable[0]?.categoryKey || ''}
              disabled={categories.isLoading || createTicket.isPending}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
            >
              {selectable.map((category) => (
                <option key={category.categoryKey} value={category.categoryKey}>
                  {category.displayName}
                </option>
              ))}
            </select>
            {fieldErrors.category ? (
              <p className="lx-support__error">{fieldErrors.category}</p>
            ) : null}
          </div>
        }
      />
      <div className="lx-support__actions">
        <button
          type="button"
          className="lx-support__button lx-support__button--primary"
          disabled={createTicket.isPending}
          onClick={submit}
        >
          {createTicket.isPending ? 'Sending' : 'Send request'}
        </button>
      </div>
    </SupportLayout>
  );
}

export default SupportHomeScreen;
