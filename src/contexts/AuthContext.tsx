import React, { createContext, useState, useContext, useEffect } from 'react';
import { UserRole, User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo purposes (in real app, this would be in a database)
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Jane Smith',
    email: 'jane@example.com',
    role: 'doctor',
    avatar: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=150',
    specialty: 'Cardiology',
    bio: 'Cardiologist with 10 years of experience',
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: '2',
    name: 'John Medical Student',
    email: 'john@example.com',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150',
    specialty: 'General Medicine',
    bio: 'Third year medical student',
    createdAt: new Date('2023-03-20').toISOString()
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing login on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('medishare_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find user (this would be an API call in production)
      const user = mockUsers.find(u => u.email === email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Store user in localStorage for persistence
      localStorage.setItem('medishare_user', JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create new user (would be an API call in production)
      const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        role,
        avatar: role === 'doctor' 
          ? 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=150' 
          : 'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=150',
        specialty: '',
        bio: '',
        createdAt: new Date().toISOString()
      };
      
      // Store user in localStorage for persistence
      localStorage.setItem('medishare_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('medishare_user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};