import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createMinioClient } from './minio-client';

// S3 Client configuration
const createS3Client = () => {
  const config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  };

  // For Digital Ocean Spaces
  if (process.env.SPACES_ENDPOINT) {
    config.endpoint = process.env.SPACES_ENDPOINT;
    config.forcePathStyle = true;
  }

  // For Cloudflare R2
  if (process.env.CLOUDFLARE_ENDPOINT) {
    config.endpoint = process.env.CLOUDFLARE_ENDPOINT;
    config.forcePathStyle = true;
    config.region = 'auto';
  }

  // For MinIO
  if (process.env.MINIO_ENDPOINT) {
    return createMinioClient();
  }

  return new S3Client(config);
};

const s3Client = createS3Client();
const bucketName = process.env.AWS_S3_BUCKET || process.env.SPACES_BUCKET || process.env.MINIO_BUCKET || process.env.CLOUDFLARE_BUCKET || '';

export interface FileObject {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export interface UploadResponse {
  success: boolean;
  key?: string;
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Upload file to S3
export async function uploadFile(file: File, key: string): Promise<UploadResponse & { publicUrl?: string }> {
  try {
    // Convert File to Buffer for MinIO compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make file public
      // Disable checksum calculation for MinIO compatibility
      ChecksumAlgorithm: undefined,
    });

    await s3Client.send(command);

    // Construct public URL
    let publicUrl = '';
    if (process.env.MINIO_ENDPOINT) {
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
      // Remove trailing slash if present
      const endpoint = process.env.MINIO_ENDPOINT.replace(/\/$/, '');
      publicUrl = `${protocol}://${endpoint}/${bucketName}/${key}`;
    } else if (process.env.SPACES_ENDPOINT) {
       // DigitalOcean Spaces
       const endpoint = process.env.SPACES_ENDPOINT.replace(/\/$/, '').replace('https://', '');
       publicUrl = `https://${bucketName}.${endpoint}/${key}`;
    } else if (process.env.CLOUDFLARE_PUBLIC_URL) {
      // Cloudflare R2
      const publicEndpoint = process.env.CLOUDFLARE_PUBLIC_URL.replace(/\/$/, '');
      publicUrl = `${publicEndpoint}/${key}`;
    } else {
      // Standard AWS S3
      const region = process.env.AWS_REGION || 'us-east-1';
      publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    }

    return { success: true, key, publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle MinIO-specific errors
    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      if (error.message.includes('Tag') && error.message.includes('invalid name')) {
        errorMessage = 'MinIO configuration error: Check your bucket permissions and credentials';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied: Check your MinIO credentials and bucket permissions';
      } else if (error.message.includes('404')) {
        errorMessage = 'Bucket not found: Make sure the bucket exists in MinIO';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

// Get download URL for file
export async function getDownloadUrl(key: string): Promise<DownloadResponse> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return { success: true, url };
  } catch (error) {
    console.error('Download URL error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate download URL' };
  }
}

// Delete file from S3
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
}

// List files in S3
export async function listFiles(prefix?: string): Promise<{ success: boolean; files?: FileObject[]; error?: string }> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    const files: FileObject[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          files.push({
            key: object.Key,
            size: object.Size || 0,
            lastModified: object.LastModified || new Date(),
            etag: object.ETag || '',
          });
        }
      }
    }

    return { success: true, files };
  } catch (error) {
    console.error('List files error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list files' };
  }
} 