import { supabase } from './supabase';

// ============================================
// SUPABASE STORAGE SERVICE (CLIENT-SAFE)
// ============================================

interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  contentType?: string;
}

interface DownloadOptions {
  bucket: string;
  path: string;
}

class SupabaseStorageService {
  // Default buckets for different media types
  // NOTE: These buckets must be created server-side or via Supabase dashboard
  readonly BUCKETS = {
    AVATARS: 'avatars',
    EPISODES: 'episodes',
    VIDEOS: 'videos',
    THUMBNAILS: 'thumbnails',
    DOCUMENTS: 'documents',
    COMMUNITY: 'community-uploads',
    SPONSORS: 'sponsor-logos',
  };

  // Get file size limit for bucket (client-side validation)
  private getFileSizeLimit(bucket: string): number {
    switch (bucket) {
      case this.BUCKETS.AVATARS:
        return 1024 * 1024 * 2; // 2MB
      case this.BUCKETS.THUMBNAILS:
      case this.BUCKETS.SPONSORS:
        return 1024 * 1024 * 5; // 5MB
      case this.BUCKETS.EPISODES:
      case this.BUCKETS.VIDEOS:
        return 1024 * 1024 * 500; // 500MB
      case this.BUCKETS.DOCUMENTS:
      case this.BUCKETS.COMMUNITY:
        return 1024 * 1024 * 10; // 10MB
      default:
        return 1024 * 1024 * 10; // 10MB default
    }
  }

  // Get allowed MIME types for bucket (client-side validation)
  private getAllowedMimeTypes(bucket: string): string[] | undefined {
    switch (bucket) {
      case this.BUCKETS.AVATARS:
      case this.BUCKETS.THUMBNAILS:
      case this.BUCKETS.SPONSORS:
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      case this.BUCKETS.EPISODES:
        return ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      case this.BUCKETS.VIDEOS:
        return ['video/mp4', 'video/webm', 'video/ogg'];
      case this.BUCKETS.DOCUMENTS:
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      case this.BUCKETS.COMMUNITY:
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
      default:
        return undefined; // Allow all types
    }
  }

  // Upload file to storage (client-safe)
  async uploadFile({ bucket, path, file, upsert = false, contentType }: UploadOptions): Promise<{ url: string; path: string } | null> {
    try {
      // Client-side validation
      const maxSize = this.getFileSizeLimit(bucket);
      if (file.size > maxSize) {
        throw new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
      }

      const allowedTypes = this.getAllowedMimeTypes(bucket);
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed in this bucket`);
      }

      // Generate unique filename
      const fileName = this.generateUniqueFileName(file.name, path);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          contentType: contentType || file.type,
          upsert,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      return null;
    }
  }

  // Download file from storage
  async downloadFile({ bucket, path }: DownloadOptions): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Download error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to download file:', error);
      return null;
    }
  }

  // Delete file from storage (requires proper RLS policies)
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  // List files in a bucket/folder
  async listFiles(bucket: string, folder: string = ''): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('List error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  // Get public URL for a file
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Generate signed URL for private files
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
  }

  // Upload user avatar (user can only update their own)
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    // Ensure user can only upload their own avatar
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      console.error('Unauthorized: Cannot upload avatar for another user');
      return null;
    }

    const result = await this.uploadFile({
      bucket: this.BUCKETS.AVATARS,
      path: `${userId}/`,
      file,
      upsert: true,
    });

    if (result) {
      // Update user profile with new avatar URL
      const { error } = await supabase
        .from('users')
        .update({ avatar: result.url })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update user avatar:', error);
        return null;
      }

      return result.url;
    }

    return null;
  }

  // Upload community attachment (user uploads to their own folder)
  async uploadCommunityAttachment(threadId: number, file: File): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Must be authenticated to upload attachments');
      return null;
    }

    const result = await this.uploadFile({
      bucket: this.BUCKETS.COMMUNITY,
      path: `user-${user.id}/thread-${threadId}/`,
      file,
      upsert: false,
    });

    return result?.url || null;
  }

  // Generate unique file name
  private generateUniqueFileName(originalName: string, path: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
    
    // Sanitize filename
    const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    return `${path}${sanitizedName}-${timestamp}-${randomString}.${extension}`;
  }

  // Validate image dimensions
  async validateImageDimensions(file: File, maxWidth: number, maxHeight: number): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img.width <= maxWidth && img.height <= maxHeight);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      img.src = url;
    });
  }

  // Compress image before upload
  async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Calculate new dimensions (max 1920px width)
        let { width, height } = img;
        const maxWidth = 1920;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }
}

// Export singleton instance
export const storageService = new SupabaseStorageService();

// NOTE: Bucket initialization must be done server-side or via Supabase dashboard
// The following buckets should be created with appropriate RLS policies:
// - avatars (public read, authenticated users can update their own)
// - episodes (public read, admin write)
// - videos (public read, admin write)
// - thumbnails (public read, admin write)
// - documents (authenticated read, admin write)
// - community-uploads (public read, authenticated write to own folder)
// - sponsor-logos (public read, admin write)