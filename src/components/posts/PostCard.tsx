import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostsContext';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { currentUser } = useAuth();
  const { likePost, unlikePost } = usePosts();
  const [showFullContent, setShowFullContent] = useState(false);
  
  const isLiked = post.likes.includes(currentUser?.id || '');
  const contentIsTooLong = post.content.length > 280;
  
  const displayContent = showFullContent || !contentIsTooLong 
    ? post.content 
    : `${post.content.substring(0, 280)}...`;
  
  const handleLikeToggle = () => {
    if (isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b">
        <Link to={`/profile/${post.author.id}`} className="flex items-center">
          <img 
            src={post.author.avatar} 
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <div className="font-medium text-gray-900">{post.author.name}</div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 capitalize">{post.author.role}</span>
              <span className="mx-1 text-gray-500">•</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </Link>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      {/* Post Content */}
      <Link to={`/post/${post.id}`}>
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
          <p className="text-gray-700 whitespace-pre-line">{displayContent}</p>
          
          {contentIsTooLong && !showFullContent && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowFullContent(true);
              }} 
              className="text-primary font-medium mt-2 hover:underline"
            >
              Read more
            </button>
          )}
          
          {/* Post Tags */}
          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span 
                  key={tag} 
                  className="bg-blue-50 text-primary px-2 py-1 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Post Images */}
        {post.images.length > 0 && (
          <div className="border-t border-b border-gray-100">
            <img 
              src={post.images[0]} 
              alt="Post content"
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
      </Link>
      
      {/* Post Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLikeToggle}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
            <span>{post.likes.length}</span>
          </button>
          
          <Link 
            to={`/post/${post.id}`}
            className="flex items-center space-x-1 text-gray-500 hover:text-primary"
          >
            <MessageSquare size={18} />
            <span>{post.comments.length}</span>
          </Link>
          
          <button className="flex items-center space-x-1 text-gray-500 hover:text-primary">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;