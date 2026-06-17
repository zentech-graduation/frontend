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
});
