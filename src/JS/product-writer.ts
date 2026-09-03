import { Editor } from "./editor";
import { ImageUploader } from "./image-uploader";

const keys = { title: 'title', desc: 'desc', hook: 'hook', splash: 'splash' } as const;

export class ProductWriter extends Editor {
    private uploader = new ImageUploader('splash');

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

    protected getTemplate = () => ({
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
            { tag: 'button', id: 'product-upload-button', textContent: 'Upload' },
    ]}});

    protected getViewerURL = () => 'product_viewer.html';
    protected getTableName = () => 'product';

    protected getColumns = async () => ({ columns: {
        title: this.getEl(keys.title)?.textContent.trim() || '',
        hook: this.getEl(keys.hook)?.textContent.trim() || '',
        description: this.getEl(keys.desc)?.textContent.trim() || ''
    }});

    protected locateElements = () => this.locate(
        { key: 'editor',    id: 'product-writer'            },
        { key: keys.title,  id: 'product-title-field'       },
        { key: keys.hook,   id: 'product-hook-field'        },
        { key: keys.desc,   id: 'product-description-field' },
        { key: keys.splash, id: 'splash-name'               }
    );

    protected init = () => {
        const splashPreview = document.getElementById('splash-file');
        if (splashPreview) {
            const browseButton = document.getElementById('splash-button');
            browseButton?.addEventListener('click', () => this.uploader.browse(splashPreview));
        }
        
        document.getElementById('product-upload-button')?.addEventListener('click', async () => {
            if (!this.uploader.isReady()) {
                if (!this.isUpdate) {
                    alert('An image is required to upload this item');
                    return;
                }
            } else {
                const imgMsg = await this.uploader.upload(this.getID()) ? 
                    'Image uploaded successfully' : 'Image upload failed';
                
                alert(imgMsg);
            }
            this.publish();
        });
    }
}