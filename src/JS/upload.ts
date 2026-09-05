import { buildComponents } from "./components.ts";
import { GalleryEditor } from "./gallery-editor.ts";
import { PortfolioWriter } from "./portfolio-writer.ts";
import { ProductWriter } from "./product-writer.ts";
import { BlogEditor } from "./blog-editor.ts";
import { basicAdminAccessRequest } from "./permissions.ts";
import { safeLink } from "./site-nav.ts";

document.addEventListener("DOMContentLoaded", async () => {
    const details = document.getElementById('submission-details');
    const main = document.getElementById('main-upload');
    if (!(details && main)) { 
        console.error('No main or submission details on page');
        return;
    }

    details.style.display = 'none';
    main.style.display = 'none';

    const user = await buildComponents();
    if (!await basicAdminAccessRequest(user)) {
        window.location.href = await safeLink('load_fail.html');
        return; // Get yeeted
    }

    // Find and hide all editor containers
    const items = [
        { input: document.getElementById('product-input'),   container: new ProductWriter(user).getContainer() },
        { input: document.getElementById('image-input'),     container: new GalleryEditor(user).getContainer() },
        { input: document.getElementById('blog-input'),      container: new BlogEditor(user).getContainer() },
        { input: document.getElementById('portfolio-input'), container: new PortfolioWriter(user).getContainer() }
    ].filter((i): i is { input: HTMLInputElement; container: HTMLElement } => 
        i.input instanceof HTMLInputElement && i.container instanceof HTMLElement);
    items.forEach(i => i.container.style.display = 'none');

    const chooseButton = document.getElementById('choose-button') as HTMLButtonElement;
    chooseButton?.addEventListener('click', () => 
        items.forEach(i => i.container.style.display = i.input.checked ? 'block' : 'none')
    );
    
    details.style.display = 'block';
    main.style.display = 'flex';
});