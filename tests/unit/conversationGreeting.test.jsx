import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConversationGreeting } from '@/features/messages/components/ConversationGreeting';

describe('ConversationGreeting', () => {
  it('greets a conversation that has no messages', () => {
    render(<ConversationGreeting messageCount={0} />);
    expect(screen.getByText(/now friends/i)).toBeInTheDocument();
  });

  it('renders nothing once anything has been said', () => {
    // The greeting marks an empty thread. Leaving it above a real conversation would read as a
    // message somebody sent.
    const { container } = render(<ConversationGreeting messageCount={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the target instead of "now friends" for a conversation that does not exist yet', () => {
    // "You're now friends" would be false here - a profile's "message" button reaches this state
    // whether or not the two people follow each other at all.
    render(<ConversationGreeting messageCount={0} pending name="Priya" avatarUrl={null} />);
    expect(screen.queryByText(/now friends/i)).not.toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText(/start the conversation/i)).toBeInTheDocument();
  });
});
