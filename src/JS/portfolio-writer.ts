import { API_URL } from "./config";
import { basicAdminAccessRequest } from "./permissions";

export class PortfolioWriter {
    titleField: HTMLElement | null;
    langAPIField: HTMLElement | null;
    projectLinkField: HTMLElement | null;
    imageLinkField: HTMLElement | null;
    dateField: HTMLElement | null;
    descriptionField: HTMLElement | null;

    constructor() {
        this.titleField = document.getElementById('portfolio-title-field');
        this.langAPIField = document.getElementById('portfolio-langapi-field');
        this.projectLinkField = document.getElementById('portfolio-project-link-field');
        this.imageLinkField = document.getElementById('portfolio-image-link-field');
        this.dateField = document.getElementById('portfolio-date-field');
        this.descriptionField = document.getElementById('portfolio-desription-field');

        const uploadButton = document.getElementById('portfolio-upload-button');
        if (uploadButton) {
            uploadButton.addEventListener('click', this.publish);
        }
    }

    private publish = async () => {
        if (await basicAdminAccessRequest() === 'false') {
            console.warn('Access denied');
            return;
        }
        
        const record = {
            title: this.titleField?.textContent || 'Untitled',
            type: this.getProjectLinkType(),
            langAPI: this.langAPIField?.textContent || null,
            date: this.dateField?.textContent || Date.now().toLocaleString(),
            description: this.descriptionField?.textContent || null,
            imageLink: this.imageLinkField?.textContent || null,
            projectLink: this.projectLinkField?.textContent || null
        };
        
        try {
            const result = await fetch(`${API_URL}/api/portfolio`, {
                method: 'POST',
                body: JSON.stringify(record),
                headers: { "Content-Type": "application/json" }
            });

            if (!result.ok) {
                throw new Error(`HTTP Error: ${result.status}`);
            }
            console.log('Successfully uploaded', record.title, 'to the server');

            return result.json();
        } catch (e) {
            console.error('Something went wrong with the portfolio upload...', e);
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