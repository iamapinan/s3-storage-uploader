import { NextRequest, NextResponse } from 'next/server';
import { completeMultipartUpload } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const { uploadId, key } = await request.json();

    if (!uploadId || !key) {
      return NextResponse.json(
        { error: 'UploadId and key are required' },
        { status: 400 }
      );
    }

    const result = await completeMultipartUpload(key, uploadId);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        location: result.location,
        key: key
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Complete upload error:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
