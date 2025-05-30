import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, Tag as TagIcon } from 'lucide-react';
import { usePosts } from '../../contexts/PostsContext';
import toast from 'react-hot-toast';

// Common medical specialties for tag suggestions
const TAG_SUGGESTIONS = [
  'cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery',
  'radiology', 'dermatology', 'endocrinology', 'gastroenterology',
  'pulmonology', 'infectious disease', 'emergency', 'nephrology'
];

const CreatePostForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { createPost } = usePosts();
  
  // Filter tag suggestions based on input
  const filteredSuggestions = TAG_SUGGESTIONS.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !tags.includes(tag)
  ).slice(0, 5);
  
  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, this would upload to a server
    // For demo, we'll use a placeholder image
    if (images.length < 3) {
      setImages([...images, 'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1']);
    } else {
      toast.error('Maximum 3 images allowed');
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newPost = await createPost({
        title: title.trim(),
        content: content.trim(),
        images,
        tags
      });
      
      toast.success('Post created successfully!');
      navigate(`/post/${newPost.id}`);
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Medical Case</h1>
      
      {/* Title */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., Interesting Case of Atypical Pneumonia"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={100}
        />
      </div>
      
      {/* Content */}
      <div className="mb-4">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Case Description
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the case, including symptoms, observations, and any questions you have..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[200px]"
        />
      </div>
      
      {/* Images */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Images (Optional)
        </label>
        
        <div className="flex flex-wrap gap-4 mt-2">
          {images.map((image, index) => (
            <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden">
              <img src={image} alt="Case" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          ))}
          
          {images.length < 3 && (
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAddImage}
              />
              <ImagePlus size={24} className="text-gray-400" />
            </label>
          )}
        </div>
      </div>
      
      {/* Tags */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Tags (Optional)
        </label>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="bg-blue-50 text-primary px-2 py-1 rounded-full text-sm flex items-center"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-gray-500 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        
        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50">
              <TagIcon size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              placeholder={tags.length >= 5 ? "Maximum 5 tags" : "Add a tag (e.g., cardiology)"}
              className="flex-1 px-3 py-2 focus:outline-none"
              disabled={tags.length >= 5}
            />
          </div>
          
          {showTagSuggestions && tagInput && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              {filteredSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddTag(suggestion)}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg mr-3 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary-dark"
        >
          {isSubmitting ? 'Posting...' : 'Post Case'}
        </button>
      </div>
    </form>
  );
};

export default CreatePostForm;