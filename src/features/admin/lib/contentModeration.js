/**
 * The one place the restore success message is composed, so the report detail
 * and the account content screen word it identically.
 *
 * Post restore and comment restore have different response shapes: a post
 * restore returns `{ action, droppedHashtags }`, where a non-empty
 * `droppedHashtags` names hashtags that stayed banned and were dropped from the
 * restored post; a comment restore returns a bare action with no such wrapper.
 * The dropped tags are named only for a post and only when the array is
 * non-empty, so a restore with nothing dropped shows no empty "dropped" text.
 *
 * @param {'post'|'comment'} targetType which content was restored
 * @param {Object} data the restore response payload
 * @returns {string} the success message to surface
 */
export const restoreSuccessMessage = (targetType, data) => {
  const dropped =
    targetType === 'post' && Array.isArray(data?.droppedHashtags) ? data.droppedHashtags : [];
  if (dropped.length > 0) {
    return `${targetType} restored. dropped: ${dropped.map((tag) => `#${tag}`).join(', ')}`;
  }
  return `${targetType} restored`;
};
