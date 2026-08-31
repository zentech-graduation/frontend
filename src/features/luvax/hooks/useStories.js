import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storyService } from '@/services/story.service';
import { STALE_TIME } from '@/config/constants';

const storyFeedKey = ['storyFeed'];

/**
 * The viewer's story tray: one entry per author with unseen state and stories
 * in playback order. Backs both the feed rail and the viewer's navigation
 * sequence, so both read the same cached list rather than issuing separate
 * requests for the same data.
 */
export const useStoryFeed = () => {
  const { data, isLoading } = useQuery({
    queryKey: storyFeedKey,
    queryFn: () => storyService.getStoryFeed(),
    staleTime: STALE_TIME.SHORT,
  });
  return { tray: data?.data || [], isLoading };
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => storyService.createStory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyFeedKey });
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId) => storyService.deleteStory(storyId),
    onSuccess: (_data, storyId) => {
      queryClient.setQueryData(storyFeedKey, (envelope) => {
        if (!envelope?.data) return envelope;
        return {
          ...envelope,
          data: envelope.data
            .map((entry) => ({
              ...entry,
              stories: entry.stories.filter((story) => story.id !== storyId),
            }))
            .filter((entry) => entry.stories.length > 0),
        };
      });
      queryClient.invalidateQueries({ queryKey: storyFeedKey });
    },
  });
};

/**
 * Fire-and-forget: a failed view record should never block or error the
 * viewer, so callers do not need to await or handle this mutation's outcome.
 */
export const useRecordStoryView = () => {
  return useMutation({
    mutationFn: (storyId) => storyService.recordStoryView(storyId),
  });
};

/**
 * Rewrites one story, wherever it sits in the tray, in place.
 *
 * The tray is the only cache stories live in - the viewer reads the same
 * `storyFeed` query the rail does - so a single tree walk is enough to reach
 * every rendering of a story at once.
 */
const patchCachedStory = (queryClient, storyId, patch) => {
  const previous = queryClient.getQueryData(storyFeedKey);
  // The cache holds the raw ApiResponse envelope, not the array useStoryFeed
  // unwraps it to, so the tray lives at envelope.data.
  queryClient.setQueryData(storyFeedKey, (envelope) => {
    if (!envelope?.data) return envelope;
    return {
      ...envelope,
      data: envelope.data.map((entry) => ({
        ...entry,
        stories: entry.stories.map((story) =>
          story.id === storyId ? { ...story, ...patch } : story
        ),
      })),
    };
  });
  return () => queryClient.setQueryData(storyFeedKey, previous);
};

export const useLikeStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, liked }) =>
      liked ? storyService.unlikeStory(storyId) : storyService.likeStory(storyId),
    onMutate: async ({ storyId, liked }) => {
      await queryClient.cancelQueries({ queryKey: storyFeedKey });
      const restore = patchCachedStory(queryClient, storyId, { liked: !liked });
      return { restore };
    },
    onError: (_error, _variables, context) => {
      context?.restore?.();
    },
  });
};
