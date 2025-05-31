import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch initial notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications.');
      } else {
        setNotifications(data);
      }
      setLoading(false);

      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications((current) => [payload.new as Notification, ...current]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to mark notification as read.');
    } else {
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      toast.error('Failed to mark all notifications as read.');
    } else {
      setNotifications((current) =>
        current.map((n) => ({ ...n, is_read: true }))
      );
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Mark All as Read
        </button>
      </div>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded ${
                notification.is_read ? 'bg-white' : 'bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-gray-600">{notification.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList; 