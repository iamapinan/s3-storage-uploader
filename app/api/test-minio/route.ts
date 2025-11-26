import { NextRequest, NextResponse } from 'next/server';
import { createMinioClient } from '@/lib/minio-client';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const requiredVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY', 
      'MINIO_ENDPOINT',
      'MINIO_BUCKET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing environment variables: ${missingVars.join(', ')}`
      }, { status: 400 });
    }

    // Test MinIO connection
    const s3Client = createMinioClient();
    
    try {
      const listBucketsCommand = new ListBucketsCommand({});
      const response = await s3Client.send(listBucketsCommand);
      
      return NextResponse.json({
        success: true,
        message: 'MinIO connection successful',
        buckets: response.Buckets?.map(bucket => bucket.Name) || [],
        endpoint: process.env.MINIO_ENDPOINT,
        bucket: process.env.MINIO_BUCKET
      });
      
    } catch (error) {
      console.error('MinIO connection error:', error);
      
      let errorMessage = 'Connection failed';
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to MinIO server. Make sure MinIO is running.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication failed. Check your MinIO credentials.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Access denied. Check your MinIO permissions.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: 'Make sure MinIO is running and accessible at the configured endpoint.'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Test MinIO error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 