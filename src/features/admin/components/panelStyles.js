/**
 * The panel's own layout CSS, kept inside the panel rather than added to the
 * global stylesheet. Every colour references an --lx-* token; no raw hex
 * appears here. Spacing and radius use the existing scale variables. Motion
 * uses the existing durations and easings, so the reduced-motion rule in the
 * global stylesheet neutralises these transitions along with the rest.
 *
 * The layout is desktop-first: a fixed navigation rail beside a content column.
 * Below a narrow breakpoint the rail becomes a horizontal bar at the top rather
 * than adopting the user-facing application's bottom navigation.
 */
export const PANEL_CSS = `
.lx-admin-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--lx-base);
  color: var(--lx-ink);
  font-family: var(--font-body);
}
.lx-admin-sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--lx-border);
  background: var(--lx-surface-sunken);
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.lx-admin-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
  color: var(--lx-ink);
}
.lx-admin-nav { display: flex; flex-direction: column; gap: var(--space-6); }
.lx-admin-nav-group { display: flex; flex-direction: column; gap: 2px; }
.lx-admin-nav-heading {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lx-ink-3);
  padding: 0 var(--space-2) var(--space-1);
}
.lx-admin-navlink {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 9px var(--space-3);
  border-radius: var(--radius-md);
  color: var(--lx-ink-2);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.lx-admin-navlink:hover { background: var(--lx-surface); color: var(--lx-ink); }
.lx-admin-navlink.is-active { background: var(--lx-accent-dim); color: var(--lx-accent-text); }
.lx-admin-badge {
  margin-left: auto;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--lx-accent);
  color: var(--lx-ink-inverse);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.lx-admin-main { display: flex; flex-direction: column; min-width: 0; }
.lx-admin-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--lx-border);
  background: var(--lx-glass-bg);
  backdrop-filter: blur(12px);
}
.lx-admin-signout {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px var(--space-3);
  border-radius: 999px;
  border: 1px solid var(--lx-border);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--lx-ink-2);
  transition: background var(--duration-fast) var(--ease-out);
}
.lx-admin-signout:hover { background: var(--lx-surface); }
.lx-admin-content {
  flex: 1;
  min-width: 0;
  padding: var(--space-6);
  max-width: 1120px;
  width: 100%;
}
.lx-admin-row:hover { background: var(--lx-surface); }
.lx-admin-panel-card {
  background: var(--lx-surface-sunken);
  border: 1px solid var(--lx-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
@media (max-width: 860px) {
  .lx-admin-shell { grid-template-columns: 1fr; }
  .lx-admin-sidebar {
    position: static;
    height: auto;
    flex-direction: row;
    align-items: center;
    gap: var(--space-4);
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--lx-border);
    padding: var(--space-3) var(--space-4);
  }
  .lx-admin-nav { flex-direction: row; gap: var(--space-4); }
  .lx-admin-nav-group { flex-direction: row; align-items: center; gap: var(--space-2); }
  .lx-admin-nav-heading { display: none; }
  .lx-admin-content { padding: var(--space-4); }
  .lx-admin-header { padding: var(--space-3) var(--space-4); }
}
`;
