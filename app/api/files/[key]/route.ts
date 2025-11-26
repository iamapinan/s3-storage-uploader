import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl, deleteFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key);
    const result = await getDownloadUrl(key);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        url: result.url 
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key);
    const result = await deleteFile(key);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
} 