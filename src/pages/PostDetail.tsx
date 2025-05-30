import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from '../components/posts/CommentSection';
import { Heart, MessageSquare, Share2, ArrowLeft, MoreHorizontal } from 'lucide-react';

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { getPost, likePost, unlikePost } = usePosts();
  const { currentUser } = useAuth();
  
  const post = getPost(postId || '');
  
  if (!post) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="text-gray-800 font-medium mb-2">Post not found</div>
        <p className="text-gray-600">
          The post you are looking for does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go to Home
        </button>
      </div>
    );
  }
  
  const isLiked = post.likes.includes(currentUser?.id || '');
  
  const handleLikeToggle = () => {
    if (isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };
  
  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-primary"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Post Header */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b">
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
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
          
          {/* Post Tags */}
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
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
              className="w-full h-auto object-cover max-h-[400px]"
            />
          </div>
        )}
        
        {/* Post Actions */}
        <div className="px-4 md:px-6 py-3 flex items-center justify-between border-t">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleLikeToggle}
              className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              <span>{post.likes.length}</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-500">
              <MessageSquare size={18} />
              <span>{post.comments.length}</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-500 hover:text-primary">
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="px-4 md:px-6 pb-6">
          <CommentSection postId={post.id} comments={post.comments} />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;