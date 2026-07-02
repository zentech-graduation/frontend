import { useState, useCallback } from 'react';
import axios from 'axios';
import { mediaService } from '@/api/media.service';

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Calculate dimensions (and duration) of a file before uploading
   */
  const getMediaMetadata = (file) => {
    return new Promise((resolve, reject) => {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      
      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: Math.round(video.duration)
          });
        };
        video.onerror = () => reject(new Error('Failed to load video metadata'));
        video.src = url;
      } else {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => reject(new Error('Failed to load image metadata'));
        img.src = url;
      }
    });
  };

  /**
   * Main upload function
   */
  const uploadMedia = useCallback(async (file) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'VIDEO' : 'IMAGE';
      
      // 1. Get metadata (width, height, duration)
      const metadata = await getMediaMetadata(file);

      // 2. Request pre-signed URL
      const { uploadUrl, storageKey } = await mediaService.createUploadUrl({
        mediaType,
        mimeType: file.type,
        fileSize: file.size
      });

      // 3. Direct upload to R2/S3 via PUT using raw axios to avoid interceptor auth headers
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });

      // 4. Confirm upload
      const response = await mediaService.completeUpload({
        storageKey,
        mediaType,
        mimeType: file.type,
        fileSize: file.size,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration || null
      });

      setIsUploading(false);
      setProgress(100);
      return response; // Contains the mediaAssetId and other details

    } catch (err) {
      console.error('Media upload failed', err);
      setError(err.message || 'Upload failed');
      setIsUploading(false);
      throw err;
    }
  }, []);

  return {
    uploadMedia,
    isUploading,
    progress,
    error
  };
};
