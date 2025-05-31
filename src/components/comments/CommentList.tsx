import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Comment } from '../../types/comments';

interface CommentListProps {
  caseId: string;
  onEditComment: (comment: Comment) => void;
  onReplyToComment: (comment: Comment) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  caseId,
  onEditComment,
  onReplyToComment,
}) => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(full_name, role, specialty)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data.forEach((comment: Comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      data.forEach((comment: Comment) => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const subscription = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [caseId]);

  const renderComment = (comment: Comment, level = 0) => {
    const isAuthor = user?.id === comment.author_id;
    const canModerate = user?.role === 'admin' || user?.role === 'moderator';

    return (
      <div key={comment.id} className={`space-y-4 ${level > 0 ? 'ml-8 mt-4' : ''}`}>
        <Card className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar
              name={comment.author?.full_name || 'Anonymous'}
              className="h-10 w-10"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">
                    {comment.author?.full_name || 'Anonymous'}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {comment.author?.role} • {comment.author?.specialty}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {comment.is_pinned && (
                    <Badge variant="primary">Pinned</Badge>
                  )}
                  {comment.comment_type !== 'standard' && (
                    <Badge variant="secondary">{comment.comment_type}</Badge>
                  )}
                </div>
              </div>

              <p className="mt-2 text-gray-700">{comment.content}</p>

              {comment.image_path && (
                <img
                  src={comment.image_path}
                  alt="Comment attachment"
                  className="mt-2 max-w-sm rounded-lg"
                />
              )}

              <div className="mt-4 flex items-center space-x-4">
                <button
                  onClick={() => onReplyToComment(comment)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reply
                </button>
                {isAuthor && (
                  <button
                    onClick={() => onEditComment(comment)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Edit
                  </button>
                )}
                {canModerate && (
                  <>
                    <button
                      onClick={() => {/* TODO: Implement pin/unpin */}}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {comment.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement hide/show */}}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {comment.is_hidden ? 'Show' : 'Hide'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {comment.replies?.map((reply) => renderComment(reply, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {comments.length === 0 ? (
        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
      ) : (
        comments.map((comment) => renderComment(comment))
      )}
    </div>
  );
}; 