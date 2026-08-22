import { Editor } from "./editor";

const keys = { 
    title: 'title', langapi: 'langAPI', project: 'project', 
    image: 'image', date: 'date', desc: 'desc' 
};

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
                        { tag: 'div', classList: 'portfolio-project-link-field', edit: true }
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

    protected locateElements = () => this.locate(
        { key: 'editor',     id: 'portfolio-writer'             },
        { key: keys.title,   id: 'portfolio-title-field'        },
        { key: keys.langapi, id: 'portfolio-langapi-field'      },
        { key: keys.project, id: 'portfolio-project-link-field' },
        { key: keys.image,   id: 'portfolio-image-link-field'   },
        { key: keys.date,    id: 'portfolio-date-field'         },
        { key: keys.desc,    id: 'portfolio-desription-field'   }
    );

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
            title: this.getEl(keys.title)?.textContent || 'Untitled',
            type: this.getProjectLinkType(),
            langAPI: this.getEl(keys.langapi)?.textContent || '',
            date: this.getEl(keys.date)?.textContent || Date.now().toLocaleString(),
            description: this.getEl(keys.desc)?.textContent || '',
            imageLink: this.getEl(keys.image)?.textContent || '',
            projectLink: this.getEl(keys.project)?.textContent || ''
        }
    }

    private getProjectLinkType = (): string => {
        let projectLink = this.getEl(keys.project)?.nodeValue;

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