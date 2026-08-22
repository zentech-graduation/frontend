import { useState } from 'react';

import { v } from '@/config/tokens';
import { LxBtn } from '@/features/luvax/components/primitives';
import { toast } from '@/features/luvax/components/Toast';

import { ViolationHistory } from './ViolationHistory';
import { WarnDialog } from './WarnDialog';
import { useDisciplineActions } from '../hooks/useDisciplineActions';
import { useVocabularies } from '../hooks/useVocabularies';
import { describeError } from '../lib/errors';

/**
 * An account's discipline record with the control to warn it: the violation
 * history plus the warn button and its dialog, as one drop-in panel used by both
 * the account moderation screen and the report detail. Sharing it means the
 * report detail closes the two items the previous phase deferred — the owner's
 * violation history and the warn-the-owner control — with the same code the
 * account screen uses, rather than a second copy.
 *
 * The warn control renders for both roles. A moderator may warn an ordinary
 * account; an ineligible (elevated) target is refused by the backend with a
 * specific code that is surfaced honestly. On success the history refetches
 * through the mutation's cache invalidation, so a new warning appears without a
 * reload.
 *
 * @param {string} userId the account this panel acts on
 */
export function AccountDisciplinePanel({ userId }) {
  const { reportReasons } = useVocabularies();
  const discipline = useDisciplineActions(userId);

  const [warnOpen, setWarnOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);

  const openWarn = () => {
    setFieldErrors(null);
    setWarnOpen(true);
  };
  const closeWarn = () => {
    setWarnOpen(false);
    setFieldErrors(null);
  };

  const submitWarn = ({ reasonKey, note }) => {
    setFieldErrors(null);
    discipline.warn.mutate(
      { reasonKey, note },
      {
        onSuccess: (data) => {
          // The active warning count is only available on the warn response, not
          // on any read (see accounts-contract-verification.md 3.5), so it is
          // surfaced here where it is an honest server fact rather than computed
          // from a partial page.
          const count = data?.activeWarningCount;
          const suffix = typeof count === 'number' ? ` — ${count} active warning${count === 1 ? '' : 's'} now` : '';
          toast(
            data?.strikeIssued
              ? `warning issued — a strike was applied${suffix}`
              : `warning issued${suffix}`
          );
          closeWarn();
        },
        onError: (err) => {
          const described = describeError(err);
          if (described.kind === 'field') {
            // Map VALIDATION_ERROR onto the form's per-field slots; a key that
            // matches no field is simply not shown, never crashed on.
            setFieldErrors({ reasonKey: described.fields?.reasonKey, note: described.fields?.note });
            return;
          }
          // A disabled reason, an ineligible (elevated) target, or a self-action
          // is a specific, honest message rather than a field error.
          if (described.kind !== 'silent') {
            toast(described.message);
          }
          closeWarn();
        },
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${v.borderSubtle}`, paddingBottom: 12 }}>
        <LxBtn variant="primary" size="sm" onClick={openWarn} disabled={discipline.warn.isPending}>
          issue warning
        </LxBtn>
      </div>

      <ViolationHistory userId={userId} />

      <WarnDialog
        open={warnOpen}
        reasons={reportReasons}
        busy={discipline.warn.isPending}
        serverFieldErrors={fieldErrors}
        onConfirm={submitWarn}
        onClose={closeWarn}
      />
    </div>
  );
}
