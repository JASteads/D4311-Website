import { Editor } from "./editor";
import { ImageUploader } from "./image-uploader";

const keys = { 
    title: 'title', langapi: 'langAPI', project: 'project', 
    image: 'image', date: 'date', desc: 'desc' 
} as const;

export class PortfolioWriter extends Editor {
    constructor(isUpdate = false) {
        super(isUpdate);
        this.locateElements();

        if (this.getContainer()) { this.init(); }
    }

    setContent(title: string, langAPIs: string, projectLink: string,
        imageLink: string, date: string, desc: string) {
        this.setText(this.getEl(keys.title), title);
        this.setText(this.getEl(keys.langapi), langAPIs);
        this.setText(this.getEl(keys.project), projectLink);
        this.setText(this.getEl(keys.image), imageLink);
        this.setText(this.getEl(keys.date), date);
        this.setText(this.getEl(keys.desc), desc);
    }

    protected getTableName = () => 'portfolio';
    protected getViewerURL = () => 'portfolio.html';

    protected getTemplate = () => {
        return {
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
                        { tag: 'button', id: 'browse-button', textContent: 'Browse', edit: true }
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
            ]}
        };
    }

    protected getColumns = async () => {
        return { columns: {
            title: this.getEl(keys.title)?.textContent || 'Untitled',
            type: this.getProjectLinkType(),
            langAPI: this.getEl(keys.langapi)?.textContent || '',
            date: this.getEl(keys.date)?.textContent || Date.now().toLocaleString(),
            description: this.getEl(keys.desc)?.textContent || '',
            imageLink: this.getEl(keys.image)?.textContent || '',
            projectLink: this.getEl(keys.project)?.textContent || ''
        }}
    }

    protected locateElements = () => this.locate(
        { key: 'editor',     id: 'portfolio-writer'             },
        { key: keys.title,   id: 'portfolio-title-field'        },
        { key: keys.langapi, id: 'portfolio-langapi-field'      },
        { key: keys.project, id: 'portfolio-project-link-field' },
        { key: keys.image,   id: 'portfolio-image-link-field'   },
        { key: keys.date,    id: 'portfolio-date-field'         },
        { key: keys.desc,    id: 'portfolio-description-field'   }
    );

    protected init = () => {
        const uploader = new ImageUploader('portfolio', true);
        const uploadButton = document.getElementById('portfolio-upload-button');

        const imagePreview = document.getElementById('portfolio-image-link-field');
        if (imagePreview) {
            const browseButton = document.getElementById('browse-button');
            browseButton?.addEventListener('click', () => uploader.browse(imagePreview));
        }

        if (uploadButton) {
            uploadButton.addEventListener('click', async () => {
                 const imgMsg = await uploader.upload() ? 'Image uploaded successfully' : 'Image upload failed';
            
                alert(imgMsg);
                this.publish();
            });
        }
    }

    // =================== EDITOR-SPECIFIC FUNCTIONS ===================

    private getProjectLinkType = (): string => {
        let projectLink = this.getEl(keys.project)?.nodeValue;

        if (!projectLink) return '';

        // https:// --- skip 8 characters; jump to nodeValue[7]
        const startIndex = 7;
        const firstPeriod = projectLink.indexOf('.', startIndex);
        projectLink = projectLink.substring(startIndex, firstPeriod);

        console.log('Provided Project Type:', projectLink);

        if (projectLink === 'github') {
            return 'Github';
        } else if (projectLink === 'itch') {
            return 'itch.io';
        }

        return '';
    }
}