'use client';

import { useState } from 'react';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface StorageConfigProps {
  onConfigChange: () => void;
}

export default function StorageConfig({ onConfigChange }: StorageConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    provider: 'aws',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucket: '',
    endpoint: '',
  });

  const handleSave = () => {
    // In a real app, you'd save this to a secure configuration
    // For demo purposes, we'll just show a success message
    alert('Configuration saved! Please restart the app for changes to take effect.');
    setIsOpen(false);
    onConfigChange();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <Settings className="h-4 w-4 mr-2" />
        Storage Config
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border p-6 z-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Provider
              </label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="aws">AWS S3</option>
                <option value="digitalocean">Digital Ocean Spaces</option>
                <option value="minio">MinIO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Key ID
              </label>
              <input
                type="text"
                value={config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your access key ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Access Key
              </label>
              <input
                type="password"
                value={config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your secret access key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <input
                type="text"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., us-east-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bucket Name
              </label>
              <input
                type="text"
                value={config.bucket}
                onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your bucket name"
              />
            </div>

            {(config.provider === 'digitalocean' || config.provider === 'minio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    config.provider === 'digitalocean' 
                      ? 'https://nyc3.digitaloceanspaces.com'
                      : 'http://localhost:9000'
                  }
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Configuration Note:</p>
                  <p className="mt-1">
                    This is a demo configuration panel. In production, you should set these values 
                    as environment variables in your deployment platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 