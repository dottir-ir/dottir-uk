import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, 
  Stethoscope, 
  Brain, 
  Pill, 
  Activity, 
  Microscope,
  Plus,
  LucideIcon
} from 'lucide-react';

interface CategoryProps {
  name: string;
  icon: React.ReactElement;
  count: number;
}

const Category: React.FC<CategoryProps> = ({ name, icon, count }) => (
  <Link 
    to={`/?category=${name.toLowerCase()}`}
    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors group"
  >
    <div className="flex items-center">
      <div className="text-gray-500 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="ml-3 text-gray-700 group-hover:text-gray-900">{name}</span>
    </div>
    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
      {count}
    </span>
  </Link>
);

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();

  const categories = [
    { name: 'Cardiology', icon: <Heart size={18} />, count: 24 },
    { name: 'Neurology', icon: <Brain size={18} />, count: 18 },
    { name: 'Internal Medicine', icon: <Stethoscope size={18} />, count: 42 },
    { name: 'Pharmacology', icon: <Pill size={18} />, count: 15 },
    { name: 'Emergency', icon: <Activity size={18} />, count: 29 },
    { name: 'Pathology', icon: <Microscope size={18} />, count: 12 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sticky top-[112px] z-10">
      {currentUser?.role === 'doctor' && (
        <div className="mb-6">
          <Link
            to="/create-post"
            className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Share New Case
          </Link>
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Categories</h2>
        <div className="space-y-1">
          {categories.map((category) => (
            <Category
              key={category.name}
              name={category.name}
              icon={category.icon}
              count={category.count}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;