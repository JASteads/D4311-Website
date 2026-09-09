import { buildComponents } from "./components";


class PortfolioItem {
    id: number;
    title: string;
    lang_api: string;
    date: string;
    description: string
    project_link: string;

    constructor(id: number, title: string, lang_api: string, date: string,
        description: string, project_link: string) {
        this.id = id;
        this.title = title;
        this.lang_api = lang_api;
        this.date = date;
        this.description = description;
        this.project_link = project_link;
    }
}

const getPortfolioItems = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolio`);

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
    const portfolioItems = (await getPortfolioItems()).reverse(); // Most recent first
    if (!portfolioItems || portfolioItems.length === 0) {
        console.error("No portfolio items found.");
        return;
    }

    portfolioItems.forEach((i: any) => generatePortfolioItem(i));
    const portfolio = document.getElementById('portfolio');
    if (portfolio) portfolio.hidden = false;
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

    const root = 'Resources/Images/Portfolio';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'project-image';
    thumbnail.src = `${root}/preview_Portfolio_${item.id}.png`;
    thumbnail.alt = item.title;
    thumbnail.style.maxWidth = '250px';
    
    const imageLink = document.createElement('a');
    imageLink.href = `${root}/Portfolio_${item.id}.png`;
    imageLink.target = '_blank';
    imageLink.appendChild(thumbnail);

    const link = document.createElement('a');
    link.className = 'project-link';
    link.href = item.project_link;
    link.target = '_blank';
    link.innerText = 'View Project';

    projectItem.append(title, date, lang_api, description, imageLink, link);
    projectList.appendChild(projectItem);
}

document.addEventListener('DOMContentLoaded', async () => {
    await buildComponents();
    await loadPorfolio();
});