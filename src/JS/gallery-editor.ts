import { API_URL } from "./config";
import { Editor } from "./editor";
import { GalleryItem } from "./gallery-item";
import { ImageUploader } from "./image-uploader";
import type { Product } from "./product";

export class GalleryEditor extends Editor {
    uploader = new ImageUploader('gallery', true);
    private categorySelect: HTMLSelectElement | null = null;

    constructor(isUpdate = false) {
        super(isUpdate);
        this.locateElements();

        if (this.getContainer()) { this.init(); }
    }

    setContent(title: string, caption: string, gameID: number, fileName: string) {
        this.setText(document.getElementById('gallery-title-field'), title);
        this.setText(document.getElementById('gallery-description-field'), caption);
        this.setText(document.getElementById('upload-preview'), fileName);
        if (this.categorySelect) {
            this.categorySelect.selectedIndex = gameID - 1;
        }
    }

    protected getTemplate() {
        return {
            'gallery-editor': { tag: 'div', classList: 'upload-container', children: [
                { tag: 'p', classList: 'upload-preview-label', children: [
                    { tag: 'b', textContent: 'Image Upload' }
                ]},
                { tag: 'div', classList: 'upload-preview', id: 'upload-preview' },
                { tag: 'button', classList: 'browse-button', id: 'browse-button', textContent: 'Browse' },
                { tag: 'span', classList: 'category-select-label', textContent: 'Category:' },
                { tag: 'select', id: 'category-select'},
                { tag: 'p', classList: 'title-field-label', textContent: 'Title' },
                { tag: 'div', classList: 'title-field', id: 'gallery-title-field', edit: true },
                { tag: 'p', classList: 'description-field-label', textContent: 'Caption' },
                { tag: 'div', classList: 'description-field', id: 'gallery-description-field', edit: true },
                { tag: 'button', id: 'upload-button', textContent: 'Upload' },
                { tag: 'button', id: 'close-button', textContent: 'Close' }
            ]}
        };
    }

    protected getPostBody = () => this.generateGalleryItem();

    protected getPutBody = () => this.generateGalleryItem();

    protected getViewerURL = () => 'gallery.html';

    protected getTableName = () => 'gallery';

    protected locateElements = () => this.locate(
        { key: 'editor', id :'gallery-editor'  },
        { key: 'select', id: 'category-select' }
    )

    protected init = async () => {
        const uploadPreview = document.getElementById('upload-preview');
        if (uploadPreview) {
            const browseButton = document.getElementById('browse-button');
            browseButton?.addEventListener('click', () => this.uploader.browse(uploadPreview));
        }

        this.categorySelect = this.getEl('select') as HTMLSelectElement;

        document.getElementById('upload-button')?.addEventListener('click', async () => this.publish());
        await this.updateCategories();
    }

    public setSelectDisabled(isDisabled: boolean) {
        if (this.categorySelect) {
            this.categorySelect.disabled = isDisabled;
        }
    }

    public addCategory(category: string) {
        if (!this.categorySelect) {
            console.error('No category select to add to.');
            return;
        }
        
        const nextOpt = document.createElement('option');

        nextOpt.value = category;
        nextOpt.textContent = category;
        this.categorySelect.options.add(nextOpt);
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
        } catch (e) {
            console.error(e);
        }
    }

    private generateGalleryItem = async () =>  {
        if(!await this.uploader.upload()) {
            console.error('Failed to upload image to Gallery');
        }

        const title = document.getElementById('gallery-title-field');
        const caption = document.getElementById('gallery-description-field');
        const gameID = await this.getGameID(this.categorySelect?.value);

        return {
            item: new GalleryItem(
                title?.textContent || 'Untitled',
                this.categorySelect?.value || 'Misc',
                caption?.textContent || '',
                '', // Thumbnail link not used, may change
                '', // Image link not used, may change
                new Date(Date.now())),
            id: gameID
        };
    }

    private getGameID = async (category: string | undefined) => {
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