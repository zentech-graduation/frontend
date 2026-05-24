import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { messageService } from '@/services/message.service';
import { getNextCursor } from '@/utils/helpers';

import { conversationsKey, unreadCountKey } from './useConversations';

export const messagesKey = (conversationId) => ['conversations', conversationId, 'messages'];

/**
 * Cursor-paginated history for one conversation.
 *
 * Disabled until a conversation is selected, so the screen does not fire a request for a null id on
 * first render.
 */
export const useMessages = (conversationId) => {
  const query = useInfiniteQuery({
    queryKey: messagesKey(conversationId),
    queryFn: ({ pageParam = null, signal }) =>
      messageService.listMessages(conversationId, { cursor: pageParam, limit: 30, signal }),
    enabled: Boolean(conversationId),
    staleTime: 0,
    getNextPageParam: getNextCursor,
    initialPageParam: null,
  });

  const messages = (query.data?.pages || []).flatMap((page) => page?.data?.content || []);
  return { ...query, messages };
};

/** Replaces the first page's content, leaving the rest of the pagination intact. */
const withFirstPageContent = (old, updater) => {
  if (!old?.pages?.length) return old;
  const pages = [...old.pages];
  const first = pages[0];
  pages[0] = {
    ...first,
    data: { ...first.data, content: updater(first.data?.content || []) },
  };
  return { ...old, pages };
};

/**
 * Sends a message, showing it immediately and restoring the previous history if the request fails.
 *
 * Rollback is not optional: leaving an unsent message on screen tells the reader something happened
 * that did not.
 */
export const useSendMessage = (conversationId) => {
  const queryClient = useQueryClient();
  const key = messagesKey(conversationId);

  return useMutation({
    mutationFn: ({ body, idempotencyKey }) =>
      messageService.sendMessage(conversationId, body, idempotencyKey),
    onMutate: async ({ optimisticMessage }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      // History is newest first, so a new message belongs at the front.
      queryClient.setQueryData(key, (old) =>
        withFirstPageContent(old, (content) => [optimisticMessage, ...content])
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: conversationsKey });
    },
  });
};

/**
 * Sender-only soft delete. The message stays in history as a placeholder rather than vanishing.
 */
export const useDeleteMessage = (conversationId) => {
  const queryClient = useQueryClient();
  const key = messagesKey(conversationId);

  return useMutation({
    mutationFn: (messageId) => messageService.deleteMessage(conversationId, messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => {
        if (!old?.pages?.length) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              content: (page.data?.content || []).map((message) =>
                message.id === messageId ? { ...message, isDeleted: true, content: null } : message
              ),
            },
          })),
        };
      });
      return { previous };
    },
    onError: (_error, _messageId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: conversationsKey });
      queryClient.invalidateQueries({ queryKey: unreadCountKey });
    },
  });
};
