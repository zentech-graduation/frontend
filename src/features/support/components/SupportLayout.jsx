import { SUPPORT_CSS } from './supportStyles';

/**
 * The frame every help centre screen renders inside.
 *
 * Carries its own stylesheet the way the panel shell carries panelStyles, so a
 * screen reached with no session still styles correctly without depending on
 * any chrome having mounted first.
 */
export function SupportLayout({ title, subtitle, children, footer }) {
  return (
    <div className="lx-support">
      <style>{SUPPORT_CSS}</style>
      <div className="lx-support__frame">
        <header className="lx-support__head">
          <span className="lx-support__brand">Luvax</span>
          <h1 className="lx-support__title">{title}</h1>
          {subtitle ? <p className="lx-support__subtitle">{subtitle}</p> : null}
        </header>
        <div className="lx-support__body">{children}</div>
        {footer ? <footer className="lx-support__foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

/** The dashed block marking data that is stubbed while these are wireframes. */
export function WireNote({ children }) {
  return <div className="lx-support__wire">{children}</div>;
}

export default SupportLayout;
