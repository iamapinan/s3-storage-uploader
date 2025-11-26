import { S3Client } from '@aws-sdk/client-s3';

// Specialized MinIO client configuration
export function createMinioClient() {
  const config = {
    endpoint: process.env.MINIO_ENDPOINT!,
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
    // MinIO-specific settings to avoid XML parsing issues
    maxAttempts: 1,
    retryMode: 'standard' as const,
    // Disable SSL verification for localhost
    ...(process.env.MINIO_ENDPOINT?.includes('localhost') && {
      requestHandler: {
        httpOptions: {
          rejectUnauthorized: false
        }
      }
    })
  };

  return new S3Client(config);
}

// Alternative configuration for better MinIO compatibility
export function createMinioClientV2() {
  const config = {
    endpoint: process.env.MINIO_ENDPOINT!,
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
    // More conservative settings for MinIO
    maxAttempts: 1,
    retryMode: 'standard' as const,
    // Disable request compression for MinIO
    requestHandler: {
      httpOptions: {
        rejectUnauthorized: false,
        // Disable compression to avoid parsing issues
        compress: false
      }
    }
  };

  return new S3Client(config);
} 