'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';

interface DiagnosticData {
  timestamp: string;
  environment: {
    hasAccessKeyId: boolean;
    hasSecretAccessKey: boolean;
    hasRegion: boolean;
    hasMinioEndpoint: boolean;
    hasMinioBucket: boolean;
  };
  connection: {
    success: boolean;
    error: string | null;
    bucketExists: boolean;
    bucketAccessible: boolean;
  };
  configuration: {
    endpoint: string;
    bucket: string;
    region: string;
  };
}

export default function DiagnosticPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/diagnostic');
      if (!response.ok) {
        throw new Error('Failed to run diagnostics');
      }
      
      const data = await response.json();
      setDiagnostics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getConnectionStatus = () => {
    if (!diagnostics) return { icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, text: 'Unknown' };
    
    if (diagnostics.connection.success && diagnostics.connection.bucketAccessible) {
      return { icon: <Wifi className="h-4 w-4 text-green-500" />, text: 'Connected' };
    } else if (diagnostics.connection.success) {
      return { icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, text: 'Connected (Bucket issues)' };
    } else {
      return { icon: <WifiOff className="h-4 w-4 text-red-500" />, text: 'Disconnected' };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <Settings className="h-4 w-4 mr-2" />
        MinIO Diagnostic
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">MinIO Diagnostic</h3>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Running diagnostics...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Connection Status</span>
                  <div className="flex items-center">
                    {connectionStatus.icon}
                    <span className="ml-2 text-sm text-gray-600">{connectionStatus.text}</span>
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Environment Variables</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">AWS_ACCESS_KEY_ID</span>
                    {getStatusIcon(diagnostics.environment.hasAccessKeyId)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">AWS_SECRET_ACCESS_KEY</span>
                    {getStatusIcon(diagnostics.environment.hasSecretAccessKey)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">AWS_REGION</span>
                    {getStatusIcon(diagnostics.environment.hasRegion)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">MINIO_ENDPOINT</span>
                    {getStatusIcon(diagnostics.environment.hasMinioEndpoint)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">MINIO_BUCKET</span>
                    {getStatusIcon(diagnostics.environment.hasMinioBucket)}
                  </div>
                </div>
              </div>

              {/* Configuration Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Endpoint:</span>
                    <span className="text-gray-900 font-mono">{diagnostics.configuration.endpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bucket:</span>
                    <span className="text-gray-900 font-mono">{diagnostics.configuration.bucket}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span>
                    <span className="text-gray-900 font-mono">{diagnostics.configuration.region}</span>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Connection Test</span>
                    {getStatusIcon(diagnostics.connection.success)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Bucket Exists</span>
                    {getStatusIcon(diagnostics.connection.bucketExists)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Bucket Accessible</span>
                    {getStatusIcon(diagnostics.connection.bucketAccessible)}
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {diagnostics.connection.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Error Details</h4>
                  <p className="text-xs text-red-600">{diagnostics.connection.error}</p>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center">
                Last updated: {new Date(diagnostics.timestamp).toLocaleString()}
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