import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface VerificationRequest {
  id: string;
  user_id: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const VerificationReviewList: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching verification requests:', error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    };

    fetchRequests();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Verification Requests (Admin)</h2>
      {requests.length === 0 ? (
        <p>No pending verification requests.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="border p-4 rounded">
              <p><strong>User ID:</strong> {request.user_id}</p>
              <p><strong>Document URL:</strong> <a href={request.document_url} target="_blank" rel="noopener noreferrer">View Document</a></p>
              <p><strong>Created At:</strong> {new Date(request.created_at).toLocaleString()}</p>
              <Link to={`/admin/verification/${request.id}`} className="text-blue-500 hover:underline">Review Request</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VerificationReviewList; 