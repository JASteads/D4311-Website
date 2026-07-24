import { API_URL, DEV_URL } from "./config";
import { GalleryItem } from "./gallery-item";
import { Product } from "./product";

export class GalleryUploader {
    private readonly categorySelect: HTMLSelectElement;
    private pendingUpload: File | null;

    constructor(populateSelf: boolean) {
        this.categorySelect = document.getElementById('category-select') as HTMLSelectElement;
        this.pendingUpload = null;

        if (populateSelf) {
            this.updateCategories();
        }

        const browseButton = document.getElementById('browse-button');
        browseButton?.addEventListener('click', this.browseImages);

        const uploadButton = document.getElementById('upload-button') as HTMLButtonElement;
        uploadButton?.addEventListener('click', this.uploadImage);
    }

    public setSelectDisabled = (isDisabled: boolean) => {
        if (this.categorySelect) {
            this.categorySelect.disabled = isDisabled;
        }
    }

    public addCategory = async (category: string) => {
        if (!this.categorySelect) {
            console.error('No category select to add to.');
            return;
        }
        
        const nextOpt = document.createElement('option');

        nextOpt.value = category;
        nextOpt.textContent = category;
        this.categorySelect.add(nextOpt);
    }

    public clearPendingUpload = () => this.pendingUpload = null;

    private updateCategories = async () => {
        if (!this.categorySelect) {
            console.error('Requested category select update, but no element exists for it');
            return;
        }

        // Disable filter until prepared
        this.categorySelect.disabled = true;
    
        try {
            const resCategories = await fetch(`${API_URL}/api/products?onlyTitles=true`);
    
            if (!resCategories.ok) {
                throw new Error(`Failed to fetch categories: ${resCategories.status}`);
            }
    
            // Get category array from server and populate options
            const categories = await resCategories.json() as string[];
            categories.forEach(c => this.addCategory(c));
    
            // Re-enable filter only on success
            this.categorySelect.disabled = false;
    
            console.log("Categories updated");
        } catch (e) {
            console.error(e);
        }
    }

    private browseImages = () => {
        let input: (HTMLInputElement | null) = document.createElement('input');
        input.type = 'file';
    
        const handleBrowse = (e: Event) => {
            const removeInput = () => {
                input?.removeEventListener('change', handleBrowse);
                input = null;
            }
    
            const target = e.target as HTMLInputElement;
            if (!target.files) {
                console.error("No files selected");
                removeInput();
                return;
            }
    
            if (target.files[0].type !== 'image/png') {
                alert('File must be a PNG');
                removeInput();
                return;
            }
    
            const preview = document.getElementById('upload-preview');
            if (!preview) {
                console.error("Preview is missing");
                removeInput();
                return;
            }
    
            // Neatly fix long file names in the preview
            this.pendingUpload = target.files[0];
            const charLimit = 23; // Just a number that fits the most neatly in the box
            let previewName = this.pendingUpload.name;
            if (previewName.length > charLimit) {
                previewName = previewName.substring(0, charLimit).concat('...');
            }
            preview.textContent = previewName;
            removeInput();
        }
    
        input.addEventListener('change', handleBrowse);
        input.click();
    }
    
    private uploadImage = async () => {
        if (!this.pendingUpload) {
            console.warn(`No file has been prepared to upload`);
            return;
        }
    
        // Prepare and attempt uploading new item
        const newItem = await this.generateGalleryItem();
        const container = encodeURIComponent(JSON.stringify(newItem));

        console.log('Item:', newItem);
        console.log('Encoded Container:', container);
        
        try {
            const res = await fetch(`${API_URL}/api/gallery/upload?container=${container}`, {
                method: 'POST',
                body: this.pendingUpload,
                headers: {
                    'Content-Type': this.pendingUpload.type || 'application/octet-stream',
                    'X-File-Name': encodeURIComponent(this.pendingUpload.name),
                    'Path': '/Resources/Images/Gallery'
                }
            });
    
            if (!res.ok) {
                console.error("Upload failed");
                throw new Error(`HTTP Error: ${res.status}`);
            }
    
            alert('File uploaded to gallery successful');

            // Redirect or refresh
            const galleryURL = `${DEV_URL}/gallery.html`;

            if (window.location.href !== galleryURL) {
                window.location.replace(galleryURL);
                window.open(galleryURL);
            } else {
                window.location.reload();
            }
            
        } catch (e) {
            console.error('File upload failed:', e);
            return;
        }
    }

    private generateGalleryItem = async () =>  {
        const title = document.getElementById('gallery-title-field');
        const category = document.getElementById('category-select') as HTMLSelectElement;
        const caption = document.getElementById('gallery-description-field');

        const gameID = await this.getGameID(category?.value) as Number;
    
        return {
            item: new GalleryItem(
                title ? title.textContent : 'Untitled',
                category ? category.value : 'Other',
                caption ? caption.textContent : '',
                '', // Thumbnail link not used
                '', // Image link not used
                new Date(Date.now())),
            id: gameID 
        };
    }

    private getGameID = async (category: string) => {
        const categoryOther = 1;

        if (!category) {
            return categoryOther;
        }

        try {
            const result = await fetch(`${API_URL}/api/products`);

            if (!result.ok) {
                throw new Error(`HTTP Error: ${result.status}`);
            }

            const products = await result.json() as Product[];
            const target = products.find((p) => p.title === category);

            if (!target) {
                console.log('Could not find product. Check DB for validity');
                return categoryOther;
            }

            return target.id;

        } catch (e) {
            console.error('Failed to get a game ID..', e);
            return categoryOther;
        }
    }
}