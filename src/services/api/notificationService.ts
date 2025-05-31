import { supabase } from '../../lib/supabase';
import { Notification, PaginationParams, SearchResponse } from './types';

export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getNotifications(
    userId: string,
    pagination: PaginationParams
  ): Promise<SearchResponse<Notification>> {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1
      );

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page,
      total_pages: Math.ceil((count || 0) / pagination.limit),
    };
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Helper function to create a notification for a case comment
  async notifyCaseComment(
    caseId: string,
    commentId: string,
    authorId: string,
    mentionedUserIds: string[]
  ): Promise<void> {
    // Get case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('title, author_id')
      .eq('id', caseId)
      .single();

    if (caseError) throw caseError;

    // Create notifications for case author and mentioned users
    const notifications = [
      // Notify case author if they're not the comment author
      ...(caseData.author_id !== authorId
        ? [{
            user_id: caseData.author_id,
            type: 'case_comment',
            title: 'New Comment on Your Case',
            message: `Someone commented on your case "${caseData.title}"`,
            read: false,
            data: { case_id: caseId, comment_id: commentId },
          }]
        : []),
      // Notify mentioned users
      ...mentionedUserIds.map(userId => ({
        user_id: userId,
        type: 'mention',
        title: 'You Were Mentioned',
        message: `You were mentioned in a comment on case "${caseData.title}"`,
        read: false,
        data: { case_id: caseId, comment_id: commentId },
      })),
    ];

    if (notifications.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    }
  },

  // Helper function to create a notification for case status change
  async notifyCaseStatusChange(
    caseId: string,
    caseTitle: string,
    newStatus: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'case_update',
        title: 'Case Status Updated',
        message: `Case "${caseTitle}" status has been updated to ${newStatus}`,
        read: false,
        data: { case_id: caseId, new_status: newStatus },
      }]);

    if (error) throw error;
  },
}; 