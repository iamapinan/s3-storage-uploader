'use client';

import { useState, useEffect } from 'react';
import { Download, Trash2, Share2, File, Calendar, HardDrive } from 'lucide-react';
import { FileObject } from '@/lib/s3';

export default function FileList() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
      } else {
        setError(data.error || 'โหลดไฟล์ไม่สำเร็จ');
      }
    } catch (error) {
      setError('โหลดไฟล์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (key: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`);
      const data = await response.json();

      if (data.success && data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = key.split('/').pop() || key;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('ดาวน์โหลดไฟล์ไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('ดาวน์โหลดไฟล์ไม่สำเร็จ');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setFiles(files.filter(file => file.key !== key));
      } else {
        alert('ลบไฟล์ไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('ลบไฟล์ไม่สำเร็จ');
    }
  };

  const handleShare = async (key: string) => {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();

      if (data.success && data.shareUrl) {
        setShareUrl(data.shareUrl);
        // Copy to clipboard
        navigator.clipboard.writeText(data.shareUrl);
        alert('คัดลอกลิงก์สำหรับแชร์ไปยังคลิปบอร์ดแล้ว!');
      } else {
        alert('สร้างลิงก์แชร์ไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('สร้างลิงก์แชร์ไม่สำเร็จ');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchFiles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบไฟล์</h3>
        <p className="text-gray-500">อัปโหลดไฟล์เพื่อเริ่มต้นใช้งาน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">ไฟล์ของคุณ</h2>
        <button
          onClick={fetchFiles}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          รีเฟรช
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ไฟล์
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ขนาด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แก้ไขเมื่อ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <File className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {file.key.split('/').pop() || file.key}
                        </div>
                        <div className="text-sm text-gray-500">
                          {file.key}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.lastModified)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDownload(file.key)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="ดาวน์โหลด"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleShare(file.key)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="แชร์"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.key)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 