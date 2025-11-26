import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { createMinioClient } from '@/lib/minio-client';

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasRegion: !!process.env.AWS_REGION,
      hasMinioEndpoint: !!process.env.MINIO_ENDPOINT,
      hasMinioBucket: !!process.env.MINIO_BUCKET,
    },
    connection: {
      success: false,
      error: null,
      bucketExists: false,
      bucketAccessible: false,
    },
    configuration: {
      endpoint: process.env.MINIO_ENDPOINT || 'Not set',
      bucket: process.env.MINIO_BUCKET || 'Not set',
      region: process.env.AWS_REGION || 'Not set',
    }
  };

  try {
    // Check if all required environment variables are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Missing AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY)');
    }

    if (!process.env.MINIO_ENDPOINT) {
      throw new Error('Missing MinIO endpoint (MINIO_ENDPOINT)');
    }

    if (!process.env.MINIO_BUCKET) {
      throw new Error('Missing MinIO bucket (MINIO_BUCKET)');
    }

    // Create S3 client for MinIO using specialized configuration
    const s3Client = createMinioClient();

    // Test basic connection by listing buckets
    try {
      const listBucketsCommand = new ListBucketsCommand({});
      await s3Client.send(listBucketsCommand);
      diagnostics.connection.success = true;
    } catch (error) {
      throw new Error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test bucket access
    try {
      const headBucketCommand = new HeadBucketCommand({
        Bucket: process.env.MINIO_BUCKET,
      });
      await s3Client.send(headBucketCommand);
      diagnostics.connection.bucketExists = true;
      diagnostics.connection.bucketAccessible = true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        diagnostics.connection.bucketExists = false;
        diagnostics.connection.error = 'Bucket does not exist';
      } else {
        diagnostics.connection.bucketAccessible = false;
        diagnostics.connection.error = `Bucket access failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

  } catch (error) {
    diagnostics.connection.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(diagnostics);
} 