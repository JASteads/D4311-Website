import { buildComponents } from "./components.ts";
import { API_URL } from "./config.ts";
import { GalleryEditor } from "./gallery-editor.ts";
import type { GalleryItem } from "./gallery-item.ts";
import { basicAdminAccessRequest } from "./permissions.ts";

class Section {
    section: HTMLElement;
    container: HTMLElement;

    constructor(section: HTMLElement, container: HTMLElement) {
        this.section = section;
        this.container = container;
    }
}

// =================== PERSISTENT DATA ===================

let gallerySelect: HTMLSelectElement;
let editor: GalleryEditor;

const sections: Record<string, Section> = {};
const cardMap = new Map<string, HTMLElement[]>(); // Stores generated cards that can be overwritten via filter
const galleryItems: any[] = [];

const updateDisplay = (category: string) => {
    let categoryShown = false;
    Object.entries(sections).forEach(i => {
        i[1].section.hidden = !(category === 'None' || i[0] === category);
        categoryShown = categoryShown || !i[1].section.hidden;
    });

    const message = document.getElementById('empty-gallery-message');
    if (message) { message.hidden = categoryShown; }
}

// =================== SETUP ===================

const getGalleryItems = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gallery`);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        return (await res.json()).map((i: any) => ({
            id: i.id,
            title: i.title,
            caption: i.caption,
            category: i.category,
            createdAt: new Date(Date.parse(i.created_at)).toLocaleString()
        }));
    }
    catch (e) {
        console.error("Failed to fetch gallery items:", e);
        return [];
    }
}

const loadGallery = async () => {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) {
        console.error("Gallery grid container not found.");
        return;
    }

    // Gather the expected gallery data from DB
    if (galleryItems.length === 0) {
        galleryItems.push(...await getGalleryItems());
    }
    
    if (galleryItems.length === 0) {
        const message = document.getElementById('empty-gallery-message');
        if (message) { message.hidden = false; }
        return;
    }
    
    galleryItems.forEach((i: GalleryItem) => {
        const { category, element } = generateImageCard(i);

        if (!cardMap.has(category)) { cardMap.set(category, []); }
        cardMap.get(category)?.push(element);
    });
    await updateCategories();
    
    // Create and populate sections with the new cards
    cardMap.forEach((section, category) => {
        if (!(category in sections)) {
            sections[category] = generateCardSection(category);
        }

        sections[category].container.append(...section);
    });

    for (let category in sections) {
        galleryGrid.appendChild(sections[category].section);
    }
}

// Does not use caption or date yet. This is intended for when full images are rendered on top of the page.
const generateImageCard = (item: GalleryItem) => {
    const galleryLocation = 'Resources/Images/Gallery/';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    thumbnail.src = `${galleryLocation}preview_gallery_${item.id}.png`;
    thumbnail.alt = item.title;
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    
    const imageLink = document.createElement('a');
    imageLink.href = `${galleryLocation}gallery_${item.id}.png`;
    imageLink.target = '_blank';
    imageLink.appendChild(thumbnail);

    const cardElement = document.createElement('div');
    cardElement.className = 'gallery-card';
    cardElement.appendChild(imageLink);

    return { category: item.category, element: cardElement };
}

const generateCardSection = (categoryName: string) => {
    const section = document.createElement('section');
    section.className = 'card-section';
    
    const title = document.createElement('h2');
    title.textContent = categoryName;

    const container = document.createElement('div');
    container.className = 'image-container';

    section.appendChild(title);
    section.appendChild(container);

    return { section, container };
}

// Special version of the GalleryUploader updateCategories() for efficiency
const updateCategories = async () => {
    // Disable filters until prepared
    gallerySelect.disabled = true;

    try {
        const resCategories = await fetch(`${import.meta.env.VITE_API_URL}/api/products?onlyTitles=true`);

        if (!resCategories.ok) {
            throw new Error(`Failed to fetch categories: ${resCategories.status}`);
        }

        // Get category array from server and populate options
        (await resCategories.json()).forEach((c: string) => {
            const nextOptGallery = document.createElement('option');
            nextOptGallery.value = c;
            nextOptGallery.textContent = c;

            gallerySelect.add(nextOptGallery);
        });

        // Re-enable filters only on success
        gallerySelect.disabled = false;
    } catch (e: any) {
        console.error(e);
    }
}

const toggleUploadMenu = () => {
    if (!editor) { return; }
    
    const container = editor.getContainer();

    if (!container) { return; }
    
    container.hidden = !container.hidden;
}

document.addEventListener("DOMContentLoaded", async () => {
    const user = await buildComponents();

    gallerySelect = document.getElementById('gallery-select') as HTMLSelectElement;
    if (gallerySelect) {
        gallerySelect.addEventListener('change', async () => updateDisplay(gallerySelect.value));

        // TODO : Replace this with server HTML injection
        if (await basicAdminAccessRequest(user)) {
            const uploadText = document.createElement('span');
            uploadText.classList = 'upload-text';
            uploadText.textContent = 'Upload New Image';

            gallerySelect.insertAdjacentElement('afterend', uploadText);
            editor = new GalleryEditor(user);

            const editorContainer = await editor.generateEditor(user);
            if (editorContainer) {
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close';
                closeButton.addEventListener('click', toggleUploadMenu);

                uploadText.insertAdjacentElement('afterend', editorContainer);
                editorContainer.appendChild(closeButton);
            }

            const container = editor.getContainer();
            if (container) {
                container.hidden = true;
                uploadText.addEventListener('click', () => container.hidden = !container.hidden);
            }
        }
    }

    await loadGallery();
    document.body.getElementsByTagName('main')[0].hidden = false;
});