import { useMutation, useQueryClient } from '@tanstack/react-query';

import { messageService } from '@/services/message.service';

import { conversationsKey } from './useConversations';

/**
 * Group membership and metadata changes.
 *
 * Every one re-reads the conversation list afterwards rather than patching it: a membership change
 * alters the participant list, the displayed name, and the avatar together, and the server is the
 * only source that has all three consistently. None of these is optimistic, because none of them is
 * frequent enough for the round trip to be felt, and a membership list that briefly lies about who
 * can read the conversation is worse than one that appears half a second late.
 */
export const useGroupMutations = (conversationId) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: conversationsKey });

  const createGroup = useMutation({
    mutationFn: (payload) => messageService.createGroup(payload),
    onSuccess: invalidate,
  });

  const rename = useMutation({
    mutationFn: (payload) => messageService.updateGroup(conversationId, payload),
    onSuccess: invalidate,
  });

  const addParticipants = useMutation({
    mutationFn: (userIds) => messageService.addParticipants(conversationId, userIds),
    onSuccess: invalidate,
  });

  const removeParticipant = useMutation({
    mutationFn: (userId) => messageService.removeParticipant(conversationId, userId),
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: () => messageService.leaveConversation(conversationId),
    onSuccess: invalidate,
  });

  return { createGroup, rename, addParticipants, removeParticipant, leave };
};
