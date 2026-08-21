import { useParams } from 'react-router-dom';

import { PageHeader, PanelCard } from '../components/PanelPage';
import { AccountDisciplinePanel } from '../components/AccountDisciplinePanel';
import { AccountContent } from '../components/AccountContent';
import { useResolveUsername, shortId } from '../hooks/useResolveUsername';

/**
 * An account's moderation context: its violation history, the control to warn
 * it, and its posts and comments. This is deliberately not the account detail
 * screen — there is no ban, suspend, unsuspend, role change, or force logout
 * here, and no profile — it hosts only this phase's account-scoped surfaces. It
 * is reached from a report's owner and from an audit row's target, both by URL,
 * so a specific account's record is a shareable link.
 */
export function AccountModerationScreen() {
  const { userId } = useParams();
  const { username, isLoading: nameLoading } = useResolveUsername(userId);

  const nameLabel = username ? `@${username}` : nameLoading ? `${shortId(userId)}…` : shortId(userId);

  return (
    <div>
      <PageHeader title="account" subtitle={nameLabel} />

      <PanelCard title="discipline history">
        <AccountDisciplinePanel userId={userId} />
      </PanelCard>

      <PanelCard title="content">
        <AccountContent userId={userId} />
      </PanelCard>
    </div>
  );
}
