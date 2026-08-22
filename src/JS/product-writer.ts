import { Editor } from "./editor";
import { ImageUploader } from "./image-uploader";

const keys = { title: 'title', desc: 'desc', hook: 'hook', splash: 'splash' };

export class ProductWriter extends Editor {
    constructor(isUpdate = false) {
        super(isUpdate);
        this.locateElements();

        if (this.getContainer()) { this.init(); }
    }

    setContent = (title: string, description: string, hook: string, splashArtLink: string) => {
        this.setText(this.getEl(keys.title), title);
        this.setText(this.getEl(keys.desc), description);
        this.setText(this.getEl(keys.hook), hook);
        this.setText(this.getEl(keys.splash), splashArtLink);
    }

    protected getTemplate = () => {
        return {
            'product-writer': { tag: 'div', classList: 'product-writer', children: [
                { tag: 'h2', textContent: 'Product Details' },
                { tag: 'div', classList: 'field-label', textContent: 'Title' },
                { tag: 'div', classList: 'title-field', id: 'product-title-field', edit: true },
                { tag: 'div', classList: 'field-label', textContent: 'Hook' },
                { tag: 'div', classList: 'title-field', id: 'product-hook-field', edit: true },
                { tag: 'div', classList: 'image-upload', id: 'splash-image-upload', children: [
                    { tag: 'span', id: 'splash-file', textContent: 'File name ...' },
                    { tag: 'button', id: 'splash-button', textContent: 'Browse' }
                ]},
                { tag: 'div', classList: 'field-label', textContent: 'Description' },
                { tag: 'div', classList: 'description-field', id: 'product-description-field', edit: true },
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

    protected locateElements = () => this.locate(
        { key: 'editor',    id: 'product-writer'            },
        { key: keys.title,  id: 'product-title-field'       },
        { key: keys.hook,   id: 'product-hook-field'        },
        { key: keys.desc,   id: 'product-description-field' },
        { key: keys.splash, id: 'product-splash-field'      }
    );

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
    }

    private getContent = () => {
        return {
            title: this.getEl(keys.title)?.textContent.trim() || '',
            hook: this.getEl(keys.hook)?.textContent.trim() || '',
            description: this.getEl(keys.desc)?.textContent.trim() || '',
            splashArt: this.getEl(keys.splash)?.textContent || ''
        };
    }
}