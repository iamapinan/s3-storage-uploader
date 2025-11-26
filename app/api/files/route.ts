import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;

    const result = await listFiles(prefix);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        files: result.files 
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('List files API error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
} 