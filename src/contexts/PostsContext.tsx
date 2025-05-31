import React, { createContext, useState, useContext, useEffect } from 'react';
import { Post, Comment, Notification, Bookmark } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (postData: Omit<Post, 'id' | 'author' | 'createdAt' | 'lastUpdated' | 'likes' | 'comments'>) => Promise<Post>;
  updatePost: (postId: string, postData: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  getUserPosts: (userId: string) => Promise<Post[]>;
  getPost: (postId: string) => Promise<Post | null>;
  bookmarkPost: (postId: string) => Promise<void>;
  removeBookmark: (postId: string) => Promise<void>;
  getBookmarkedPosts: () => Promise<Post[]>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          comments:post_comments(
            *,
            author:profiles(*)
          ),
          likes:post_likes(*),
          tags:post_tags(tag)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        images: post.images || [],
        imageDescriptions: post.image_descriptions || [],
        tags: post.tags.map((t: any) => t.tag),
        author: post.author,
        createdAt: post.created_at,
        lastUpdated: post.last_updated,
        likes: post.likes.map((like: any) => like.user_id),
        comments: post.comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.created_at,
          lastUpdated: comment.last_updated
        })),
        specialty: post.specialty,
        age: post.age,
        gender: post.gender,
        symptoms: post.symptoms,
        history: post.history,
        diagnosis: post.diagnosis,
        treatment: post.treatment,
        outcome: post.outcome,
        isAnonymous: post.is_anonymous,
        status: post.status
      }));

      setPosts(formattedPosts);
    } catch (err) {
      setError('Failed to fetch posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: Omit<Post, 'id' | 'author' | 'createdAt' | 'lastUpdated' | 'likes' | 'comments'>): Promise<Post> => {
    if (!currentUser) throw new Error('User must be logged in to create a post');
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...postData,
          user_id: currentUser.id,
          status: postData.status || 'published'
        }])
        .select()
        .single();

      if (error) throw error;

      // Insert tags if provided
      if (postData.tags && postData.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(postData.tags.map(tag => ({
            post_id: data.id,
            tag
          })));
        if (tagsError) throw tagsError;
      }

      const newPost: Post = {
        id: data.id,
        ...postData,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatar: currentUser.avatar,
          specialty: currentUser.specialty
        },
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        likes: [],
        comments: []
      };

      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  };

  const updatePost = async (postId: string, postData: Partial<Post>) => {
    if (!currentUser) throw new Error('User must be logged in to update a post');
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          ...postData,
          last_updated: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update tags if provided
      if (postData.tags) {
        // Delete existing tags
        await supabase
          .from('post_tags')
          .delete()
          .eq('post_id', postId);

        // Insert new tags
        if (postData.tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('post_tags')
            .insert(postData.tags.map(tag => ({
              post_id: postId,
              tag
            })));
          if (tagsError) throw tagsError;
        }
      }

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, ...postData, lastUpdated: new Date().toISOString() }
          : post
      ));
    } catch (err) {
      console.error('Error updating post:', err);
      throw err;
    }
  };

  const deletePost = async (postId: string) => {
    if (!currentUser) throw new Error('User must be logged in to delete a post');
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  };

  const bookmarkPost = async (postId: string) => {
    if (!currentUser) throw new Error('User must be logged in to bookmark a post');
    
    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert([{ user_id: currentUser.id, post_id: postId }]);

      if (error) throw error;
    } catch (err) {
      console.error('Error bookmarking post:', err);
      throw err;
    }
  };

  const removeBookmark = async (postId: string) => {
    if (!currentUser) throw new Error('User must be logged in to remove a bookmark');
    
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('post_id', postId);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing bookmark:', err);
      throw err;
    }
  };

  const getBookmarkedPosts = async () => {
    if (!currentUser) throw new Error('User must be logged in to view bookmarks');
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          post:posts(
            *,
            author:profiles(*),
            comments:post_comments(
              *,
              author:profiles(*)
            ),
            likes:post_likes(*),
            tags:post_tags(tag)
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((bookmark: any) => {
        const post = bookmark.post;
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          images: post.images || [],
          imageDescriptions: post.image_descriptions || [],
          tags: post.tags.map((t: any) => t.tag),
          author: post.author,
          createdAt: post.created_at,
          lastUpdated: post.last_updated,
          likes: post.likes.map((like: any) => like.user_id),
          comments: post.comments.map((comment: any) => ({
            id: comment.id,
            content: comment.content,
            author: comment.author,
            createdAt: comment.created_at,
            lastUpdated: comment.last_updated
          })),
          specialty: post.specialty,
          age: post.age,
          gender: post.gender,
          symptoms: post.symptoms,
          history: post.history,
          diagnosis: post.diagnosis,
          treatment: post.treatment,
          outcome: post.outcome,
          isAnonymous: post.is_anonymous,
          status: post.status
        };
      });
    } catch (err) {
      console.error('Error fetching bookmarked posts:', err);
      throw err;
    }
  };

  const likePost = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: currentUser.id }]);

      if (error) throw error;

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
    } catch (err) {
      console.error('Error liking post:', err);
      throw err;
    }
  };

  const unlikePost = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .match({ post_id: postId, user_id: currentUser.id });

      if (error) throw error;

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
    } catch (err) {
      console.error('Error unliking post:', err);
      throw err;
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: currentUser.id,
          content
        }])
        .select(`
          *,
          author:profiles(*)
        `)
        .single();

      if (error) throw error;

      const newComment: Comment = {
        id: data.id,
        content,
        author: data.author,
        createdAt: data.created_at
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
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const updateComment = async (postId: string, commentId: string, content: string) => {
    if (!currentUser) throw new Error('User must be logged in to update a comment');
    
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({
          content
        })
        .eq('id', commentId)
        .eq('post_id', postId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.map(comment => 
                comment.id === commentId ? { ...comment, content } : comment
              )
            }
          : post
      ));
    } catch (err) {
      console.error('Error updating comment:', err);
      throw err;
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) throw new Error('User must be logged in to delete a comment');
    
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('post_id', postId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.filter(comment => comment.id !== commentId)
            }
          : post
      ));
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  };

  const getUserPosts = async (userId: string): Promise<Post[]> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          comments:post_comments(
            *,
            author:profiles(*)
          ),
          likes:post_likes(*),
          tags:post_tags(tag)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        images: post.images || [],
        imageDescriptions: post.image_descriptions || [],
        tags: post.tags.map((t: any) => t.tag),
        author: post.author,
        createdAt: post.created_at,
        lastUpdated: post.last_updated,
        likes: post.likes.map((like: any) => like.user_id),
        comments: post.comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.created_at,
          lastUpdated: comment.last_updated
        })),
        specialty: post.specialty,
        age: post.age,
        gender: post.gender,
        symptoms: post.symptoms,
        history: post.history,
        diagnosis: post.diagnosis,
        treatment: post.treatment,
        outcome: post.outcome,
        isAnonymous: post.is_anonymous,
        status: post.status
      }));
    } catch (err) {
      console.error('Error fetching user posts:', err);
      throw err;
    }
  };

  const getPost = async (postId: string): Promise<Post | null> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          comments:post_comments(
            *,
            author:profiles(*)
          ),
          likes:post_likes(*),
          tags:post_tags(tag)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        images: data.images || [],
        imageDescriptions: data.image_descriptions || [],
        tags: data.tags.map((t: any) => t.tag),
        author: data.author,
        createdAt: data.created_at,
        lastUpdated: data.last_updated,
        likes: data.likes.map((like: any) => like.user_id),
        comments: data.comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.created_at,
          lastUpdated: comment.last_updated
        })),
        specialty: data.specialty,
        age: data.age,
        gender: data.gender,
        symptoms: data.symptoms,
        history: data.history,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        outcome: data.outcome,
        isAnonymous: data.is_anonymous,
        status: data.status
      };
    } catch (err) {
      console.error('Error fetching post:', err);
      throw err;
    }
  };

  const value = {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    updateComment,
    deleteComment,
    getUserPosts,
    getPost,
    bookmarkPost,
    removeBookmark,
    getBookmarkedPosts,
    searchTerm,
    setSearchTerm
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};