import React from 'react';
import { Navigate } from 'react-router-dom';
import CreatePostForm from '../components/posts/CreatePostForm';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CreatePost: React.FC = () => {
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'doctor') {
    toast.error('Only doctors can create new cases');
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <h1 className="sr-only">Create New Medical Case</h1>
      <CreatePostForm />
    </div>
  );
};

export default CreatePost;