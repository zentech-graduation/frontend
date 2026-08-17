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

/**
 * Fire-and-forget: a failed view record should never block or error the
 * viewer, so callers do not need to await or handle this mutation's outcome.
 */
export const useRecordStoryView = () => {
  return useMutation({
    mutationFn: (storyId) => storyService.recordStoryView(storyId),
  });
};
