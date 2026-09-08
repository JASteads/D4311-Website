import { Editor } from "./editor";
import { ImageUploader } from "./image-uploader";
import type { Account } from "./account-manager";

const keys = { 
    title: 'title', langapi: 'langAPI', project: 'project', date: 'date', desc: 'desc' 
} as const;

export class PortfolioWriter extends Editor {
    private uploader = new ImageUploader('portfolio', true);

    constructor(user: Account, isUpdate = false) {
        super(isUpdate);
        this.locateElements();

        if (this.getContainer()) { this.init(user); }
    }

    setContent(title: string, langAPIs: string, projectLink: string, date: string, desc: string) {
        this.setText(this.getEl(keys.title), title);
        this.setText(this.getEl(keys.langapi), langAPIs);
        this.setText(this.getEl(keys.project), projectLink);
        this.setText(this.getEl(keys.date), date);
        this.setText(this.getEl(keys.desc), desc);
    }

    protected getTableName = () => 'portfolio';
    protected getViewerURL = () => 'portfolio.html';

    protected getTemplate = () => ({
        'portfolio-writer': { tag: 'div', classList: 'portfolio-editor', children: [
            { tag: 'h2', textContent: 'Submit a Portfolio Item'},
            { tag: 'ul', children: [
                { tag: 'li', classList: 'title', children: [
                    { tag: 'p', textContent: 'Title' },
                    { tag: 'div', id: 'portfolio-title-field', edit: true }
                ]},
                { tag: 'li', classList: 'lang-api', children: [
                    { tag: 'p', textContent: 'Languages / APIs' },
                    { tag: 'div', id: 'portfolio-langapi-field', edit: true }
                ]},
                { tag: 'li', classList: 'project-link', children: [
                    { tag: 'p', textContent: 'Project Link' },
                    { tag: 'div', id: 'portfolio-project-link-field', edit: true }
                ]},
                { tag: 'li', classList: 'image-link', children: [
                    { tag: 'span', id: 'portfolio-image-link-field', textContent: 'File Name ...' },
                    { tag: 'button', id: 'browse-button', textContent: 'Browse' }
                ]},
                { tag: 'li', classList: 'date', children: [
                    { tag: 'p', textContent: 'Date' },
                    { tag: 'div', id: 'portfolio-date-field', edit: true }
                ]},
                { tag: 'li', classList: 'desc', children: [
                    { tag: 'p', textContent: 'Description' },
                    { tag: 'div', id: 'portfolio-description-field', classList: 'description-field', edit: true }
                ]},
            ]},
            { tag: 'button', id: 'portfolio-upload-button', textContent: 'Upload' }
    ]}});

    protected getColumns = async () => ({ columns: {
        title: this.getEl(keys.title)?.textContent || 'Untitled',
        lang_api: this.getEl(keys.langapi)?.textContent || '',
        date: this.getEl(keys.date)?.textContent || Date.now().toLocaleString(),
        description: this.getEl(keys.desc)?.textContent || '',
        project_link: this.getEl(keys.project)?.textContent || ''
    }});

    protected locateElements = () => this.locate(
        { key: 'editor',     id: 'portfolio-writer'             },
        { key: keys.title,   id: 'portfolio-title-field'        },
        { key: keys.langapi, id: 'portfolio-langapi-field'      },
        { key: keys.project, id: 'portfolio-project-link-field' },
        { key: keys.date,    id: 'portfolio-date-field'         },
        { key: keys.desc,    id: 'portfolio-description-field'  }
    );

    protected init = (user: Account) => {
        const imagePreview = document.getElementById('portfolio-image-link-field');
        if (imagePreview) {
            const browseButton = document.getElementById('browse-button');
            browseButton?.addEventListener('click', () => this.uploader.browse(imagePreview));
        }

        document.getElementById('portfolio-upload-button')?.addEventListener('click', async () => {
            const item = await this.publish(user);
            if (!item) { return; }

            if (!this.uploader.isReady()) {
                // Custom behavior if needed
            } else {
                await this.uploader.upload(user, item.id);
            }

            window.location.href = `${this.getViewerURL()}?id=${item.id}`;
        });
    }
}