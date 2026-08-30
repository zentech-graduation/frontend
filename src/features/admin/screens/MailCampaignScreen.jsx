import { useEffect, useMemo, useState } from 'react';

import { v } from '@/config/tokens';

import { AccountSearchPicker } from '../components/AccountSearchPicker';
import { LocalTime } from '../components/LocalTime';
import { PageHeader } from '../components/PanelPage';
import { RecordTable } from '../components/RecordTable';
import {
  useCampaignActions,
  useCampaignPreview,
  useCampaigns,
  useMailTemplates,
} from '../hooks/useMailCampaigns';

/** The backend's cap. Stated here so the count reads against it before a submit is refused. */
const MAX_RECIPIENTS = 10;

/** The only two tokens the backend accepts. Anything else is refused at save time. */
const VARIABLES = ['{{username}}', '{{fullName}}'];

const PREVIEW_DEBOUNCE_MS = 500;

const HISTORY_COLUMNS = [
  { key: 'subject', header: 'subject' },
  { key: 'status', header: 'status' },
  { key: 'recipientCount', header: 'recipients' },
  {
    key: 'scheduledAt',
    header: 'scheduled',
    render: (row) => (row.scheduledAt ? <LocalTime value={row.scheduledAt} /> : '-'),
  },
  {
    key: 'sentAt',
    header: 'sent',
    render: (row) => (row.sentAt ? <LocalTime value={row.sentAt} /> : '-'),
  },
];

/**
 * The mail campaign composer. Administrator only.
 *
 * A template is a sample. Selecting one copies its Markdown into the editor and
 * the edit is saved to the campaign, never back to the template, so the next
 * administrator to open the same sample gets the original.
 *
 * The preview is rendered by the backend, not here. There is exactly one
 * Markdown-to-HTML implementation and it lives on the server, which is what
 * makes the preview incapable of diverging from the mail that is actually sent
 * and what keeps a second sanitization surface out of the browser. The HTML this
 * screen injects has already passed the server's allowlist.
 */
export function MailCampaignScreen() {
  const templates = useMailTemplates();
  const campaigns = useCampaigns();
  const [campaignId, setCampaignId] = useState(null);
  const actions = useCampaignActions(campaignId);

  const [templateKey, setTemplateKey] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [localError, setLocalError] = useState('');

  // The preview is debounced rather than fired per keystroke, and the endpoint
  // carries its own rate limit, so a fast typist cannot turn an editor into a
  // request storm.
  const [debouncedBody, setDebouncedBody] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBody(body), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [body]);
  const preview = useCampaignPreview(debouncedBody, { enabled: true });

  const selectTemplate = (key) => {
    if (dirty && !window.confirm('discard your edits and load this sample?')) {
      return;
    }
    const template = (templates.data ?? []).find((item) => item.templateKey === key);
    if (!template) {
      return;
    }
    setTemplateKey(key);
    setBody(template.body);
    setDirty(false);
  };

  const addRecipient = (account) => {
    setLocalError('');
    if (recipients.some((item) => item.id === account.id)) {
      return;
    }
    if (recipients.length >= MAX_RECIPIENTS) {
      // Refused here as well as by the backend, so the cap is visible before a
      // round trip rather than only afterwards.
      setLocalError(`a campaign may not exceed ${MAX_RECIPIENTS} recipients.`);
      return;
    }
    setRecipients((prev) => [...prev, account]);
  };

  const save = () => {
    setLocalError('');
    if (recipients.length === 0) {
      setLocalError('add at least one recipient.');
      return;
    }
    const payload = {
      templateKey: templateKey || undefined,
      subject,
      body,
      recipientUserIds: recipients.map((item) => item.id),
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };
    const mutation = campaignId ? actions.update : actions.create;
    mutation.mutate(payload, {
      onSuccess: (saved) => {
        setCampaignId(saved.id);
        setDirty(false);
      },
    });
  };

  const failure = actions.create.error ?? actions.update.error ?? actions.schedule.error;
  const message = describeFailure(failure) ?? localError;

  const optedOutCount = useMemo(
    () => (campaignId ? 0 : recipients.filter((item) => item.emailOptOut).length),
    [campaignId, recipients]
  );

  return (
    <div>
      <PageHeader title="mail campaigns" />

      {message ? (
        <div className="lx-admin-panel-card" style={{ borderLeft: `3px solid ${v.error}` }}>
          {message}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '15rem minmax(0, 1fr)', gap: 16 }}>
        <aside className="lx-admin-panel-card">
          <Label>samples</Label>
          {templates.isLoading ? <p style={{ color: v.ink2, fontSize: 12 }}>loading.</p> : null}
          {(templates.data ?? []).map((template) => (
            <button
              key={template.templateKey}
              type="button"
              className="lx-admin-control"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 8,
                borderRadius: 8,
                background:
                  templateKey === template.templateKey ? v.surfaceSunken : v.surfaceRaised,
              }}
              onClick={() => selectTemplate(template.templateKey)}
            >
              <span style={{ display: 'block', fontWeight: 600 }}>{template.displayName}</span>
              <span style={{ display: 'block', color: v.ink2, marginTop: 2 }}>
                {template.description}
              </span>
            </button>
          ))}
          <p style={{ fontSize: 11, color: v.ink2, marginTop: 12 }}>
            editing a sample changes only this campaign. the sample itself is never rewritten.
          </p>
        </aside>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="lx-admin-panel-card" style={{ display: 'grid', gap: 12 }}>
            <Field id="campaign-subject" label="subject">
              <input
                id="campaign-subject"
                className="lx-admin-control"
                value={subject}
                maxLength={200}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setDirty(true);
                }}
              />
            </Field>
            <Field
              id="campaign-body"
              label="body (markdown)"
              hint={`personalisation: ${VARIABLES.join(' and ')}. anything else is refused when you save.`}
            >
              <textarea
                id="campaign-body"
                className="lx-admin-control"
                rows={12}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setDirty(true);
                }}
                style={{ fontFamily: v.fontMono }}
              />
            </Field>
          </div>

          <div className="lx-admin-panel-card">
            <Label>preview</Label>
            {preview.isFetching ? (
              <p style={{ color: v.ink2, fontSize: 12 }}>rendering.</p>
            ) : preview.isError ? (
              <p style={{ color: v.ink2, fontSize: 12 }}>
                {preview.error?.message ?? 'preview unavailable.'}
              </p>
            ) : preview.data?.html ? (
              // Already sanitized by the server's allowlist, and this is the same
              // HTML the send path produces. Rendering it here is what makes the
              // preview trustworthy; rendering Markdown in the browser instead
              // would create a second implementation to keep in step and a second
              // place to get escaping wrong.
              <div
                style={{ fontSize: 13, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: preview.data.html }}
              />
            ) : (
              <p style={{ color: v.ink2, fontSize: 12 }}>write a body to see it here.</p>
            )}
          </div>

          <div className="lx-admin-panel-card">
            <Label>
              recipients {recipients.length} of {MAX_RECIPIENTS}
            </Label>
            <AccountSearchPicker
              id="campaign-recipients"
              value={null}
              onSelect={addRecipient}
              placeholder="search accounts to add…"
            />
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
              {recipients.map((account) => (
                <li
                  key={account.id}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}
                >
                  <span>{account.username}</span>
                  <button
                    type="button"
                    className="lx-admin-control"
                    onClick={() =>
                      setRecipients((prev) => prev.filter((item) => item.id !== account.id))
                    }
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
            {optedOutCount > 0 ? (
              <p style={{ fontSize: 11, color: v.ink2, marginTop: 8 }}>
                {optedOutCount} of these has opted out of campaign email and will be skipped. they
                still receive account and moderation email.
              </p>
            ) : null}
          </div>

          <div className="lx-admin-panel-card" style={{ display: 'grid', gap: 12 }}>
            <Field
              id="campaign-when"
              label="send at"
              hint="entered and shown in your local timezone, and sent once: the sender claims each campaign, so a second instance cannot send it again."
            >
              <input
                id="campaign-when"
                type="datetime-local"
                className="lx-admin-control"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="lx-admin-control"
                disabled={actions.create.isPending || actions.update.isPending}
                onClick={save}
              >
                {campaignId ? 'save draft' : 'create draft'}
              </button>
              <button
                type="button"
                className="lx-admin-control"
                disabled={!campaignId || actions.schedule.isPending}
                onClick={() => actions.schedule.mutate(campaignId)}
              >
                schedule
              </button>
            </div>
          </div>

          <div className="lx-admin-panel-card">
            <Label>history</Label>
            <RecordTable
              columns={HISTORY_COLUMNS}
              rows={campaigns.data ?? []}
              keyField="id"
              isLoading={campaigns.isLoading}
              isError={campaigns.isError}
              errorMessage={campaigns.error?.message}
              onRetry={campaigns.refetch}
              emptyIcon="clock"
              emptyTitle="no campaigns yet"
              emptyHint="a campaign appears here once it is drafted."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <span
      style={{
        display: 'block',
        fontFamily: v.fontMono,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: v.ink2,
        marginBottom: 8,
      }}
    >
      {children}
    </span>
  );
}

function Field({ id, label, hint, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: v.fontMono,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: v.ink2,
        }}
      >
        {label}
      </label>
      {children}
      {hint ? <span style={{ fontSize: 11, color: v.ink2, lineHeight: 1.5 }}>{hint}</span> : null}
    </div>
  );
}

/**
 * Turns a refusal into the sentence that explains it.
 *
 * The unknown-variable case names the offending token, because the backend
 * raises it at save time precisely so the author can fix it before anything is
 * scheduled.
 */
function describeFailure(error) {
  if (!error) {
    return null;
  }
  switch (error.code) {
    case 'CAMPAIGN_UNKNOWN_VARIABLE':
      return error.message ?? 'the body uses a variable that is not permitted.';
    case 'CAMPAIGN_TOO_MANY_RECIPIENTS':
      return `a campaign may not exceed ${MAX_RECIPIENTS} recipients.`;
    case 'CAMPAIGN_NO_RECIPIENTS':
      return 'add at least one recipient.';
    case 'CAMPAIGN_NOT_EDITABLE':
      return 'this campaign has left draft and its body is now the record of what was sent.';
    case 'CAMPAIGN_INVALID_TRANSITION':
      return 'this campaign cannot move to that state.';
    default:
      return error.message ?? 'that did not work. try again.';
  }
}

export default MailCampaignScreen;
