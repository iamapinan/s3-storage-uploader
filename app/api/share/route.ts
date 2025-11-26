import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    const result = await getDownloadUrl(key);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        shareUrl: result.url,
        expiresIn: '1 hour'
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Failed to generate share URL' }, { status: 500 });
  }
} 