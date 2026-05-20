function MockPost({ tone, title, body }) {
  return (
    <article className="phone-card">
      <div className="phone-card__header">
        <span className="phone-card__avatar" style={{ background: tone }} />
        <div>
          <strong>{title}</strong>
          <p>{body}</p>
        </div>
      </div>
      <div className="phone-card__media" style={{ background: `linear-gradient(140deg, ${tone}, #f4ede4)` }} />
    </article>
  );
}

export default function AuthBrandPanel() {
  return (
    <aside className="brand-panel">
      <div className="brand-panel__inner">
        <span className="brand-panel__eyebrow">luvax - a small social network</span>
        <h2>
          pure social,
          <br />
          no noise.
        </h2>
        <p>
          Follow your people. See what they post. No public metrics, no infinite scroll, no algorithmic clutter.
        </p>
        <div className="brand-panel__actions">
          <span>available on web</span>
          <span>free forever</span>
          <span>open to all</span>
        </div>
      </div>

      <div className="phone-shell" aria-hidden="true">
        <div className="phone-shell__frame">
          <div className="phone-shell__screen">
            <div className="phone-shell__topbar">
              <span className="phone-shell__brand">luvax</span>
              <span className="phone-shell__status">9:41</span>
            </div>
            <div className="phone-shell__feed">
              <MockPost tone="#c8a97e" title="@sol.r" body="morning, window, coffee" />
              <MockPost tone="#7a9e7a" title="@jo.x" body="reading slowly" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
