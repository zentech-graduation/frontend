/**
 * The help centre's own layout CSS, kept inside the slice rather than added to
 * the global stylesheet, exactly as the panel keeps its own in panelStyles.js.
 *
 * Every colour references an --lx-* token and no raw hex appears here, so the
 * surface follows the theme toggle without a second palette to keep in step.
 * Spacing, radius and motion use the existing scale variables, which means the
 * global reduced-motion rule neutralises these transitions along with the rest.
 *
 * Muted text uses --lx-ink-2 rather than --lx-ink-3, following the divergence
 * the panel already records: --lx-ink-3 measures about 2.8:1 on the light base,
 * below the 4.5:1 this surface is held to. --lx-ink-3 stays for decorative
 * marks only.
 *
 * This layout is deliberately independent of both the panel shell and the
 * authenticated application chrome. Three of these screens are anonymous and
 * are reached by a banned account following a link from a mail client, so
 * nothing here may assume a session, a route guard or the auth store.
 */
export const SUPPORT_CSS = `
.lx-support {
  min-height: 100vh;
  background: var(--lx-base);
  color: var(--lx-ink);
  font-family: var(--font-body);
  display: flex;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}
.lx-support__frame { width: 100%; max-width: 40rem; }
.lx-support__head { margin-bottom: var(--space-6); }
.lx-support__brand {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--lx-ink-2);
  margin-bottom: var(--space-6);
}
.lx-support__title {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 var(--space-2);
}
.lx-support__subtitle {
  font-size: 13px;
  color: var(--lx-ink-2);
  margin: 0;
  line-height: 1.6;
}
.lx-support__body { display: grid; gap: var(--space-4); }
.lx-support__foot {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--lx-border);
  font-size: 12px;
  color: var(--lx-ink-2);
  line-height: 1.6;
}
.lx-support__card {
  border: 1px solid var(--lx-border);
  border-radius: var(--radius-lg);
  background: var(--lx-surface);
  padding: var(--space-6);
}
.lx-support__field { display: grid; gap: var(--space-2); margin-bottom: var(--space-4); }
.lx-support__label { font-size: 12px; font-weight: 500; color: var(--lx-ink); }
.lx-support__control {
  width: 100%;
  border: 1px solid var(--lx-border);
  border-radius: var(--radius-md);
  background: var(--lx-base);
  color: var(--lx-ink);
  padding: 8px 10px;
  font: inherit;
  font-size: 13px;
  transition: border-color var(--duration-fast) var(--ease-out);
}
.lx-support__control:hover { border-color: var(--lx-border-strong); }
.lx-support__control:focus-visible {
  outline: 2px solid var(--lx-accent);
  outline-offset: 1px;
  border-color: var(--lx-accent);
}
.lx-support__textarea { min-height: 9rem; resize: vertical; line-height: 1.6; }
.lx-support__hint { font-size: 12px; color: var(--lx-ink-2); line-height: 1.5; }
.lx-support__error { font-size: 12px; color: var(--lx-error-text); line-height: 1.5; }
.lx-support__row { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
.lx-support__actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); }
.lx-support__button {
  border: 1px solid var(--lx-border);
  border-radius: var(--radius-pill);
  background: var(--lx-surface-raised);
  color: var(--lx-ink);
  font-size: 12px;
  font-weight: 500;
  padding: 7px 16px;
  min-height: 30px;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}
.lx-support__button:hover:not(:disabled) { border-color: var(--lx-border-strong); }
.lx-support__button:focus-visible { outline: 2px solid var(--lx-accent); outline-offset: 1px; }
.lx-support__button:disabled { opacity: 0.55; cursor: not-allowed; }
.lx-support__button--primary {
  background: var(--lx-accent);
  border-color: var(--lx-accent);
  color: var(--lx-accent-text);
}
.lx-support__button--primary:hover:not(:disabled) { background: var(--lx-accent-dark); }
.lx-support__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--lx-ink-2);
  border: 1px solid var(--lx-border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.lx-support__notice {
  border: 1px solid var(--lx-border);
  border-left: 3px solid var(--lx-ink-2);
  border-radius: var(--radius-md);
  background: var(--lx-surface-sunken);
  padding: var(--space-4);
  font-size: 13px;
  line-height: 1.6;
}
.lx-support__notice--error { border-left-color: var(--lx-error); }
.lx-support__notice--success { border-left-color: var(--lx-success); }
.lx-support__response {
  border-left: 3px solid var(--lx-border);
  padding-left: var(--space-4);
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 13px;
}
.lx-support__meta {
  display: flex;
  gap: var(--space-4);
  font-size: 12px;
  color: var(--lx-ink-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.lx-support__wire {
  border: 1px dashed var(--lx-border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-size: 12px;
  color: var(--lx-ink-2);
  background: var(--lx-surface-sunken);
  line-height: 1.6;
}
.lx-support__wire strong { color: var(--lx-ink); font-weight: 600; }
`;

export default SUPPORT_CSS;
