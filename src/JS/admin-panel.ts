import { API_URL } from "./config";
import { basicAdminAccessRequest } from "./permissions";
import { buildComponents } from "./components";
import { safeLink } from "./site-nav";

class FillConfig {
    headerText: string;
    viewLink: string;
    editor: string;
    deleteURL: string;

    constructor(headerText: string, viewLink: string, editor: string, deleteURL: string) {
        this.headerText = headerText;
        this.viewLink = viewLink;
        this.editor = editor;
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
        const url = `${API_URL}/${deleteURL}/${item.id}`;
        alert(url);
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        
        if (!res.ok) {
            throw new Error(`Error code: ${res.status}`);
        }

        window.location.reload();
    } catch (e) {
        alert(`Failed to delete ${item.name}: ${e}`);
    }
}

const buildSection = async (url: string, config: FillConfig) => {
    const items = await getTableItems(url);
    if (items.length === 0) {
        console.warn('Fetched items from', name, 'table, but no items were found');
        return;
    }

    const section = document.createElement('section');

    const generateListItem = async (item: any) => {
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

        const { headerText, viewLink, editor, deleteURL } = config;
        item['editor'] = editor;

        const viewHyperlink = document.createElement('a');
        viewHyperlink.textContent = 'View';
        viewHyperlink.href = await safeLink(`${viewLink}?id=${item.id}`);

        const editHyperlink = document.createElement('a');
        editHyperlink.textContent = 'Edit';
        editHyperlink.href = await safeLink('admin_editor.html');
        editHyperlink.addEventListener('click', async () => {
            sessionStorage.setItem('edit-item', JSON.stringify(item));
            editHyperlink.click();
        });

        const deleteHyperlink = document.createElement('a');
        deleteHyperlink.textContent = 'Delete';
        deleteHyperlink.href = '#';
        deleteHyperlink.addEventListener('click', () => confirmDelete(headerText, item, deleteURL));

        options.append(viewHyperlink, editHyperlink, deleteHyperlink);

        const listItem = document.createElement('li');
        listItem.append(title, options);

        return listItem;
    }

    const listElements = await Promise.all(items.map(i => generateListItem(i)));
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

    const results = await Promise.allSettled([
        buildSection('api/products', {
            headerText: 'Products',
            viewLink: 'product_viewer.html',
            editor: 'library',
            deleteURL: 'api/product'
        }),
        buildSection('api/gallery', {
            headerText: 'Gallery',
            viewLink: 'gallery.html',
            editor: 'gallery',
            deleteURL: 'api/gallery'
        }),
        buildSection('api/portfolio', {
            headerText: 'Portfolio Items',
            viewLink: 'portfolio.html',
            editor: 'portfolio',
            deleteURL: 'api/portfolio'
        }),
        buildSection('api/blogs', {
            headerText: 'Blog Posts',
            viewLink: 'blog_viewer.html',
            editor: 'blog',
            deleteURL: 'api/blog'
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
    const user = await buildComponents();
    console.log(user);

    if (!await basicAdminAccessRequest(user)) {
        console.warn('Access denied');
        return;
    }

    buildSections();
});