import { Components } from "./components";
import { API_URL } from "./config";

class PortfolioItem {
    title: string;
    type: string;
    lang_api: string;
    date: string;
    description: string
    image_link: string;
    project_link: string;

    constructor(title: string, type: string, lang_api: string, date: string,
         description: string, image_link: string, project_link: string) {
        this.title = title;
        this.type = type;
        this.lang_api = lang_api;
        this.date = date;
        this.description = description;
        this.image_link = image_link;
        this.project_link = project_link;
    }
}

const getPortfolioItems = async (): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/api/portfolio`);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        return await res.json();
    }
    catch (e) {
        console.error("Failed to fetch portfolio items:", e);
        return [];
    }
}

const loadPorfolio = async () => {
    const portfolioItems = await getPortfolioItems();
    if (!portfolioItems || portfolioItems.length === 0) {
        console.error("No portfolio items found.");
        return;
    }

    portfolioItems.reverse(); // Most recent first
    portfolioItems.forEach((i: PortfolioItem) => {
        generatePortfolioItem(i);
    });
}

const generatePortfolioItem = (item: PortfolioItem) => {
    const projectList = document.getElementById('project-list');

    if (!projectList) {
        console.error("Project list container not found.");
        return;
    }

    const projectItem = document.createElement('li');
    projectItem.className = 'project-item';
    
    const title = document.createElement('h3');
    title.className = 'project-title';
    title.innerText = item.title;

    const date = document.createElement('small');
    date.className = 'project-date';
    date.innerText = `(${item.date})`;

    const lang_api = document.createElement('small');
    lang_api.className = 'project-lang-api';
    lang_api.innerText = item.lang_api;

    const description = document.createElement('p');
    description.className = 'project-description';
    description.innerText = item.description;

    const imgLinkURL = `Resources/Portfolio/References/${item.image_link}`;

    const image_link = document.createElement('a');
    image_link.href = imgLinkURL;
    image_link.target = '_blank';

    const image = document.createElement('img');
    image.className = 'project-image';
    image.src = imgLinkURL;
    image.alt = item.title;
    image.style.maxWidth = '250px';

    image_link.appendChild(image);

    const link = document.createElement('a');
    link.className = 'project-link';
    link.href = item.project_link;
    link.target = '_blank';
    link.innerText = 'View Project';

    projectItem.append(title, date, lang_api, description, image_link, link);
    projectList.appendChild(projectItem);
}

const initPortfolio = () => {
    new Components();
    loadPorfolio();
}

document.addEventListener('DOMContentLoaded', () => initPortfolio());