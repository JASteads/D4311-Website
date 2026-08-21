import { Editor } from "./editor";
import { ImageUploader } from "./image-uploader";

export class ProductWriter extends Editor {
    private titleField: HTMLElement | null = null;
    private descriptionField: HTMLElement | null = null;
    private splashArtField: HTMLElement | null = null;
    private hookField: HTMLElement | null = null;
    
    constructor(isUpdate = false) {
        super(isUpdate);
        this.locateElements();

        if (this.editor) {
            this.init();
        }
    }

    setContent = (title: string, description: string, hook: string, date: string, splashArtLink: string) => {
        if (this.titleField) {
            this.titleField.textContent = title;
        }

        if (this.descriptionField) {
            this.descriptionField.textContent = description;
        }

        if (this.hookField) {
            this.hookField.textContent = hook;
        }
    }

    protected getTemplate = () => {
        return {
            'product-writer': { tag: 'div', classList: 'product-writer', children: [
                { tag: 'h2', textContent: 'Product Details' },
                { tag: 'div', classList: 'field-label', textContent: 'Title' },
                { tag: 'div', classList: 'title-field', id: 'product-title-field' },
                { tag: 'div', classList: 'field-label', textContent: 'Hook' },
                { tag: 'div', classList: 'title-field', id: 'product-hook-field' },
                { tag: 'div', classList: 'image-upload', id: 'splash-image-upload', children: [
                    { tag: 'span', id: 'splash-file', textContent: 'File name ...' },
                    { tag: 'button', id: 'splash-button', textContent: 'Browse' }
                ]},
                { tag: 'div', classList: 'field-label', textContent: 'Description' },
                { tag: 'div', classList: 'description-field', id: 'product-description-field' },
                { tag: 'button', id: 'product-upload-button', textContent: 'Upload' }
            ]}
        };
    }

    protected getViewerURL = () => 'product_viewer.html';

    protected getTableName = () => 'product';

    protected getPostBody = () => this.getContent();

    protected getPutBody = () => {
        const { title, hook, description, splashArt } = this.getContent();
        const id = new URLSearchParams(window.location.search).get('id');

        if (!id) {
            console.error('No ID specified for update');
            return;
        }

        return { id: parseInt(id), title, hook, description, splash_art_link: splashArt };
    }

    protected locateElements = () => {
        this.editor = document.getElementById('product-writer');
        this.titleField = document.getElementById('product-title-field');
        this.hookField = document.getElementById('product-hook-field');
        this.descriptionField = document.getElementById('product-description-field');
        this.splashArtField = document.getElementById('product-splash-field');
    }

    protected init = () => {
        const uploader = new ImageUploader('splash');
        
        const splashFile = document.getElementById('splash-file');
        if (splashFile) {
            const browseButton = document.getElementById('splash-button');
            browseButton?.addEventListener('click', () => uploader.browse(splashFile));
        }
        
        const publishButton = document.getElementById('product-upload-button');
        publishButton?.addEventListener('click', async () => {
            if (await uploader.upload()) {
                this.publish();
            }
        });

        if (this.titleField) {
            this.titleField.contentEditable = 'true';
        }

        if (this.descriptionField) {
            this.descriptionField.contentEditable = 'true';
        }

        if (this.hookField) {
            this.hookField.contentEditable = 'true';
        }
    }

    private getContent = () => {
        return {
            title: this.titleField?.textContent.trim() || '',
            hook: this.hookField?.textContent.trim() || '',
            description: this.descriptionField?.textContent.trim() || '',
            splashArt: this.splashArtField?.textContent || ''
        };
    }
}