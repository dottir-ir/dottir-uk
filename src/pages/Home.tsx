import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PostCard from '../components/posts/PostCard';
import { usePosts } from '../contexts/PostsContext';
import { Post } from '../types';
import { Search, Filter, X } from 'lucide-react';

const Home: React.FC = () => {
  const location = useLocation();
  const { posts, loading } = usePosts();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  
  // Get category from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      setActiveFilter(category);
    }
  }, [location]);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...posts];
    
    // Apply category filter
    if (activeFilter) {
      result = result.filter(post => 
        post.tags.some(tag => tag.toLowerCase() === activeFilter?.toLowerCase())
      );
    }
    
    // Apply search
    if (searchTerm) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredPosts(result);
  }, [posts, activeFilter, searchTerm]);
  
  const clearFilters = () => {
    setActiveFilter(null);
    setSearchTerm('');
  };
  
  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for posts, topics, or tags"
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {(activeFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="sm:w-auto w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <X size={18} className="mr-2" />
              Clear Filters
            </button>
          )}
        </div>
        
        {activeFilter && (
          <div className="mt-3 flex items-center">
            <span className="text-sm text-gray-500 mr-2">Active filter:</span>
            <span className="bg-blue-50 text-primary px-2 py-1 rounded-full text-xs font-medium flex items-center">
              {activeFilter}
              <button
                onClick={() => setActiveFilter(null)}
                className="ml-1 text-gray-500 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        )}
      </div>
      
      {/* Posts List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-gray-500 mb-2">No posts found</div>
            <p className="text-gray-600">
              {activeFilter || searchTerm 
                ? "Try adjusting your search or filters" 
                : "Be the first to share a medical case!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;