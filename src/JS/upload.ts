import { buildComponents } from "./components.ts";
import { GalleryUploader } from "./gallery-uploader.ts";
import { PortfolioWriter } from "./portfolio-writer.ts";
import { ProductWriter } from "./product-writer.ts";
import { BlogEditor } from "./blog-editor.ts";

const inputs: HTMLInputElement[] = [];
let containers: Record<string, HTMLElement | null>;

// TODO : Modularize image browsing feature from GalleryUploader
//        so multiple upload tools can upload images
 
const selectEditor = () => {
    const selected = inputs.find(i => i?.checked === true)?.value;

    if (!selected) {
        console.error("No valid input selected");
        return;
    }

    for (let key in containers) {
        if (containers[key]) {
            containers[key].style.display = (key === selected) ? 'block' : 'none';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    buildComponents();
    new GalleryUploader(true);
    new BlogEditor();
    new PortfolioWriter();
    new ProductWriter();

    containers = {
        'product-writer': document.getElementById('product-writer'),
        'gallery-uploader': document.getElementById('gallery-uploader'),
        'blog-editor': document.getElementById('blog-editor'),
        'portfolio-writer': document.getElementById('portfolio-writer')
    };
    
    for (let key in containers) {
        if (containers[key]) {
            containers[key].style.display = 'none';
        }
    }

    inputs.push(document.getElementById('product-input') as HTMLInputElement);
    inputs.push(document.getElementById('image-input') as HTMLInputElement);
    inputs.push(document.getElementById('blog-input') as HTMLInputElement);
    inputs.push(document.getElementById('portfolio-input') as HTMLInputElement);

    const chooseButton = document.getElementById('choose-button') as HTMLButtonElement;
    chooseButton?.addEventListener('click', selectEditor);
});