import { NextRequest, NextResponse } from 'next/server';
import { createMultipartUpload } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and content type are required' },
        { status: 400 }
      );
    }

    const result = await createMultipartUpload(filename, contentType);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        uploadId: result.uploadId,
        key: filename 
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Initiate upload error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate upload' },
      { status: 500 }
    );
  }
}
