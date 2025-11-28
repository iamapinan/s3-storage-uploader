import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  CompletedPart
} from '@aws-sdk/client-s3';
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

// Initiate Multipart Upload
export async function createMultipartUpload(key: string, contentType: string): Promise<{ success: boolean; uploadId?: string; error?: string }> {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const response = await s3Client.send(command);
    return { success: true, uploadId: response.UploadId };
  } catch (error) {
    console.error('Create multipart upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to initiate upload' };
  }
}

// Get Presigned URL for Upload Part
export async function getUploadPartUrl(key: string, uploadId: string, partNumber: number): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new UploadPartCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { success: true, url };
  } catch (error) {
    console.error('Get upload part URL error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get part URL' };
  }
}

// Complete Multipart Upload
export async function completeMultipartUpload(key: string, uploadId: string, parts?: CompletedPart[]): Promise<{ success: boolean; location?: string; error?: string }> {
  try {
    // Fetch uploaded parts from S3 to ensure we have valid ETags and PartNumbers
    // This avoids issues where the client might send invalid/missing ETags (e.g. due to CORS)
    const listPartsCommand = new ListPartsCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
    });

    const { Parts } = await s3Client.send(listPartsCommand);

    if (!Parts || Parts.length === 0) {
      return { success: false, error: 'No parts found for this upload' };
    }

    // Construct CompletedPart array from S3 response
    const completedParts: CompletedPart[] = Parts.map(part => ({
      ETag: part.ETag,
      PartNumber: part.PartNumber,
    }));

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: completedParts,
      },
    });

    const response = await s3Client.send(command);
    
    // Construct public URL (reuse logic from uploadFile if possible, or just use Location)
    let publicUrl = response.Location;
    
    // Re-construct public URL to ensure consistency with uploadFile logic
    if (process.env.MINIO_ENDPOINT) {
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
      const endpoint = process.env.MINIO_ENDPOINT.replace(/\/$/, '');
      publicUrl = `${protocol}://${endpoint}/${bucketName}/${key}`;
    } else if (process.env.SPACES_ENDPOINT) {
       const endpoint = process.env.SPACES_ENDPOINT.replace(/\/$/, '').replace('https://', '');
       publicUrl = `https://${bucketName}.${endpoint}/${key}`;
    } else if (process.env.CLOUDFLARE_PUBLIC_URL) {
      const publicEndpoint = process.env.CLOUDFLARE_PUBLIC_URL.replace(/\/$/, '');
      publicUrl = `${publicEndpoint}/${key}`;
    } else if (!publicUrl) {
       const region = process.env.AWS_REGION || 'us-east-1';
       publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    }

    return { success: true, location: publicUrl };
  } catch (error) {
    console.error('Complete multipart upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to complete upload' };
  }
}

// Abort Multipart Upload
export async function abortMultipartUpload(key: string, uploadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Abort multipart upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to abort upload' };
  }
} 