// ImgBB Image Upload Service
// NOTE: uploadImage uses the backend /upload/imgbb endpoint so the API key is read from DB (admin settings)
import api from '@/services/api';
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '062499640037b87a330cb09793b95435';
const IMGBB_BASE_URL = 'https://api.imgbb.com/1';

export interface ImgBBResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Upload a single image to ImgBB
 * @param file - File object or base64 string
 * @returns Promise with the uploaded image URL
 */
export const uploadImage = async (file: File | string): Promise<string> => {
  const formData = new FormData();

  if (typeof file === 'string') {
    // Convert base64 string to a Blob so multer can handle it
    const base64Data = file.includes('base64,') ? file : `data:image/jpeg;base64,${file}`;
    const fetchRes = await fetch(base64Data);
    const blob = await fetchRes.blob();
    formData.append('image', blob, 'image.jpg');
  } else {
    formData.append('image', file);
  }

  // Use backend endpoint — key is read from DB (admin settings)
  const response = await api.post('/upload/imgbb', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (response.data?.status === 'success' && response.data?.data?.url) {
    return response.data.data.url;
  }
  throw new Error('Failed to upload image');
};

/**
 * Upload multiple images to ImgBB
 * @param files - Array of File objects
 * @returns Promise with array of uploaded image URLs
 */
export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    throw error;
  }
};

/**
 * Convert File to base64 string
 * @param file - File object
 * @returns Promise with base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Validate image file
 * @param file - File object
 * @param maxSizeMB - Maximum file size in MB (default 5MB)
 * @returns Object with isValid and error message
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.' };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
  }
  
  return { isValid: true };
};

export interface ImgBBGetImageResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    delete_url: string;
  };
  error?: { message: string; code: number };
}

export interface ImgBBGetImagesResponse {
  success: boolean;
  data?: Array<{
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    delete_url: string;
  }>;
  error?: { message: string; code: number };
}

/**
 * Get a single image from ImgBB by ID
 */
export const getImage = async (imageId: string): Promise<ImgBBGetImageResponse['data']> => {
  const response = await fetch(`${IMGBB_BASE_URL}/image/${imageId}?key=${IMGBB_API_KEY}`);
  const result: ImgBBGetImageResponse = await response.json();
  if (result.success && result.data) return result.data;
  throw new Error(result.error?.message || 'Failed to get image');
};

/**
 * Get all images uploaded under the ImgBB account key
 * @param page - Page number (default 1)
 * @param perPage - Results per page (default 100, max 200)
 */
export const getImages = async (page = 1, perPage = 100): Promise<ImgBBGetImagesResponse['data']> => {
  const response = await fetch(
    `${IMGBB_BASE_URL}/images?key=${IMGBB_API_KEY}&page=${page}&per_page=${perPage}`
  );
  const result: ImgBBGetImagesResponse = await response.json();
  if (result.success && result.data) return result.data;
  throw new Error(result.error?.message || 'Failed to get images');
};

const imageUploadService = {
  uploadImage,
  uploadMultipleImages,
  fileToBase64,
  validateImageFile,
  getImage,
  getImages,
};

export default imageUploadService;
