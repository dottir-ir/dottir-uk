import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { User } from '../types';
import PostCard from '../components/posts/PostCard';
import { Edit, Calendar, MapPin, Briefcase, Mail, Users } from 'lucide-react';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const { getUserPosts } = usePosts();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll just use the current user or mock data
        if (userId === currentUser?.id) {
          setUser(currentUser);
          setIsCurrentUser(true);
        } else {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Mock data for other users
          const mockUser: User = {
            id: userId || '1',
            name: userId === '1' ? 'Dr. Jane Smith' : 'John Medical Student',
            email: userId === '1' ? 'jane@example.com' : 'john@example.com',
            role: userId === '1' ? 'doctor' : 'student',
            avatar: userId === '1' 
              ? 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=150'
              : 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150',
            specialty: userId === '1' ? 'Cardiology' : 'General Medicine',
            bio: userId === '1' 
              ? 'Cardiologist with 10 years of experience at Memorial Hospital. Research interests include heart failure and preventive cardiology.'
              : 'Third-year medical student at University Medical School. Interested in internal medicine and emergency care.',
            createdAt: new Date('2023-01-15').toISOString()
          };
          
          setUser(mockUser);
          setIsCurrentUser(false);
        }
        
        // Get user posts
        const posts = getUserPosts(userId || '');
        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
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
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="text-gray-800 font-medium mb-2">User not found</div>
        <p className="text-gray-600">
          The user you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
        <div className="px-6 py-4 sm:px-8 sm:py-6">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-shrink-0 -mt-16 sm:-mt-20 mb-4 sm:mb-0">
              <img 
                src={user.avatar} 
                alt={user.name}
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white object-cover"
              />
            </div>
            <div className="sm:ml-6 sm:pt-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'doctor' 
                        ? 'bg-blue-50 text-primary' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {user.role === 'doctor' ? 'Medical Doctor' : 'Medical Student'}
                    </span>
                    {user.specialty && (
                      <>
                        <span className="mx-1 text-gray-400">•</span>
                        <span className="text-gray-600 text-sm">{user.specialty}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {isCurrentUser && (
                  <button className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center self-start">
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
              
              <p className="mt-4 text-gray-700">{user.bio || 'No bio available'}</p>
              
              <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-600">
                {user.role === 'doctor' && (
                  <div className="flex items-center">
                    <Briefcase size={16} className="mr-1 text-gray-500" />
                    <span>Hospital Staff</span>
                  </div>
                )}
                {user.role === 'student' && (
                  <div className="flex items-center">
                    <Users size={16} className="mr-1 text-gray-500" />
                    <span>University Medical School</span>
                  </div>
                )}
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1 text-gray-500" />
                  <span>Chicago, IL</span>
                </div>
                <div className="flex items-center">
                  <Mail size={16} className="mr-1 text-gray-500" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1 text-gray-500" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4 border-t pt-4">
                <div>
                  <div className="font-bold text-gray-900">{userPosts.length}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">24</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">36</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User's Posts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isCurrentUser ? 'My Posts' : `${user.name}'s Posts`}
        </h2>
        
        <div className="space-y-6">
          {userPosts.length > 0 ? (
            userPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm">
              <div className="text-gray-800 font-medium mb-2">No posts yet</div>
              <p className="text-gray-600">
                {isCurrentUser 
                  ? 'Share your first medical case to get started!' 
                  : `${user.name} hasn't shared any cases yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;