import axiosInstance from './axiosInstance';

const CONVERSATION_API_PATH = '/conversations';

/**
 * Lists the caller's conversations, most recent activity first.
 *
 * Each row already carries `unreadCount` and an embedded `lastMessage`, so the list screen needs
 * this call alone and never one request per conversation.
 *
 * @param {{cursor?: string, limit?: number, signal?: AbortSignal}} params
 * @returns {Promise<Object>} ApiResponse envelope wrapping a cursor page of conversation summaries.
 */
export const listConversations = async ({ cursor, limit = 20, signal } = {}) => {
  const response = await axiosInstance.get(CONVERSATION_API_PATH, {
    params: { cursor, limit },
    signal,
  });
  return response.data;
};

/**
 * Retrieves one conversation's detail, including its participant list.
 * @param {string} conversationId
 * @returns {Promise<Object>} ApiResponse envelope wrapping the conversation.
 */
export const getConversation = async (conversationId) => {
  const response = await axiosInstance.get(`${CONVERSATION_API_PATH}/${conversationId}`);
  return response.data;
};

/**
 * Resolves or creates the direct conversation with one other user.
 *
 * Safe to call repeatedly: the database carries a direct-conversation pair key, so a second call
 * for the same pair returns the existing conversation rather than creating a duplicate.
 *
 * @param {string} targetUserId
 * @returns {Promise<Object>} ApiResponse envelope wrapping the conversation.
 */
export const createDirect = async (targetUserId) => {
  const response = await axiosInstance.post(CONVERSATION_API_PATH, { targetUserId });
  return response.data;
};

/**
 * Creates a group conversation.
 * @param {{groupName: string, groupAvatarUrl?: string, participantIds: string[]}} payload
 * @returns {Promise<Object>} ApiResponse envelope wrapping the created conversation.
 */
export const createGroup = async ({ groupName, groupAvatarUrl, participantIds }) => {
  const response = await axiosInstance.post(`${CONVERSATION_API_PATH}/group`, {
    groupName,
    groupAvatarUrl,
    participantIds,
  });
  return response.data;
};

/**
 * Renames a group or replaces its avatar.
 * @param {string} conversationId
 * @param {{groupName?: string, groupAvatarUrl?: string}} payload
 * @returns {Promise<Object>} ApiResponse envelope wrapping the updated conversation.
 */
export const updateGroup = async (conversationId, { groupName, groupAvatarUrl }) => {
  const response = await axiosInstance.patch(`${CONVERSATION_API_PATH}/${conversationId}`, {
    groupName,
    groupAvatarUrl,
  });
  return response.data;
};

/**
 * Lists a conversation's participants, including former members.
 * @param {string} conversationId
 * @returns {Promise<Object>} ApiResponse envelope wrapping the participant list.
 */
export const listParticipants = async (conversationId) => {
  const response = await axiosInstance.get(
    `${CONVERSATION_API_PATH}/${conversationId}/participants`
  );
  return response.data;
};

/**
 * Adds members to a group.
 * @param {string} conversationId
 * @param {string[]} userIds
 * @returns {Promise<Object>} ApiResponse envelope.
 */
export const addParticipants = async (conversationId, userIds) => {
  const response = await axiosInstance.post(
    `${CONVERSATION_API_PATH}/${conversationId}/participants`,
    { userIds }
  );
  return response.data;
};

/**
 * Removes one member from a group.
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<Object>} ApiResponse envelope.
 */
export const removeParticipant = async (conversationId, userId) => {
  const response = await axiosInstance.delete(
    `${CONVERSATION_API_PATH}/${conversationId}/participants/${userId}`
  );
  return response.data;
};

/**
 * Leaves a conversation the caller is a member of.
 * @param {string} conversationId
 * @returns {Promise<Object>} ApiResponse envelope.
 */
export const leaveConversation = async (conversationId) => {
  const response = await axiosInstance.post(`${CONVERSATION_API_PATH}/${conversationId}/leave`);
  return response.data;
};

/**
 * Cursor-paginated message history for one conversation, newest first.
 * @param {string} conversationId
 * @param {{cursor?: string, limit?: number, signal?: AbortSignal}} params
 * @returns {Promise<Object>} ApiResponse envelope wrapping a cursor page of messages.
 */
export const listMessages = async (conversationId, { cursor, limit = 30, signal } = {}) => {
  const response = await axiosInstance.get(`${CONVERSATION_API_PATH}/${conversationId}/messages`, {
    params: { cursor, limit },
    signal,
  });
  return response.data;
};

/**
 * Sends a message.
 *
 * `idempotencyKey` travels as the `Idempotency-Key` header the server already honours, so a
 * retried or double-tapped send cannot create two messages.
 *
 * @param {string} conversationId
 * @param {{messageType: string, content?: string, mediaAssetId?: string, sharedPostId?: string,
 *          sharedStoryId?: string, replyToId?: string}} body
 * @param {string} [idempotencyKey]
 * @returns {Promise<Object>} ApiResponse envelope wrapping the created message.
 */
export const sendMessage = async (conversationId, body, idempotencyKey) => {
  const response = await axiosInstance.post(
    `${CONVERSATION_API_PATH}/${conversationId}/messages`,
    body,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined
  );
  return response.data;
};

/**
 * Sender-only soft delete. The message stays in history as a placeholder.
 * @param {string} conversationId
 * @param {string} messageId
 * @returns {Promise<Object>} ApiResponse envelope.
 */
export const deleteMessage = async (conversationId, messageId) => {
  const response = await axiosInstance.delete(
    `${CONVERSATION_API_PATH}/${conversationId}/messages/${messageId}`
  );
  return response.data;
};

/**
 * Marks every message in a conversation as read for the caller.
 * @param {string} conversationId
 * @returns {Promise<Object>} ApiResponse envelope.
 */
export const markRead = async (conversationId) => {
  const response = await axiosInstance.post(`${CONVERSATION_API_PATH}/${conversationId}/read`);
  return response.data;
};

/**
 * Total unread messages across every conversation; drives the navigation badge.
 * @returns {Promise<Object>} ApiResponse envelope wrapping the count.
 */
export const getUnreadCount = async () => {
  const response = await axiosInstance.get(`${CONVERSATION_API_PATH}/unread-count`);
  return response.data;
};

export const messageService = {
  listConversations,
  getConversation,
  createDirect,
  createGroup,
  updateGroup,
  listParticipants,
  addParticipants,
  removeParticipant,
  leaveConversation,
  listMessages,
  sendMessage,
  deleteMessage,
  markRead,
  getUnreadCount,
};

export default messageService;
