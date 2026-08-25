import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { LxIcon } from '@/components/ui/lx-icon';
import { ROUTES } from '@/config/constants';
import { v } from '@/config/tokens';

import { isUnknownCategory, resolveCategory, SETTINGS_GROUPS } from './settingsCatalog';
import {
  AccountCategory,
  BlockedCategory,
  NotificationsCategory,
  PrivacyCategory,
  ProfileCategory,
  RequestsCategory,
  SavedCategory,
} from './settingsCategories';
import { SETTINGS_CSS } from './settingsStyles';

const CATEGORY_VIEWS = {
  profile: ProfileCategory,
  notifications: NotificationsCategory,
  saved: SavedCategory,
  privacy: PrivacyCategory,
  requests: RequestsCategory,
  blocked: BlockedCategory,
  account: AccountCategory,
};

/**
 * Settings: a persistent list of groups beside the category that is open.
 *
 * The category lives in the path, not in component state, so every category has
 * its own address. Pasting one opens that category directly, the browser's back
 * button walks between categories rather than out of settings, and choosing a
 * category is a navigation rather than a screen replacement.
 *
 * Because the group list is one component instance that stays mounted while the
 * category changes, only the right region swaps: the list keeps its scroll
 * offset and issues no request when the selection moves.
 *
 * At a narrow width this is not a split. The stylesheet removes whichever
 * region is not in play, so the group list is the whole width until a category
 * is opened and the category is the whole width afterwards, with a way back.
 */
export function SettingsScreen() {
  const navigate = useNavigate();
  const { category: segment } = useParams();
  const category = resolveCategory(segment);
  const unknown = isUnknownCategory(segment);
  const regionRef = useRef(null);
  const headingRef = useRef(null);

  // When the open category changes, the region returns to its own top and takes
  // focus. Without this, choosing a second category from the list would leave
  // focus on the list row and the region scrolled to wherever the last one was
  // left.
  useEffect(() => {
    if (!category) return;
    // preventScroll matters: focusing the wrapper otherwise scrolls it into
    // view, which pulls the region past its own top padding and clips the
    // heading against the top edge.
    if (headingRef.current) headingRef.current.focus({ preventScroll: true });
    if (regionRef.current) regionRef.current.scrollTop = 0;
  }, [category?.id]);

  const CategoryView = category ? CATEGORY_VIEWS[category.id] : null;

  return (
    <>
      <style>{SETTINGS_CSS}</style>
      <div className={`lx-settings${category || unknown ? ' has-category' : ''}`}>
        <div className="lx-settings-groups">
          {/* Hidden at the narrow width, where the app bar already carries the
              word and two copies of it would stack. */}
          <h1
            className="lx-settings-title"
            style={{
              fontFamily: v.fontDisplay,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: v.ink,
              margin: '0 0 16px',
              paddingLeft: 8,
            }}
          >
            settings
          </h1>

          {SETTINGS_GROUPS.map((group) => (
            <div className="lx-settings-group" key={group.id}>
              <h2 className="lx-settings-group-title">{group.title}</h2>
              {group.categories.map((entry) => {
                const isOpen = category?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className="lx-settings-link"
                    aria-current={isOpen ? 'page' : undefined}
                    onClick={() => navigate(entry.path)}
                  >
                    <span className="lx-settings-link-label">{entry.label}</span>
                    <span className="lx-settings-link-hint">{entry.hint}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="lx-settings-category" ref={regionRef}>
          <button
            type="button"
            className="lx-settings-back"
            onClick={() => navigate(ROUTES.SETTINGS)}
          >
            <LxIcon name="chevronLeft" size={14} color={v.ink2} />
            all settings
          </button>

          {/* Takes focus when the open category changes; not a tab stop itself. */}
          <div ref={headingRef} tabIndex={-1} className="lx-settings-measure">
            {category && CategoryView ? (
              <>
                {category.ownsHeading ? null : (
                  <h2 className="lx-settings-heading">{category.label}</h2>
                )}
                <CategoryView />
              </>
            ) : (
              <div className="lx-settings-state">
                <LxIcon name={unknown ? 'alert' : 'settings'} size={22} color={v.ink2} />
                <h3>{unknown ? 'that setting has moved' : 'nothing open'}</h3>
                <p>
                  {unknown
                    ? 'the link you followed does not point at a setting any more. pick one from the list.'
                    : 'pick a setting from the list to change it here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
