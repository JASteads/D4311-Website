import type { Account } from "./account-manager";

import { basicAdminAccessRequest } from "./permissions";

export class ImageUploader {
    private uploadType;
    private includeThumbnail = false;
    private pendingUpload: File | null = null;

    constructor(uploadType = '', includeThumbnail = false) {
        uploadType = encodeURIComponent(uploadType);

        // ex. spLaSH --> Splash
        this.uploadType = (uploadType.length >= 2) ? 
            uploadType[0].toUpperCase() + uploadType.substring(1).toLowerCase() :
            'Misc';
        this.includeThumbnail = includeThumbnail;
    }

    isReady = () => !(!this.pendingUpload);
    
    browse = (preview: HTMLElement | null) => {
        const input = document.createElement('input');
        input.type = 'file';
    
        const handleBrowse = (e: Event) => {
            const handleError = (con: boolean, message: string) => {
                if (!con) {
                    alert(message);
                    input.removeEventListener('change', handleBrowse);
                }
                return con;
            }
    
            const files = (e.target as HTMLInputElement).files;
            if (!files) {
                console.error('File not found');
                return;
            }
            const target = files[0];

            // Handle errors
            if (!handleError(target.type === 'image/png', 'File must be a PNG')) return;

            this.pendingUpload = target;

            // Neatly fix long file names in the preview
            if (preview) {
                const charLimit = 23; // Just a number that fits the most neatly in the box
                let previewName = this.pendingUpload.name;
                if (previewName.length > charLimit) {
                    previewName = previewName.substring(0, charLimit).concat('...');
                }
                
                preview.textContent = previewName;
            }
        }
    
        input.addEventListener('change', handleBrowse, { once: true });
        input.click();
    }
    
    upload = async (user: Account, id: number) => {
        if (!await basicAdminAccessRequest(user)) {
            console.warn('Access denied');
            return false;
        }
        
        if (!this.pendingUpload) {
            console.warn(`No file has been prepared to upload`);
            return false;
        }

        const root = `${import.meta.env.VITE_API_URL}/api/image`;
        const fixedName = encodeURIComponent(`${this.uploadType.toLowerCase()}_${id}.png`);

        // ============= FULL IMAGE UPLOAD =============
        try {
            const res = await fetch(`${root}?type=${this.uploadType}`, {
                method: 'POST',
                body: this.pendingUpload,
                headers: { 
                    'Content-Type': this.pendingUpload.type || 'application/octet-stream',
                    'X-File-Name': fixedName
                },
                credentials: 'include'
            });
    
            if (!res.ok) {
                console.error('Upload failed..');
                throw new Error(`HTTP Error: ${res.status}`);
            }
        } catch (e) {
            alert(`File upload failed: ${e}`);
            return false;
        }

        // ============= THUMBNAIL UPLOAD =============
        if (!this.includeThumbnail) {
            alert('File uploaded successfully');
            return true;
        }

        try {
            const thumbnail = await this.generateThumbnail();
            const thumbnailFile = new File([thumbnail],
                encodeURIComponent(`preview_${fixedName}`),
                { type: thumbnail.type }
            );

            const res = await fetch(`${root}?type=${this.uploadType}&isThumbnail=true`, {
                method: 'POST',
                body: thumbnailFile,
                headers: { 
                    'Content-Type': thumbnailFile.type || 'application/octet-stream',
                    'X-File-Name': thumbnailFile.name
                },
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }
        } catch (e) {
            console.error('Thumbnail upload failed:', e);
            return false;
        }
        
        alert('Files uploaded successfully');
        return true;
    }

    private generateThumbnail = async () => {
        // We know this won't be null by the time it's called
        const bitmap = await createImageBitmap(this.pendingUpload!);
        const maxSize = 400;
        const imageQuality = 0.85; // From a scale of 0 to 1

        // Fix image resolution to thumbnail-sized values
        let { width, height } = bitmap;
        if (width > height) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
        } else if (height > maxSize) {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Prepare conversion
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Thumbnail generation failed..'));
                }
            }, 'image/png', imageQuality); // Consider webp if loading times become an issue
        });
    }
}