'use client';

import { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function MinioTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runTest = async () => {
    setRunning(true);
    setTestResults(null);

    try {
      // Test 1: Upload a small test file
      const testFile = new File(['Hello MinIO! This is a test file.'], 'test.txt', {
        type: 'text/plain',
      });

      const formData = new FormData();
      formData.append('file', testFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload test failed');
      }

      const uploadData = await uploadResponse.json();
      const testKey = uploadData.key;

      // Test 2: Get download URL
      const downloadResponse = await fetch(`/api/files/${encodeURIComponent(testKey)}`);
      if (!downloadResponse.ok) {
        throw new Error('Download URL test failed');
      }

      const downloadData = await downloadResponse.json();

      // Test 3: Delete the test file
      const deleteResponse = await fetch(`/api/files/${encodeURIComponent(testKey)}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Delete test failed');
      }

      setTestResults({
        success: true,
        tests: {
          upload: { success: true, key: testKey },
          download: { success: true, url: downloadData.url },
          delete: { success: true },
        },
        message: 'All tests passed! MinIO is working correctly.',
      });

    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Test failed. Check your MinIO configuration.',
      });
    } finally {
      setRunning(false);
    }
  };

  const getTestIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <Play className="h-4 w-4 mr-2" />
        MinIO Test
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">MinIO Connection Test</h3>
            <button
              onClick={runTest}
              disabled={running}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {running ? 'Running...' : 'Run Test'}
            </button>
          </div>

          {running && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Testing MinIO connection...</span>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              <div className={`p-3 rounded-md ${
                testResults.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {testResults.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    testResults.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResults.message}
                  </span>
                </div>
              </div>

              {testResults.success && testResults.tests && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Test Results:</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Upload Test</span>
                      {getTestIcon(testResults.tests.upload.success)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Download Test</span>
                      {getTestIcon(testResults.tests.download.success)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Delete Test</span>
                      {getTestIcon(testResults.tests.delete.success)}
                    </div>
                  </div>
                </div>
              )}

              {testResults.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Error Details</h4>
                  <p className="text-xs text-red-600">{testResults.error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium">Test Information:</p>
                    <p className="mt-1">
                      This test uploads a small text file, generates a download URL, 
                      and then deletes the file to verify your MinIO setup is working correctly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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