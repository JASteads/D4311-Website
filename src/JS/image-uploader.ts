import { API_URL } from "./config";
import { basicAdminAccessRequest } from "./permissions";

export class ImageUploader {
    private uploadType;
    private includeThumbnail = false;
    private pendingUpload: File | null = null;

    constructor(uploadType = '', includeThumbnail = false) {
        // ex. spLaSH --> Splash
        this.uploadType = (uploadType.length >= 2) ? 
            uploadType[0].toUpperCase() + uploadType.substring(1).toLowerCase() :
            'Misc';
        this.includeThumbnail = includeThumbnail;
    }

    clearPendingUpload = () => this.pendingUpload = null;
    
    browse = (preview: HTMLElement) => {
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
    
            const target = e.target as HTMLInputElement;

            // Handle errors
            if ( 
                !handleError(!(!target.files), 'No files selected') ||
                !handleError(target.files![0].type === 'image/png', 'File must be a PNG')
            ) return;

            handleError(!(!preview), 'Preview is missing');
    
            // Neatly fix long file names in the preview
            this.pendingUpload = target.files![0];
            
            const charLimit = 23; // Just a number that fits the most neatly in the box
            let previewName = this.pendingUpload.name;
            if (previewName.length > charLimit) {
                previewName = previewName.substring(0, charLimit).concat('...');
            }
            preview!.textContent = previewName;
            input.removeEventListener('change', handleBrowse);
        }
    
        input.addEventListener('change', handleBrowse);
        input.click();
    }
    
    upload = async (content: any) => {
        if (!await basicAdminAccessRequest()) {
            console.warn('Access denied');
            return false;
        }
        
        if (!this.pendingUpload) {
            console.warn(`No file has been prepared to upload`);
            return false;
        }
    
        // Prepare and attempt uploading new item
        const newItem = content;
        const container = encodeURIComponent(JSON.stringify(newItem));

        // TODO : Remove container functionality, make it specific to GalleryUploader
        //        NOTE : Server likely requires similar simplification. A separate image uploading feature
        //               will be used

        const oldURL = `${'this.uploadURL'}?container=${container}`; // <-- REMOVE THIS LATER
        const root = `${API_URL}/api/image`;

        try {
            // ------------- FULL IMAGE UPLOAD -------------

            // Will now use the image API route that uploads specific types
            const res = await fetch(root, {
                method: 'POST',
                body: this.pendingUpload,
                headers: {
                    'Content-Type': this.pendingUpload.type || 'application/octet-stream',
                    'X-File-Name': encodeURIComponent(this.pendingUpload.name),
                    'Path': `/Resources/Images/${this.uploadType}`
                }
            });
    
            if (!res.ok) {
                console.error('Upload failed..');
                throw new Error(`HTTP Error: ${res.status}`);
            }

            // ------------- THUMBNAIL UPLOAD -------------

            if (this.includeThumbnail) {
                // Prepare thumbnail
                let thumbnail: Blob;
                try {
                    thumbnail = await this.generateThumbnail();
                } catch (e) {
                    console.error(e);
                    return;
                }
                
                const thumbnailFile = new File(
                    [thumbnail],
                    encodeURIComponent(`preview_${this.pendingUpload.name}`),
                    { type: thumbnail.type }
                );

                try {
                    // NOTE : If uploading thumbnails begins to create issues, 
                //        consider creating an image repair module
                    const resThumbnail = await fetch(
                        `${root}?thumbnail=true`, {
                            method: 'POST',
                            body: thumbnailFile,
                            headers: {
                                'Content-Type': this.pendingUpload.type || 'application/octet-stream',
                                'X-File-Name': thumbnailFile.name,
                                'Path': `/Resources/Images/${this.uploadType}`
                            }
                        }
                    );

                    if (!resThumbnail.ok) {
                        console.error('Thumbnail upload failed..');
                        throw new Error(`HTTP Error: ${resThumbnail.status}`);
                    }
                } catch (e) {
                    alert(`Thumbnail upload failed: ${e}`);
                }
            }
            
            alert('File uploaded successfully');
        } catch (e) {
            alert(`File upload failed: ${e}`);
            return false;
        }
        this.clearPendingUpload();

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