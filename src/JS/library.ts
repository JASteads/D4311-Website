import { buildComponents } from "./components";
import { Product } from "./product";
import { API_URL } from "./config";
import { safeLink } from "./site-nav";

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
    const button = document.createElement('button');
    button.className = 'product-list-item';
    button.append(...visuals, title, hook);
    button.addEventListener('click', () => { window.location.href = hyperlink; });
    
    const listItem = document.createElement('li');
    listItem.appendChild(button);

    return listItem;
}

document.addEventListener('DOMContentLoaded', () => {
    buildComponents();
    fillLibrary();
});