'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function MinioSetupGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        MinIO Setup Guide
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border p-6 z-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">MinIO Setup Guide</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">1. Install MinIO</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600 mb-2">Using Docker:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  docker run -p 9000:9000 -p 9001:9001 --name minio \
                  -e "MINIO_ROOT_USER=minioadmin" \
                  -e "MINIO_ROOT_PASSWORD=minioadmin" \
                  -v minio_data:/data \
                  quay.io/minio/minio server /data --console-address ":9001"
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">2. Create Bucket</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600 mb-2">Access MinIO Console at http://localhost:9001</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Login with minioadmin/minioadmin</li>
                  <li>• Create a new bucket</li>
                  <li>• Note the bucket name for your .env.local</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">3. Environment Variables</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600 mb-2">Add to your .env.local:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  AWS_ACCESS_KEY_ID=minioadmin<br/>
                  AWS_SECRET_ACCESS_KEY=minioadmin<br/>
                  AWS_REGION=us-east-1<br/>
                  MINIO_ENDPOINT=http://localhost:9000<br/>
                  MINIO_BUCKET=your-bucket-name
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">4. Common Issues</h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />
                  <div className="text-xs text-gray-600">
                    <p className="font-medium">Hash calculation error</p>
                    <p>Fixed by converting files to Buffer and disabling checksums</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />
                  <div className="text-xs text-gray-600">
                    <p className="font-medium">SSL certificate errors</p>
                    <p>Disabled SSL verification for localhost connections</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />
                  <div className="text-xs text-gray-600">
                    <p className="font-medium">Bucket not found</p>
                    <p>Make sure the bucket exists in MinIO console</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Production Notes:</p>
                  <p className="mt-1">
                    For production, use proper SSL certificates and remove the 
                    rejectUnauthorized: false setting from the configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 