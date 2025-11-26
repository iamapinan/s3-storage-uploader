# S3 File Manager

A modern web application for managing files in S3-compatible storage services like AWS S3, Digital Ocean Spaces, MinIO, and more.

## Features

- ✅ **Upload Files**: Drag and drop or click to upload files to S3-compatible storage
- ✅ **Download Files**: Download files with secure, time-limited URLs
- ✅ **Delete Files**: Remove files from storage with confirmation
- ✅ **View Files**: Browse all uploaded files with metadata
- ✅ **Share Files**: Generate shareable links for files (expires in 1 hour)
- ✅ **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- ✅ **Multiple Storage Support**: Works with AWS S3, Digital Ocean Spaces, MinIO, and other S3-compatible services

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: AWS S3 SDK v3
- **File Handling**: Native File API

## Prerequisites

- Node.js 18+ 
- npm or yarn
- S3-compatible storage service (AWS S3, Digital Ocean Spaces, MinIO, etc.)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd s3-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your storage credentials:

   **For AWS S3:**
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your_bucket_name
   ```

   **For Digital Ocean Spaces:**
   ```env
   AWS_ACCESS_KEY_ID=your_spaces_key
   AWS_SECRET_ACCESS_KEY=your_spaces_secret
   AWS_REGION=nyc3
   SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   SPACES_BUCKET=your_spaces_bucket
   ```

   **For MinIO:**
   ```env
   AWS_ACCESS_KEY_ID=your_minio_access_key
   AWS_SECRET_ACCESS_KEY=your_minio_secret_key
   AWS_REGION=us-east-1
   MINIO_ENDPOINT=http://localhost:9000
   MINIO_BUCKET=your_minio_bucket
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Uploading Files
1. Navigate to the "Upload Files" tab
2. Drag and drop files onto the upload area or click "Choose Files"
3. Files will be uploaded with unique names to prevent conflicts
4. After successful upload, you'll be redirected to the file list

### Managing Files
1. Go to the "My Files" tab to view all uploaded files
2. Use the action buttons to:
   - **Download**: Get a secure download link
   - **Share**: Generate a shareable link (copied to clipboard)
   - **Delete**: Remove the file (with confirmation)

### File Sharing
- Share links are valid for 1 hour
- Links provide direct download access
- No authentication required for shared files

## API Endpoints

- `POST /api/upload` - Upload a file
- `GET /api/files` - List all files
- `GET /api/files/[key]` - Get download URL for a file
- `DELETE /api/files/[key]` - Delete a file
- `POST /api/share` - Generate share link for a file

## Configuration Options

### AWS S3
- Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_S3_BUCKET`

### Digital Ocean Spaces
- Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SPACES_ENDPOINT`, and `SPACES_BUCKET`

### MinIO
- Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `MINIO_ENDPOINT`, and `MINIO_BUCKET`

## Security Features

- Files are uploaded with unique UUIDs to prevent conflicts
- Download URLs are signed and expire after 1 hour
- Share links are time-limited for security
- All API endpoints include proper error handling

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include your environment setup and error messages

## Roadmap

- [ ] User authentication and authorization
- [ ] Folder organization
- [ ] File preview for images and documents
- [ ] Bulk operations (upload, delete, download)
- [ ] File versioning
- [ ] Advanced sharing options (password protection, expiration dates)
- [ ] Mobile app
- [ ] API rate limiting
- [ ] File compression
- [ ] Integration with cloud storage analytics 