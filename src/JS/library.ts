import { buildComponents } from "./components";
import { API_URL } from "./config";
import { safeLink } from "./site-nav";
import type { Product } from "./product";

// TODO : Replace "common" scripts with these templates
/*
import { buildScripts, DataRequest } from "./page-builder"

const product = ['id', 'title', 'hook', 'splash_art_link'];
const visuals = ['background', 'sheen', 'sheen-top', 'vignette'].map(name => { 
    const obj: any = { tag: 'div', className: name }

    if (name === 'background') {
        obj.backgroundImage = product[3];
        obj.requires = 'product';
    }

    return obj;
});

const template = {
    'library': {
        function: 'list', requires: 'product',
        args: [{ 
            tag: 'button', className: 'product-list-item',
            function: 'click', requires: 'product',
            args: { 
                action: 'link', baseURL: 'product_viewer.html',
                queryParams: [product[0]], requires: product[0] 
            },
            children: [
                ...visuals,
                { tag: 'span', className: 'title', textContent: product[1] },
                { tag: 'span', className: 'hook', textContent: product[2] }
            ]
        }]
    }
}
*/

const fillLibrary = async () => {
    const library = document.getElementById('library');

    if (!library) {
        console.error('No library object found');
        return;
    }

    try {
        const result = await fetch(`${API_URL}/api/products`);

        if (!result.ok) {
            throw new Error(`Failed to fetch products.`);
        }

        const products: Product[] = await result.json(); // Grab products
        const listItems = await Promise.all(products.map(p => generateListItem(p)));
        library.append(...listItems); // Add products to library
    } catch (e) {
        console.log(e);
    }
}

const generateListItem = async (p: Product) => {
    const visualClasses = ['background', 'sheen', 'sheen-top', 'vignette'];
    const visuals = visualClasses.map(c => {
        const element = document.createElement('div');
        element.className = c;

        return element;
    });
    visuals[0].style.backgroundImage = `url(${p.splash_art_link})`;

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = p.title;

    const hook = document.createElement('span');
    hook.className = 'hook';
    hook.textContent = p.hook;
    
    const hyperlink = await safeLink(`product_viewer.html?id=${p.id}`);
    const button = document.createElement('a');
    button.className = 'product-list-item';
    button.append(...visuals, title, hook);
    button.href = hyperlink;
    
    const listItem = document.createElement('li');
    listItem.appendChild(button);

    return listItem;
}

document.addEventListener('DOMContentLoaded', () => {
    buildComponents();
    fillLibrary();
});