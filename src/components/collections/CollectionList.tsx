import React from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Collection {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_collaborative: boolean;
  is_educational: boolean;
  specialty: string | null;
  tags: string[] | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface CollectionListProps {
  userId?: string;
  onCollectionClick: (collection: Collection) => void;
}

export const CollectionList: React.FC<CollectionListProps> = ({
  userId,
  onCollectionClick,
}) => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCollections = async () => {
      try {
        let query = supabase
          .from('collections')
          .select('*')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('owner_id', userId);
        } else {
          // Show public collections and user's collections
          query = query.or(`is_public.eq.true,owner_id.eq.${user?.id}`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setCollections(data || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [supabase, userId, user?.id]);

  if (loading) {
    return <div>Loading collections...</div>;
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No collections found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => (
        <Card
          key={collection.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onCollectionClick(collection)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{collection.title}</h3>
              <div className="flex space-x-2">
                {collection.is_public && (
                  <Badge variant="primary">Public</Badge>
                )}
                {collection.is_collaborative && (
                  <Badge variant="secondary">Collaborative</Badge>
                )}
                {collection.is_educational && (
                  <Badge variant="success">Educational</Badge>
                )}
              </div>
            </div>
            
            {collection.description && (
              <p className="mt-2 text-gray-600 line-clamp-2">
                {collection.description}
              </p>
            )}

            {collection.specialty && (
              <div className="mt-2">
                <Badge variant="outline">{collection.specialty}</Badge>
              </div>
            )}

            {collection.tags && collection.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {collection.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              Last updated: {new Date(collection.updated_at).toLocaleDateString()}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}; 