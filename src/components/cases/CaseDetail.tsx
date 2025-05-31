import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Case, Comment } from '../../services/api/types';
import { caseService } from '../../services/api/caseService';
import { commentService } from '../../services/api/commentService';
import { useProfiles } from '../../hooks/useProfiles';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [case_, setCase] = useState<Case | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [newComment, setNewComment] = useState('');

  const { profiles, isLoading: isLoadingProfiles } = useProfiles(
    case_ ? [case_.author_id, ...comments.map(c => c.author_id)] : []
  );

  React.useEffect(() => {
    const fetchCase = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const [caseData, commentsData] = await Promise.all([
          caseService.getCase(id),
          commentService.getCaseComments(id, { page: 1, limit: 50 })
        ]);
        setCase(caseData);
        setComments(commentsData.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch case'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    try {
      const comment = await commentService.createComment({
        case_id: id,
        content: newComment,
        author_id: 'current-user-id', // TODO: Get from auth context
      });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  if (isLoading || isLoadingProfiles) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (error || !case_) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        <p>Error: {error?.message || 'Case not found'}</p>
      </div>
    );
  }

  const author = profiles[case_.author_id];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Avatar src={author?.avatar_url} alt={author?.full_name || 'Unknown'} />
            <div>
              <p className="text-sm font-medium">{author?.full_name || 'Unknown Author'}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(case_.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge variant={case_.status === 'open' ? 'default' : 'secondary'}>
              {case_.status}
            </Badge>
            <Badge variant="outline">{case_.visibility}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">{case_.title}</h1>
          <div className="prose max-w-none mb-6">
            {case_.content}
          </div>
          {case_.tags && case_.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {case_.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {case_.attachments && case_.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Attachments</h3>
              <div className="grid gap-2">
                {case_.attachments.map(attachment => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-primary hover:underline"
                  >
                    <span>{attachment.file_name}</span>
                    <span className="text-muted-foreground">
                      ({(attachment.file_size / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Comments</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Post Comment
            </button>
          </form>

          <div className="space-y-4">
            {comments.map(comment => {
              const commentAuthor = profiles[comment.author_id];
              return (
                <div key={comment.id} className="flex space-x-4">
                  <Avatar
                    src={commentAuthor?.avatar_url}
                    alt={commentAuthor?.full_name || 'Unknown'}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {commentAuthor?.full_name || 'Unknown'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 