import { axiosClient } from './axiosClient';

const MEDIA_API_PATH = '/media';

export const mediaService = {
  /**
   * Request a pre-signed URL for direct upload
   * @param {Object} data - { mediaType: 'IMAGE' | 'VIDEO', mimeType: string, fileSize: number }
   * @returns {Promise<Object>} - The response data containing uploadUrl and storageKey
   */
  async createUploadUrl(data) {
    const response = await axiosClient.post(`${MEDIA_API_PATH}/upload`, data);
    return response.data?.data || response.data;
  },

  /**
   * Confirm the upload is complete
   * @param {Object} data - { storageKey: string, mediaType: 'IMAGE' | 'VIDEO', mimeType: string, fileSize: number, width: number, height: number, duration?: number }
   * @returns {Promise<Object>} - The response data containing the mediaAssetId
   */
  async completeUpload(data) {
    const response = await axiosClient.post(`${MEDIA_API_PATH}/upload-complete`, data);
    return response.data?.data || response.data;
  }
};
