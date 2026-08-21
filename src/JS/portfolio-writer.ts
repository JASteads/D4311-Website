import { Editor } from "./editor";

export class PortfolioWriter extends Editor {
    private titleField: HTMLElement | null = null;
    private langAPIField: HTMLElement | null = null;
    private projectLinkField: HTMLElement | null = null;
    private imageLinkField: HTMLElement | null = null;
    private dateField: HTMLElement | null = null;
    private descriptionField: HTMLElement | null = null;

    constructor(isUpdate = false) {
        super(isUpdate);
        this.locateElements();

        if (this.editor) {
            this.init();
        }
    }

    setContent(...content: any) {
        
    }

    protected getTemplate = () => {
        return {
            'portfolio-writer': { tag: 'div', classList: 'portfolio-editor', children: [
                { tag: 'h2', textContent: 'Submit a Portfolio Item'},
                { tag: 'ul', children: [
                    { tag: 'li', classList: 'title', children: [
                        { tag: 'p', textContent: 'Title' },
                        { tag: 'div', classList: 'portfolio-title-field', edit: true }
                    ]},
                    { tag: 'li', classList: 'lang-api', children: [
                        { tag: 'p', textContent: 'Languages / APIs' },
                        { tag: 'div', classList: 'portfolio-langapi-field', edit: true }
                    ]},
                    { tag: 'li', classList: 'project-link', children: [
                        { tag: 'p', textContent: 'Project Link' },
                        { tag: 'div', classList: 'portfolio-project-link-field' }
                    ]},
                    { tag: 'li', classList: 'image-link', children: [
                        { tag: 'p', textContent: 'Image Link' },
                        { tag: 'div', classList: 'portfolio-image-link-field', edit: true }
                    ]},
                    { tag: 'li', classList: 'date', children: [
                        { tag: 'p', textContent: 'Date' },
                        { tag: 'div', classList: 'portfolio-date-field', edit: true }
                    ]},
                    { tag: 'li', classList: 'desc', children: [
                        { tag: 'p', textContent: 'Description' },
                        { tag: 'div', classList: 'portfolio-description-field', edit: true }
                    ]},
                ]},
                { tag: 'button', id: 'portfolio-upload-button', textContent: 'Upload' }
            ]}
        };
    }

    protected locateElements() {
        this.editor = document.getElementById('portfolio-writer');
        this.titleField = document.getElementById('portfolio-title-field');
        this.langAPIField = document.getElementById('portfolio-langapi-field');
        this.projectLinkField = document.getElementById('portfolio-project-link-field');
        this.imageLinkField = document.getElementById('portfolio-image-link-field');
        this.dateField = document.getElementById('portfolio-date-field');
        this.descriptionField = document.getElementById('portfolio-desription-field');
    }

    protected getPostBody = () => this.getContent();

    protected getPutBody = () => {
        const { title, type, langAPI, date, description, imageLink, projectLink } = this.getContent();
        const id = new URLSearchParams(window.location.search).get('id');

        if (!id) {
            console.error('No ID specified for update');
            return;
        }

        return { id, title, type, langAPI, date, description, imageLink, projectLink }
    };

    protected getTableName = () => 'portfolio';

    protected getViewerURL = () => 'portfolio.html';

    protected init = () => {
        const uploadButton = document.getElementById('portfolio-upload-button');
        if (uploadButton) {
            uploadButton.addEventListener('click', this.publish);
        }
    }

    protected getContent = () => {
        return {
            title: this.titleField?.textContent || 'Untitled',
            type: this.getProjectLinkType(),
            langAPI: this.langAPIField?.textContent || '',
            date: this.dateField?.textContent || Date.now().toLocaleString(),
            description: this.descriptionField?.textContent || '',
            imageLink: this.imageLinkField?.textContent || '',
            projectLink: this.projectLinkField?.textContent || ''
        }
    }

    private getProjectLinkType = (): string => {
        let projectLink = this.projectLinkField?.nodeValue;

        if (!projectLink) {
            return '';
        }

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