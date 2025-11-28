'use client';

import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, []);

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Step 1: Get presigned URL from API
        const urlResponse = await fetch('/api/get-upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        if (!urlResponse.ok) {
          const errorData = await urlResponse.json();
          throw new Error(errorData.error || `Failed to get upload URL for ${file.name}`);
        }

        const { presignedUrl, publicUrl } = await urlResponse.json();

        // Step 2: Upload file directly to S3 using presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name} to storage`);
        }

        // Step 3: Store the public URL
        if (publicUrl) {
          setUploadedFiles(prev => [...prev, { name: file.name, url: publicUrl }]);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      alert('การอัปโหลดล้มเหลว โปรดลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว!');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="text-lg font-medium text-gray-900">
              กำลังอัปโหลดไฟล์...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">
              {Math.round(uploadProgress)}% เสร็จสิ้น
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-lg font-medium text-gray-900">
              ลากไฟล์มาวางที่นี่หรือคลิกเพื่อเลือกไฟล์
            </div>
            <div className="text-sm text-gray-500">
              รองรับไฟล์ทุกประเภท ไฟล์จะถูกจัดเก็บอย่างปลอดภัย
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              <File className="mr-2 h-4 w-4" />
              เลือกไฟล์
            </label>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              ไฟล์ที่อัปโหลด
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              ลิงก์ดาวน์โหลดโดยตรงสำหรับไฟล์ที่คุณอัปโหลด
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center truncate">
                    <File className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-blue-600 truncate">
                      {file.name}
                    </span>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-500 text-sm"
                  >
                    ดาวน์โหลด
                  </a>
                </div>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={file.url}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 text-sm border focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  >
                    คัดลอก
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 