import { buildComponents } from "./components";

import type { Product } from "./product";

const fillLibrary = async () => {
    const library = document.getElementById('library');
    if (!library) {
        console.error('No library object found');
        return;
    }

    try {
        const result = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);

        if (!result.ok) { throw new Error(`Failed to fetch products.`); }

        const products: Product[] = await result.json();
        library.append(...products.map(p => generateListItem(p)).reverse());
    } catch (e) {
        console.error(e);
    }
}

const generateListItem = (p: Product) => {
    const visualClasses = ['background', 'sheen', 'sheen-top', 'vignette'];
    const visuals = visualClasses.map(c => {
        const element = document.createElement('div');
        element.className = c;

        return element;
    });
    visuals[0].style.backgroundImage = `url('/Resources/Images/Splash/splash_${p.id}.png')`;

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = p.title;

    const hook = document.createElement('span');
    hook.className = 'hook';
    hook.textContent = p.hook;
    
    const button = document.createElement('a');
    button.className = 'product-list-item';
    button.href = `product_viewer.html?id=${p.id}`;
    button.append(...visuals, title, hook);
    
    const listItem = document.createElement('li');
    listItem.appendChild(button);

    return listItem;
}

document.addEventListener('DOMContentLoaded', async () => {
    await buildComponents();
    await fillLibrary();
});