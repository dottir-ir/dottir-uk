import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface VerificationRequest {
  id: string;
  user_id: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
}

const VerificationReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching verification request:', error);
        toast.error('Failed to load request details.');
      } else {
        setRequest(data);
        setNotes(data.notes || '');
      }
      setLoading(false);
    };

    fetchRequest();
  }, [id]);

  const handleApprove = async () => {
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: 'approved', notes })
      .eq('id', id);

    if (error) {
      toast.error('Failed to approve request.');
    } else {
      toast.success('Request approved successfully.');
      navigate('/admin/verification');
    }
  };

  const handleReject = async () => {
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: 'rejected', notes })
      .eq('id', id);

    if (error) {
      toast.error('Failed to reject request.');
    } else {
      toast.success('Request rejected successfully.');
      navigate('/admin/verification');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!request) {
    return <div>Request not found.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Verification Request Detail (Admin)</h2>
      <div className="space-y-4">
        <p><strong>User ID:</strong> {request.user_id}</p>
        <p><strong>Document URL:</strong> <a href={request.document_url} target="_blank" rel="noopener noreferrer">View Document</a></p>
        <p><strong>Created At:</strong> {new Date(request.created_at).toLocaleString()}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            rows={4}
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationReviewDetail; 