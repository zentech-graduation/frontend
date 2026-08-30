/**
 * The subject and body pair, shared by all three entry paths.
 *
 * The category control is supplied by the caller rather than owned here,
 * because the three paths differ precisely in how a category is chosen: the
 * authenticated form offers every non-appeal category, the appeal path fixes it
 * from the token, and the public form offers only the categories the backend
 * marks as allowed there.
 */
export function TicketForm({ categorySlot, subject, body, onChange, disabled }) {
  return (
    <div className="lx-support__card">
      {categorySlot}
      <div className="lx-support__field">
        <label className="lx-support__label" htmlFor="support-subject">
          Subject
        </label>
        <input
          id="support-subject"
          className="lx-support__control"
          value={subject}
          maxLength={200}
          disabled={disabled}
          onChange={(event) => onChange({ subject: event.target.value })}
        />
        <p className="lx-support__hint">{subject.length} of 200 characters</p>
      </div>
      <div className="lx-support__field">
        <label className="lx-support__label" htmlFor="support-body">
          What happened
        </label>
        <textarea
          id="support-body"
          className="lx-support__control lx-support__textarea"
          value={body}
          maxLength={5000}
          disabled={disabled}
          onChange={(event) => onChange({ body: event.target.value })}
        />
        <p className="lx-support__hint">{body.length} of 5000 characters</p>
      </div>
    </div>
  );
}

export default TicketForm;
