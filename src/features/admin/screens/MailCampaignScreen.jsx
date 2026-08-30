import { useState } from 'react';

/**
 * The mail campaign composer. Administrator only.
 *
 * Wireframe stage: stubbed templates and a stubbed preview. Phase two replaces
 * the preview with a debounced call to the backend preview endpoint and renders
 * the HTML it returns.
 *
 * The preview is deliberately not rendered in the browser. There is exactly one
 * Markdown-to-HTML implementation and it lives on the server, which is what
 * makes the preview incapable of diverging from the mail that is actually sent,
 * and it means there is no second sanitization surface here to get wrong.
 *
 * A template is a sample. Selecting one copies its Markdown into the editor and
 * the edit is saved to the campaign, never back to the template, so the next
 * administrator to open it gets the original.
 */

const WIRE_TEMPLATES = [
  {
    templateKey: 'announcement',
    displayName: 'Product announcement',
    description: 'A general announcement to selected accounts.',
    body: '# Something new on Luvax\n\nHi {{username}},\n\nWe have been working on something we think you will like.\n',
  },
  {
    templateKey: 'policy_update',
    displayName: 'Policy update',
    description: 'Tell selected accounts that a policy has changed.',
    body: '# An update to our policies\n\nHi {{fullName}},\n\nWe are changing how we handle a few things.\n',
  },
];

const WIRE_RECIPIENTS = [
  { userId: 'u1', username: 'ada', optedOut: false },
  { userId: 'u2', username: 'grace', optedOut: true },
  { userId: 'u3', username: 'linus', optedOut: false },
];

const MAX_RECIPIENTS = 10;

export function MailCampaignScreen() {
  const [templateKey, setTemplateKey] = useState('announcement');
  const [body, setBody] = useState(WIRE_TEMPLATES[0].body);
  const [dirty, setDirty] = useState(false);
  const [recipients, setRecipients] = useState(WIRE_RECIPIENTS.slice(0, 2));
  const [error, setError] = useState(null);

  const selectTemplate = (key) => {
    if (dirty && !window.confirm('Discard your edits and load this template?')) {
      return;
    }
    const template = WIRE_TEMPLATES.find((t) => t.templateKey === key);
    setTemplateKey(key);
    setBody(template.body);
    setDirty(false);
  };

  const optedOutCount = recipients.filter((r) => r.optedOut).length;

  return (
    <div className="lx-admin-screen">
      <header className="lx-admin-screen__head">
        <h1 className="lx-admin-screen__title">mail campaigns</h1>
        <p className="lx-admin-screen__subtitle">
          Start from a sample, edit it, and schedule it. Templates are never changed by an edit.
        </p>
      </header>

      <div className="lx-support__wire" style={{ marginBottom: '16px' }}>
        <strong>Wireframe.</strong> Templates, recipients and the preview are stubbed. Phase two
        calls the backend for all three, and the preview specifically runs the same pipeline the
        send path uses.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '16rem minmax(0, 1fr)', gap: '16px' }}>
        <aside className="lx-support__card">
          <p className="lx-support__label" style={{ marginBottom: '12px' }}>
            Samples
          </p>
          {WIRE_TEMPLATES.map((template) => (
            <button
              key={template.templateKey}
              type="button"
              onClick={() => selectTemplate(template.templateKey)}
              className="lx-support__button"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: '8px',
                borderRadius: 'var(--radius-md)',
                background:
                  templateKey === template.templateKey
                    ? 'var(--lx-surface-sunken)'
                    : 'var(--lx-surface-raised)',
              }}
            >
              <span style={{ display: 'block', fontWeight: 600 }}>{template.displayName}</span>
              <span style={{ display: 'block', color: 'var(--lx-ink-2)', marginTop: '2px' }}>
                {template.description}
              </span>
            </button>
          ))}
          <p className="lx-support__hint" style={{ marginTop: '12px' }}>
            Editing a sample changes only this campaign.
          </p>
        </aside>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="lx-support__card">
            <div className="lx-support__field">
              <label className="lx-support__label" htmlFor="campaign-subject">
                Subject
              </label>
              <input id="campaign-subject" className="lx-support__control" defaultValue="" />
            </div>
            <div className="lx-support__field">
              <label className="lx-support__label" htmlFor="campaign-body">
                Body (Markdown)
              </label>
              <textarea
                id="campaign-body"
                className="lx-support__control lx-support__textarea"
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setDirty(true);
                }}
                style={{ minHeight: '14rem', fontFamily: 'var(--font-mono, monospace)' }}
              />
              <p className="lx-support__hint">
                Two personalisation tokens are available: <code>{'{{username}}'}</code> and{' '}
                <code>{'{{fullName}}'}</code>. Anything else is refused when you save.
              </p>
            </div>
            {error ? (
              <div className="lx-support__notice lx-support__notice--error">{error}</div>
            ) : null}
            <div className="lx-support__actions">
              <button
                type="button"
                className="lx-support__button"
                onClick={() =>
                  setError('Unknown variable {{email}}. Permitted: {{username}}, {{fullName}}')
                }
              >
                Show a rejected variable
              </button>
            </div>
          </div>

          <div className="lx-support__card">
            <p className="lx-support__label" style={{ marginBottom: '8px' }}>
              Preview
            </p>
            <div className="lx-support__wire">
              Rendered by the backend and returned as HTML. Debounced, and it respects its own rate
              limit. Tokens stay as tokens here rather than being resolved against one arbitrary
              recipient.
            </div>
          </div>

          <div className="lx-support__card">
            <p className="lx-support__label" style={{ marginBottom: '8px' }}>
              Recipients {recipients.length} of {MAX_RECIPIENTS}
            </p>
            {recipients.map((recipient) => (
              <div
                key={recipient.userId}
                className="lx-support__row"
                style={{ marginBottom: '6px' }}
              >
                <span>{recipient.username}</span>
                {recipient.optedOut ? (
                  <span className="lx-support__status">will be skipped, opted out</span>
                ) : null}
              </div>
            ))}
            {optedOutCount > 0 ? (
              <p className="lx-support__hint" style={{ marginTop: '8px' }}>
                {optedOutCount} of these has opted out of campaign email and will not receive this.
                They still receive account and moderation email.
              </p>
            ) : null}
            <div className="lx-support__actions">
              <button
                type="button"
                className="lx-support__button"
                disabled={recipients.length >= MAX_RECIPIENTS}
                onClick={() => setRecipients(WIRE_RECIPIENTS)}
              >
                Add recipient
              </button>
            </div>
          </div>

          <div className="lx-support__card">
            <div className="lx-support__field">
              <label className="lx-support__label" htmlFor="campaign-when">
                Send at
              </label>
              <input id="campaign-when" type="datetime-local" className="lx-support__control" />
              <p className="lx-support__hint">
                Times are shown in your local timezone. The campaign is claimed by a single sender,
                so it goes out once even if more than one instance is running.
              </p>
            </div>
            <div className="lx-support__actions">
              <button type="button" className="lx-support__button lx-support__button--primary">
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MailCampaignScreen;
