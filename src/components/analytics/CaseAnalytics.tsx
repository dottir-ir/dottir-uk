import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CaseAnalytics {
  id: string;
  case_id: string;
  date: string;
  view_count: number;
  comment_count: number;
  collection_count: number;
}

const CaseAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<CaseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const { data, error } = await supabase
        .from('case_analytics')
        .select('*')
        .eq('case_id', id)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data.');
      } else {
        setAnalytics(data);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [id, timeRange]);

  const totalViews = analytics.reduce((sum, day) => sum + day.view_count, 0);
  const totalComments = analytics.reduce((sum, day) => sum + day.comment_count, 0);
  const totalCollections = analytics.reduce(
    (sum, day) => sum + day.collection_count,
    0
  );

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Case Analytics</h2>
        <div className="space-x-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded ${
              timeRange === '7d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded ${
              timeRange === '30d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 rounded ${
              timeRange === '90d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Views</h3>
          <p className="text-3xl font-bold text-blue-600">{totalViews}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Comments</h3>
          <p className="text-3xl font-bold text-green-600">{totalComments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Total Collections
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {totalCollections}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Daily Activity</h3>
        <div className="space-y-4">
          {analytics.map((day) => (
            <div key={day.date} className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {new Date(day.date).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Views</span>
                  <p className="font-semibold">{day.view_count}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Comments</span>
                  <p className="font-semibold">{day.comment_count}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Collections</span>
                  <p className="font-semibold">{day.collection_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaseAnalytics; 