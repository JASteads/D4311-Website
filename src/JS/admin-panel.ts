import { API_URL } from "./config";
import { basicAdminAccessRequest } from "./permissions";
import { buildComponents } from "./components";

class FillConfig {
    headerText: string;
    viewLink: string;
    editLink: string;
    deleteURL : string

    constructor(headerText: string, viewLink: string, editLink: string, deleteURL: string) {
        this.headerText = headerText;
        this.viewLink = viewLink;
        this.editLink = editLink;
        this.deleteURL = deleteURL;
    }
}

const getTableItems = async (url: string) => {
    const items = [];
    try {
        const res = await fetch(`${API_URL}/${url}`);

        if (!res.ok) {
            throw new Error(`Request failure: ${res.status}`);    
        }

        items.push(...await res.json());
    } catch (e) {
        console.error('Failed to fetch from', url, ':', e);
    }

    return items;
};

const confirmDelete = async (tableName: string, item: any, deleteURL: string) => {
    if (!confirm(`Delete ${item.name} from ${tableName}?`)) {
        return;   
    }

    try {
        const res = await fetch(deleteURL, {
            method: 'POST',
            body: JSON.stringify({ id: item.id }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            throw new Error(`Error code: ${res.status}`);
        }
    } catch (e) {
        console.error(`Failed to delete ${item}:`, e);
    }
}

const buildSection = async (url: string, config: FillConfig) => {
    const items = await getTableItems(url);
    if (items.length === 0) {
        console.warn('Fetched items from', name, 'table, but no items were found');
        return;
    }

    const section = document.createElement('section');

    const generateListItem = (item: any) => {
        const title = document.createElement('p');
        title.textContent = item.title;

        // PROPERTIES GENERATION

        if (item.fileSize) {
            const fileSize = document.createElement('span');
            fileSize.className = 'file-size';
            fileSize.textContent = ''; // TODO : Implement file size parsing

            title.textContent += ' ';
            title.appendChild(fileSize);
        }

        if (item.dateCreated) {
            const date = document.createElement('span');
            date.className = 'date';
            date.textContent = item.dateCreated.toISOString();
        }

        // OPTIONS GENERATION

        const options = document.createElement('div');
        options.className = 'options';

        const { headerText, viewLink, editLink, deleteURL } = config;

        const viewHyperlink = document.createElement('a');
        viewHyperlink.textContent = 'View';
        viewHyperlink.href = viewLink;

        const editHyperlink = document.createElement('a');
        editHyperlink.textContent = 'Edit';
        editHyperlink.href = editLink;

        const deleteHyperlink = document.createElement('a');
        deleteHyperlink.textContent = 'Delete';
        deleteHyperlink.href = '#';
        deleteHyperlink.addEventListener('click', () => confirmDelete(headerText, item, deleteURL));

        options.append(viewHyperlink, editHyperlink, deleteHyperlink);

        const listItem = document.createElement('li');
        listItem.append(title, options);

        return listItem;
    }

    const listElements = items.map(i => generateListItem(i));
    const list = document.createElement('ul');
    list.append(...listElements);

    const header = document.createElement('h2');
    header.textContent = config.headerText;

    section.append(header, list);
    
    return section;
}

const buildSections = async () => {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) {
        console.error('No admin panel found');
        return;
    }

    if (await basicAdminAccessRequest() === 'false') {
        console.warn('Access denied');
        return;
    }

    const results = await Promise.allSettled([
        buildSection('api/products', {
            headerText: 'Products',
            viewLink: '#',
            editLink: '#',
            deleteURL: '#'
        }),

        buildSection('api/gallery', {
            headerText: 'Gallery',
            viewLink: '#',
            editLink: '#',
            deleteURL: '#'
        }),

        buildSection('api/portfolio', {
            headerText: 'Portfolio Items',
            viewLink: '#',
            editLink: '#',
            deleteURL: '#'
        }),

        buildSection('api/blogs', {
            headerText: 'Blog Posts',
            viewLink: '#',
            editLink: '#',
            deleteURL: '#'
        })
    ]);

    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            adminPanel.appendChild(res.value!);
        } else {
            console.error(`Section #${i} failed to load:`, res.reason);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    buildComponents();
    buildSections();
});