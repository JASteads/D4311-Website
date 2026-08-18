import { Editor } from "./editor";
import { ImageUploader } from "./image-uploader";

export class ProductWriter extends Editor {
    private titleField: HTMLElement | null = null;
    private descriptionField: HTMLElement | null = null;
    private splashArtLinkField: HTMLElement | null = null;
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
                    { tag: 'button', id: 'splash-button', textContent: 'Upload' }
                ]},
                { tag: 'div', classList: 'field-label', textContent: 'Description' },
                { tag: 'div', classList: 'description-field', id: 'product-description-field' },
                { tag: 'button', id: 'product-upload-button', textContent: 'Upload' }
            ]}
        };
    }

    protected getViewerURL = () => 'product_viewer.html';

    protected getTableName = () => 'product';

    protected getPostBody = () => {
        // TODO : Complete building the post body
        return {};
    }

    protected getPutBody = () => {
        // TODO : Complete building the put body
        return {};
    }

    protected locateElements = () => {
        this.editor = document.getElementById('product-writer');
        this.titleField = document.getElementById('product-title-field');
        this.descriptionField = document.getElementById('product-description-field');
        this.splashArtLinkField = document.getElementById('product-splash-field');
        this.hookField = document.getElementById('product-hook-field');
    }

    protected init = () => {
        const publishButton = document.getElementById('product-upload-button');
        publishButton?.addEventListener('click', this.publish);

        this.titleField!.contentEditable = 'true';
        this.descriptionField!.contentEditable = 'true';
        this.hookField!.contentEditable = 'true';
    }
}