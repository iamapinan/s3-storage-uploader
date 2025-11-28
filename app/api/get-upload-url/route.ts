import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;
    
    if (!fileName || !fileType) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName and fileType' 
      }, { status: 400 });
    }

    // Generate unique key for the file
    const fileExtension = fileName.split('.').pop();
    const key = `${uuidv4()}.${fileExtension}`;

    const result = await getPresignedUploadUrl(fileName, fileType, key);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        presignedUrl: result.presignedUrl,
        publicUrl: result.publicUrl,
        key: result.key,
        originalName: fileName,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Get upload URL error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate upload URL'
    }, { status: 500 });
  }
}
