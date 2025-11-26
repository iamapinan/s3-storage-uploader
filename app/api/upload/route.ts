import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique key for the file
    const fileExtension = file.name.split('.').pop();
    const key = `${uuidv4()}.${fileExtension}`;

    // For MinIO compatibility, convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(file, key);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        key: result.key,
        originalName: file.name,
        size: file.size,
        type: file.type,
        publicUrl: result.publicUrl
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed',
      details: 'This might be due to MinIO configuration issues. Check your MinIO server and credentials.'
    }, { status: 500 });
  }
} 