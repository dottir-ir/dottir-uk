import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { Post } from '../types';

const Posts: React.FC = () => {
  const { currentUser } = useAuth();
  const { posts, loading, error, createPost } = usePosts();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create post
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await createPost({
        title,
        content,
        images: [],
        tags: []
      });
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Posts</h2>
      {currentUser && (
        <form onSubmit={handleCreate} className="mb-6 space-y-2">
          <input
            className="w-full border px-3 py-2 rounded mb-2"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full border px-3 py-2 rounded mb-2"
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-[#A3243C] text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Create Post'}
          </button>
        </form>
      )}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading && <div>Loading...</div>}
      <ul className="space-y-4">
        {posts.map(post => (
          <li key={post.id} className="border rounded p-4 bg-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">{post.title}</h3>
            </div>
            <p className="mb-1">{post.content}</p>
            <div className="text-xs text-gray-500">
              Posted by {post.author.name} on {new Date(post.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Posts; 