import { API_URL } from "./config";
import { GalleryItem } from "./gallery-item";
import { ImageUploader } from "./image-uploader";
import type { Product } from "./product";

export class GalleryUploader extends ImageUploader {
    private readonly categorySelect: HTMLSelectElement;

    constructor(populateSelf: boolean) {
        super(
            `${API_URL}/api/gallery`,
            '/Resources/Images/Gallery',
            'gallery.html', true
        );
        this.categorySelect = document.getElementById('category-select') as HTMLSelectElement;

        if (populateSelf) {
            this.updateCategories();
        }

        const browseButton = document.getElementById('browse-button');
        browseButton?.addEventListener('click', this.browse);

        const uploadButton = document.getElementById('upload-button');
        uploadButton?.addEventListener('click', async () => this.upload(await this.generateGalleryItem()));
    }

    public setSelectDisabled = (isDisabled: boolean) => {
        if (this.categorySelect) {
            this.categorySelect.disabled = isDisabled;
        }
    }

    public addCategory = (category: string) => {
        if (!this.categorySelect) {
            console.error('No category select to add to.');
            return;
        }
        
        const nextOpt = document.createElement('option');

        nextOpt.value = category;
        nextOpt.textContent = category;
        this.categorySelect.add(nextOpt);
    }

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
                '', // Thumbnail link not used, may change
                '', // Image link not used, may change
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