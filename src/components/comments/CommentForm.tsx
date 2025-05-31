import React, { useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Comment, CommentType } from '../../types/comments';

interface CommentFormProps {
  caseId: string;
  parentComment?: Comment;
  editingComment?: Comment;
  onSave: (comment: Comment) => void;
  onCancel: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  caseId,
  parentComment,
  editingComment,
  onSave,
  onCancel,
}) => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(editingComment?.content || '');
  const [commentType, setCommentType] = useState<CommentType>(editingComment?.comment_type as CommentType || 'standard');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editingComment?.image_path || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imagePath = editingComment?.image_path || null;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `comments/${caseId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('comment-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;
        imagePath = filePath;
      }

      const commentData = {
        case_id: caseId,
        author_id: user.id,
        parent_id: parentComment?.id || null,
        comment_type: commentType,
        content,
        image_path: imagePath,
        updated_at: new Date().toISOString(),
      };

      if (editingComment?.id) {
        // Update existing comment
        const { data, error } = await supabase
          .from('comments')
          .update(commentData)
          .eq('id', editingComment.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new comment
        const { data, error } = await supabase
          .from('comments')
          .insert({
            ...commentData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="commentType" className="block text-sm font-medium text-gray-700">
            Comment Type
          </label>
          <select
            id="commentType"
            value={commentType}
            onChange={e => setCommentType(e.target.value as CommentType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="question">Question</option>
            <option value="differential">Differential Diagnosis</option>
            <option value="treatment">Treatment Suggestion</option>
            <option value="educational">Educational Note</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Comment
          </label>
          <textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image (optional)
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 max-w-sm rounded-lg"
            />
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Saving...' : editingComment ? 'Update Comment' : 'Post Comment'}
          </button>
        </div>
      </form>
    </Card>
  );
}; 