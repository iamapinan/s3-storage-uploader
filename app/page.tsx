'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
// import StorageConfig from '@/components/StorageConfig';
// import DiagnosticPanel from '@/components/DiagnosticPanel';
// import MinioTest from '@/components/MinioTest';
// import MinioSetupGuide from '@/components/MinioSetupGuide';
import { Cloud, Upload, Folder, LogOut } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('upload');
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleUploadSuccess = () => {
    // setActiveTab('files'); // Keep user on upload tab to see the URL
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">กำลังตรวจสอบ...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Show nothing while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Cloud className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">ระบบจัดการไฟล์ S3</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                พื้นที่จัดเก็บไฟล์บนคลาวด์ที่ปลอดภัย
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              อัปโหลดไฟล์
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Folder className="h-4 w-4 mr-2" />
              ไฟล์ของฉัน
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                อัปโหลดไฟล์ของคุณ
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                จัดเก็บไฟล์ของคุณอย่างปลอดภัยบนคลาวด์ ลากและวางไฟล์หรือคลิกเพื่อเลือกไฟล์
                ไฟล์ทั้งหมดจะถูกเข้ารหัสและจัดเก็บอย่างปลอดภัย
              </p>
            </div>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                จัดการไฟล์ของคุณ
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                ดู ดาวน์โหลด แชร์ และลบไฟล์ที่จัดเก็บไว้ การดำเนินการทั้งหมดมีความปลอดภัยและเป็นส่วนตัว
              </p>
            </div>
            <FileList />
          </div>
        )}
      </main>

    </div>
  );
} 