import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const VerificationUpload: React.FC = () => {
  const { uploadVerificationDocument } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    setUploading(true);
    try {
      const documentUrl = await uploadVerificationDocument(file);
      setStatus('Document uploaded successfully. Awaiting admin review.');
      toast.success('Document uploaded successfully.');
    } catch (error) {
      setStatus('Upload failed. Please try again.');
      toast.error('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Upload Verification Documents</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Document</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="mt-1 block w-full"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
        <button
          type="submit"
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
    </div>
  );
};

export default VerificationUpload; 