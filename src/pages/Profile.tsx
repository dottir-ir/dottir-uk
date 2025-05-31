import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { User, Post } from '../types';
import PostCard from '../components/posts/PostCard';
import { Edit, Calendar, MapPin, Briefcase, Mail, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const { getUserPosts } = usePosts();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    console.log('Profile page: userId', userId, 'currentUser', currentUser);
    let timeout: NodeJS.Timeout;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        if (userId === currentUser?.id) {
          setUser(currentUser);
          setIsCurrentUser(true);
        } else if (userId) {
          // Fetch user profile from Supabase
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (error || !data) {
            setUser(null);
          } else {
            setUser({ ...data });
          }
          setIsCurrentUser(false);
        }
        // Get user posts
        if (userId) {
          const posts = await getUserPosts(userId);
          setUserPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    if (userId === currentUser?.id || userId) {
      fetchUserData();
    }
    // Timeout to break loading if currentUser is not set
    timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [userId, currentUser, getUserPosts]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h2>
        <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar || 'https://via.placeholder.com/150'}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>
          {isCurrentUser && (
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <Edit size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {user.location && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin size={16} />
              <span>{user.location}</span>
            </div>
          )}
          {user.specialization && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Briefcase size={16} />
              <span>{user.specialization}</span>
            </div>
          )}
          {user.email && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          )}
          {user.joinedAt && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar size={16} />
              <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;