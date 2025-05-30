import React, { createContext, useState, useContext, useEffect } from 'react';
import { Post, Comment } from '../types';
import { useAuth } from './AuthContext';

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (postData: Omit<Post, 'id' | 'author' | 'createdAt' | 'likes' | 'comments'>) => Promise<Post>;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  getUserPosts: (userId: string) => Post[];
  getPost: (postId: string) => Post | undefined;
}

// Mock initial posts
const initialPosts: Post[] = [
  {
    id: 'post1',
    title: 'Interesting Case of Atypical Pneumonia',
    content: 'Patient presented with shortness of breath, fever, and a non-productive cough for 5 days. Chest X-ray showed bilateral infiltrates. What would be your differential diagnosis?',
    images: ['https://images.pexels.com/photos/4226264/pexels-photo-4226264.jpeg?auto=compress&cs=tinysrgb&w=600'],
    tags: ['pneumonia', 'pulmonology', 'infectious disease'],
    author: {
      id: '1',
      name: 'Dr. Jane Smith',
      role: 'doctor',
      avatar: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    createdAt: new Date('2023-10-15T09:30:00').toISOString(),
    likes: ['user2', 'user3'],
    comments: [
      {
        id: 'comment1',
        content: 'Could be COVID-19, bacterial pneumonia, or an atypical presentation of another respiratory infection.',
        author: {
          id: '2',
          name: 'John Medical Student',
          role: 'student',
          avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150',
        },
        createdAt: new Date('2023-10-15T10:45:00').toISOString(),
      }
    ]
  },
  {
    id: 'post2',
    title: 'Management of Diabetic Ketoacidosis',
    content: 'Recently managed a case of severe DKA in the emergency department. The patient had glucose >600 mg/dL and severe metabolic acidosis. Let me share the approach we took and some key learnings.',
    images: [],
    tags: ['diabetes', 'endocrinology', 'emergency medicine'],
    author: {
      id: '1',
      name: 'Dr. Jane Smith',
      role: 'doctor',
      avatar: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    createdAt: new Date('2023-10-10T14:20:00').toISOString(),
    likes: ['user3'],
    comments: []
  },
  {
    id: 'post3',
    title: 'Question about Antibiotic Selection',
    content: 'I\'m struggling with a case study about empiric antibiotic selection for community-acquired pneumonia. What would be the best first-line treatment for an elderly patient with multiple comorbidities?',
    images: [],
    tags: ['antibiotics', 'pneumonia', 'pharmacology'],
    author: {
      id: '2',
      name: 'John Medical Student',
      role: 'student',
      avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    createdAt: new Date('2023-10-08T16:45:00').toISOString(),
    likes: ['user1'],
    comments: [
      {
        id: 'comment2',
        content: 'For elderly patients with comorbidities, we often consider respiratory fluoroquinolones or a combination of beta-lactam plus macrolide. Make sure to check local resistance patterns.',
        author: {
          id: '1',
          name: 'Dr. Jane Smith',
          role: 'doctor',
          avatar: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=150',
        },
        createdAt: new Date('2023-10-08T17:30:00').toISOString(),
      }
    ]
  }
];

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Simulate fetching posts
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get posts from localStorage or use initial data
        const storedPosts = localStorage.getItem('medishare_posts');
        if (storedPosts) {
          setPosts(JSON.parse(storedPosts));
        } else {
          setPosts(initialPosts);
          localStorage.setItem('medishare_posts', JSON.stringify(initialPosts));
        }
      } catch (err) {
        setError('Failed to fetch posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('medishare_posts', JSON.stringify(posts));
    }
  }, [posts]);

  const createPost = async (postData: Omit<Post, 'id' | 'author' | 'createdAt' | 'likes' | 'comments'>): Promise<Post> => {
    if (!currentUser) throw new Error('User must be logged in to create a post');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPost: Post = {
      id: `post_${Date.now()}`,
      ...postData,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar,
      },
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  const likePost = (postId: string) => {
    if (!currentUser) return;
    
    setPosts(prev => 
      prev.map(post => {
        if (post.id === postId && !post.likes.includes(currentUser.id)) {
          return {
            ...post,
            likes: [...post.likes, currentUser.id]
          };
        }
        return post;
      })
    );
  };

  const unlikePost = (postId: string) => {
    if (!currentUser) return;
    
    setPosts(prev => 
      prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.likes.filter(id => id !== currentUser.id)
          };
        }
        return post;
      })
    );
  };

  const addComment = (postId: string, content: string) => {
    if (!currentUser) return;
    
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      content,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar,
      },
      createdAt: new Date().toISOString()
    };
    
    setPosts(prev => 
      prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      })
    );
  };

  const getUserPosts = (userId: string) => {
    return posts.filter(post => post.author.id === userId);
  };

  const getPost = (postId: string) => {
    return posts.find(post => post.id === postId);
  };

  const value = {
    posts,
    loading,
    error,
    createPost,
    likePost,
    unlikePost,
    addComment,
    getUserPosts,
    getPost
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = (): PostsContextType => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};