import { buildComponents } from "./components.ts";
import { GalleryUploader } from "./gallery-uploader.ts";
import { PortfolioWriter } from "./portfolio-writer.ts";
import { ProductWriter } from "./product-writer.ts";
import { BlogEditor } from "./blog-editor.ts";
import { basicAdminAccessRequest } from "./permissions.ts";

// TODO : Modularize image browsing feature from GalleryUploader
//        so multiple upload tools can upload images
 
document.addEventListener("DOMContentLoaded", async () => {
    buildComponents();

    if (!await basicAdminAccessRequest()) {
        console.warn('Access denied');
        return; // Get yeeted
    }

    new GalleryUploader(true);
    new BlogEditor();
    new PortfolioWriter();
    new ProductWriter();

    // Find and hide all editor containers
    const items = [
        {   input: document.getElementById('product-input'), 
            container: document.getElementById('product-writer') },

        {   input: document.getElementById('image-input'), 
            container: document.getElementById('gallery-uploader') },

        {   input: document.getElementById('blog-input'), 
            container:  document.getElementById('blog-editor') },
            
        {   input: document.getElementById('portfolio-input'), 
            container: document.getElementById('portfolio-writer') }
    ].filter((i): i is { input: HTMLInputElement; container: HTMLElement } => 
        i.input instanceof HTMLInputElement && i.container instanceof HTMLElement);
    items.forEach(i => i.container.style.display = 'none');

    const chooseButton = document.getElementById('choose-button') as HTMLButtonElement;
    chooseButton?.addEventListener('click', () => 
        items.forEach(i => i.container.style.display = i.input.checked ? 'block' : 'none')
    );
});