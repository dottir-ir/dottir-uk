import React from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';

interface Collection {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_collaborative: boolean;
  is_educational: boolean;
  specialty: string | null;
  tags: string[] | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface CollectionFormProps {
  collection?: Collection;
  onSave: (collection: Collection) => void;
  onCancel: () => void;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  collection,
  onSave,
  onCancel,
}) => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Collection>>({
    title: collection?.title || '',
    description: collection?.description || '',
    is_public: collection?.is_public || false,
    is_collaborative: collection?.is_collaborative || false,
    is_educational: collection?.is_educational || false,
    specialty: collection?.specialty || '',
    tags: collection?.tags || [],
  });
  const [tagInput, setTagInput] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const collectionData = {
        ...formData,
        owner_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (collection?.id) {
        // Update existing collection
        const { data, error } = await supabase
          .from('collections')
          .update(collectionData)
          .eq('id', collection.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        // Create new collection
        const { data, error } = await supabase
          .from('collections')
          .insert({
            ...collectionData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }
    } catch (error) {
      console.error('Error saving collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags?.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove),
    }));
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
            Specialty
          </label>
          <select
            id="specialty"
            value={formData.specialty || ''}
            onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a specialty</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Orthopedics">Orthopedics</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {formData.tags?.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add a tag and press Enter"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={e => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
              Make this collection public
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_collaborative"
              checked={formData.is_collaborative}
              onChange={e => setFormData(prev => ({ ...prev, is_collaborative: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_collaborative" className="ml-2 block text-sm text-gray-700">
              Allow collaboration
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_educational"
              checked={formData.is_educational}
              onChange={e => setFormData(prev => ({ ...prev, is_educational: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_educational" className="ml-2 block text-sm text-gray-700">
              Mark as educational content
            </label>
          </div>
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
            {loading ? 'Saving...' : collection ? 'Update Collection' : 'Create Collection'}
          </button>
        </div>
      </form>
    </Card>
  );
}; 