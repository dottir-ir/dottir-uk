import React, { useState } from 'react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { Card } from '../ui/Card';
import { Comment } from '../../types/comments';

interface CommentSystemProps {
  caseId: string;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({ caseId }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | undefined>();
  const [replyingTo, setReplyingTo] = useState<Comment | undefined>();

  const handleCommentSave = (comment: Comment) => {
    setShowForm(false);
    setEditingComment(undefined);
    setReplyingTo(undefined);
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setShowForm(true);
    setReplyingTo(undefined);
  };

  const handleReplyToComment = (comment: Comment) => {
    setReplyingTo(comment);
    setShowForm(true);
    setEditingComment(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingComment(undefined);
    setReplyingTo(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Comment
          </button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CommentForm
            caseId={caseId}
            parentComment={replyingTo}
            editingComment={editingComment}
            onSave={handleCommentSave}
            onCancel={handleCancel}
          />
        </Card>
      )}

      <CommentList
        caseId={caseId}
        onEditComment={handleEditComment}
        onReplyToComment={handleReplyToComment}
      />
    </div>
  );
}; 