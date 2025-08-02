// utils/fileUploadService.js
import axios from 'axios';
import { supabase } from './supabaseClient';

// Sanitize filename helper
const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9_.\-]/g, '_');

// utils/fileUploadService.js
export const uploadFileToCloudinary = async (file, folder = 'chatapp_files') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'chatapp_unsigned');
  formData.append('folder', folder); // now configurable

  const response = await axios.post(
    'https://api.cloudinary.com/v1_1/dy1mqueya/auto/upload',
    formData
  );

  return {
    url: response.data.secure_url,
    resourceType: response.data.resource_type,
    fileName: response.data.original_filename,
    createdAt: response.data.created_at,
  };
};

export const uploadFileToSupabase = async (file) => {
  const safeName = sanitizeFilename(file.name);
  const filePath = `pdfs/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from('pdf-files')
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('pdf-files')
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    resourceType: 'pdf',
    fileName: safeName,
    createdAt: new Date().toISOString()
  };
};

export const handleFileUpload = async (file) => {
  const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/');
  const isPdf = file.type === 'application/pdf';

  if (isImageOrVideo) {
    return await uploadFileToCloudinary(file);
  } else if (isPdf) {
    return await uploadFileToSupabase(file);
  } else {
    throw new Error('Unsupported file type');
  }
};