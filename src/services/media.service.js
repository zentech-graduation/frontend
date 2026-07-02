import axiosInstance from './axiosInstance';

const MEDIA_API_PATH = '/media';

/**
 * Gets dimensions for an image file
 */
const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image to calculate dimensions'));
    };
    img.src = url;
  });
};

/**
 * Gets dimensions for a video file
 */
const getVideoDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ width: video.videoWidth, height: video.videoHeight, duration: Math.floor(video.duration) });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video to calculate dimensions'));
    };
    video.src = url;
  });
};

/**
 * Uploads a media file using the 3-step direct-to-S3/R2 upload process.
 * @param {File} file - The file to upload.
 * @returns {Promise<Object>} The uploaded media asset metadata (including id).
 */
export const uploadMedia = async (file) => {
  const isVideo = file.type.startsWith('video/');
  const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

  // Step 1: Get Pre-signed URL
  const { data: urlResponse } = await axiosInstance.post(`${MEDIA_API_PATH}/upload`, {
    mediaType,
    mimeType: file.type,
    fileSize: file.size
  });
  
  const { uploadUrl, storageKey, requiredHeaders, method } = urlResponse.data || urlResponse;

  // Step 2: Upload directly to object storage
  let uploadResponse;
  try {
    console.log('Uploading to URL:', uploadUrl);
    console.log('With headers:', requiredHeaders);
    uploadResponse = await fetch(uploadUrl, {
      method: method || 'PUT',
      headers: requiredHeaders || {},
      body: file
    });
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Network error when uploading to storage (possibly CORS): ' + error.message);
  }

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to storage bucket. Status: ' + uploadResponse.status);
  }

  // Step 3: Extract dimensions
  let dimensions = { width: 0, height: 0 };
  let duration = null;
  
  if (isVideo) {
    const d = await getVideoDimensions(file);
    dimensions.width = d.width;
    dimensions.height = d.height;
    duration = d.duration;
  } else {
    dimensions = await getImageDimensions(file);
  }

  // Step 4: Confirm upload
  const confirmPayload = {
    storageKey,
    mediaType,
    mimeType: file.type,
    fileSize: file.size,
    width: dimensions.width,
    height: dimensions.height,
  };
  
  if (isVideo && duration !== null) {
    confirmPayload.duration = duration;
  }

  const { data: completeResponse } = await axiosInstance.post(`${MEDIA_API_PATH}/upload-complete`, confirmPayload);
  
  return completeResponse.data || completeResponse;
};

export const mediaService = {
  uploadMedia,
};

export default mediaService;
