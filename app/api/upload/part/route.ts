import { NextRequest, NextResponse } from 'next/server';
import { getUploadPartUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const { uploadId, key, partNumber } = await request.json();

    if (!uploadId || !key || !partNumber) {
      return NextResponse.json(
        { error: 'UploadId, key, and partNumber are required' },
        { status: 400 }
      );
    }

    const result = await getUploadPartUrl(key, uploadId, partNumber);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        url: result.url 
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Get upload part URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload part URL' },
      { status: 500 }
    );
  }
}
