import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSupabase } from '../../hooks/useSupabase';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface CaseImage {
  id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  description: string | null;
  annotations: any | null;
  is_primary: boolean;
  order_index: number;
}

interface CaseImageUploaderProps {
  caseId: string;
  onImagesUploaded: (images: CaseImage[]) => void;
  existingImages?: CaseImage[];
}

export const CaseImageUploader: React.FC<CaseImageUploaderProps> = ({
  caseId,
  onImagesUploaded,
  existingImages = [],
}) => {
  const { supabase } = useSupabase();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const uploadedImages: CaseImage[] = [];

    for (const file of acceptedFiles) {
      try {
        // Create a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `cases/${caseId}/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('medical-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get image dimensions
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height,
            });
          };
          img.src = URL.createObjectURL(file);
        });

        // Create image record in database
        const { data: imageData, error: dbError } = await supabase
          .from('case_images')
          .insert({
            case_id: caseId,
            storage_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            is_primary: existingImages.length === 0, // First image is primary
            order_index: existingImages.length,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedImages.push(imageData);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100,
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: -1, // Error state
        }));
      }
    }

    setUploading(false);
    onImagesUploaded([...existingImages, ...uploadedImages]);
  }, [caseId, existingImages, onImagesUploaded, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSetPrimary = async (imageId: string) => {
    try {
      // Update all images to not be primary
      await supabase
        .from('case_images')
        .update({ is_primary: false })
        .eq('case_id', caseId);

      // Set the selected image as primary
      await supabase
        .from('case_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      // Update local state
      const updatedImages = existingImages.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      onImagesUploaded(updatedImages);
    } catch (error) {
      console.error('Error setting primary image:', error);
    }
  };

  const handleReorder = async (imageId: string, newIndex: number) => {
    try {
      const oldIndex = existingImages.findIndex(img => img.id === imageId);
      if (oldIndex === -1) return;

      const reorderedImages = [...existingImages];
      const [movedImage] = reorderedImages.splice(oldIndex, 1);
      reorderedImages.splice(newIndex, 0, movedImage);

      // Update order_index for all affected images
      const updates = reorderedImages.map((img, index) => ({
        id: img.id,
        order_index: index,
      }));

      await supabase
        .from('case_images')
        .upsert(updates);

      onImagesUploaded(reorderedImages);
    } catch (error) {
      console.error('Error reordering images:', error);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const image = existingImages.find(img => img.id === imageId);
      if (!image) return;

      // Delete from storage
      await supabase.storage
        .from('medical-images')
        .remove([image.storage_path]);

      // Delete from database
      await supabase
        .from('case_images')
        .delete()
        .eq('id', imageId);

      // Update local state
      const updatedImages = existingImages.filter(img => img.id !== imageId);
      onImagesUploaded(updatedImages);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <div>
            <p>Drag and drop images here, or click to select files</p>
            <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full ${
                    progress === -1 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress === -1 ? 100 : progress}%` }}
                />
              </div>
              <span className="text-sm">
                {progress === -1 ? 'Error' : `${progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((image, index) => (
            <Card key={image.id} className="relative group">
              <img
                src={`${supabase.storage.from('medical-images').getPublicUrl(image.storage_path).data.publicUrl}`}
                alt={image.description || image.file_name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-2">
                <p className="text-sm truncate">{image.file_name}</p>
                {image.is_primary && (
                  <Badge variant="success" className="mt-1">Primary</Badge>
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  onClick={() => handleSetPrimary(image.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Set as primary"
                >
                  ⭐
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Delete"
                >
                  🗑️
                </button>
                {index > 0 && (
                  <button
                    onClick={() => handleReorder(image.id, index - 1)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Move up"
                  >
                    ⬆️
                  </button>
                )}
                {index < existingImages.length - 1 && (
                  <button
                    onClick={() => handleReorder(image.id, index + 1)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Move down"
                  >
                    ⬇️
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 