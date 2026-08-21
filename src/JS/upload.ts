import { buildComponents } from "./components.ts";
import { GalleryEditor } from "./gallery-editor.ts";
import { PortfolioWriter } from "./portfolio-writer.ts";
import { ProductWriter } from "./product-writer.ts";
import { BlogEditor } from "./blog-editor.ts";
import { basicAdminAccessRequest } from "./permissions.ts";
 
document.addEventListener("DOMContentLoaded", async () => {
    buildComponents();

    if (!await basicAdminAccessRequest()) {
        console.warn('Access denied');
        return; // Get yeeted
    }

    // Find and hide all editor containers
    const items = [
        { input: document.getElementById('product-input'),   container: new ProductWriter().getContainer() },
        { input: document.getElementById('image-input'),     container: new GalleryEditor().getContainer() },
        { input: document.getElementById('blog-input'),      container: new BlogEditor().getContainer() },
        { input: document.getElementById('portfolio-input'), container: new PortfolioWriter().getContainer() }
    ].filter((i): i is { input: HTMLInputElement; container: HTMLElement } => 
        i.input instanceof HTMLInputElement && i.container instanceof HTMLElement);
    items.forEach(i => i.container.style.display = 'none');

    const chooseButton = document.getElementById('choose-button') as HTMLButtonElement;
    chooseButton?.addEventListener('click', () => 
        items.forEach(i => i.container.style.display = i.input.checked ? 'block' : 'none')
    );
});