import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Case, Attachment } from '../../services/api/types';
import { caseService } from '../../services/api/caseService';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface CaseFormProps {
  initialData?: Partial<Case>;
  mode: 'create' | 'edit';
}

export const CaseForm: React.FC<CaseFormProps> = ({ initialData, mode }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    status: initialData?.status || 'open',
    visibility: initialData?.visibility || 'public',
    tags: initialData?.tags || [],
    attachments: initialData?.attachments || [],
  });
  const [newTag, setNewTag] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const caseData = {
        ...formData,
        author_id: 'current-user-id', // TODO: Get from auth context
      };

      let caseId: string;
      if (mode === 'create') {
        const newCase = await caseService.createCase(caseData);
        caseId = newCase.id;
      } else {
        const updatedCase = await caseService.updateCase(initialData!.id!, caseData);
        caseId = updatedCase.id;
      }

      // Upload attachments
      if (attachments.length > 0) {
        try {
          await Promise.all(
            attachments.map(async file => {
              const fileExt = file.name.split('.').pop();
              const fileName = `${caseId}-${Date.now()}.${fileExt}`;
              const filePath = `case-attachments/${fileName}`;

              await caseService.uploadAttachment(caseId, file, {
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: 'current-user-id', // TODO: Get from auth context
                file_url: filePath, // This will be updated with the actual URL after upload
              });
            })
          );
        } catch (uploadError) {
          throw new Error('Failed to upload attachments: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'));
        }
      }

      navigate(`/cases/${caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save case'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">
          {mode === 'create' ? 'Create New Case' : 'Edit Case'}
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <p>{error.message}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              rows={10}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Case['status'] }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="visibility" className="text-sm font-medium">
                Visibility
              </label>
              <select
                id="visibility"
                value={formData.visibility}
                onChange={e => setFormData(prev => ({ ...prev, visibility: e.target.value as Case['visibility'] }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="doctors_only">Doctors Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-secondary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newTag.trim()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
              >
                Add
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <label htmlFor="attachments" className="text-sm font-medium">
              Attachments
            </label>
            <input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Case' : 'Save Changes'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 