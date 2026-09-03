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

let cardMap: Map<string, HTMLElement[]>; // Stores generated cards that can be overwritten via filter
let sections: Record<string, Section>;
let categories: string[];

let gallerySelect: HTMLSelectElement;
let emptyGalleryMessage: HTMLElement | null;
let editor: GalleryEditor;

// =================== GALLERY LOADING ===================

const loadGallery = async (category?: string) => {
    const galleryGrid = document.getElementById('gallery-grid');

    if (!galleryGrid) {
        console.error("Gallery grid container not found.");
        return;
    }
    
    if (category === 'None') {
        category = undefined; // Remove the value so we don't query for 'None'
    }

    // Gather the expected gallery data from DB
    const galleryItems = await getGalleryItems(category);
    
    if (!galleryItems) {
        console.warn("Gallery query failed.");
        return;
    }

    emptyGallery(); 
    // Putting this in separate block so it immediately leaves scope after use
    {
        const emptyGalleryMessage = document.getElementById('empty-gallery-message');
        if (emptyGalleryMessage) {
            if (galleryItems.length === 0) {
                emptyGalleryMessage.style.display = 'block';
                return;
            } else {
                emptyGalleryMessage.style.display = 'none';
            }      
        }
    }
    
    // Prepare the cards
    galleryItems.forEach((i: GalleryItem) => {
        const { category, element } = generateImageCard(i);

        if (!cardMap.has(category)) { cardMap.set(category, []); }

        cardMap.get(category)?.push(element);
    });

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

const emptyGallery = () => {
    cardMap?.forEach(s => s.forEach(e => e.remove())); // Remove all cards
    for (let category in sections) {
        sections[category].section.remove();
    }

    cardMap = new Map<string, HTMLElement[]>();
    sections = {};
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

const getGalleryItems = async (category?: string) => {
    try {
        const url = `${API_URL}/api/gallery${category ? `?category=${category}` : ''}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    }
    catch (e) {
        console.error("Failed to fetch gallery items:", e);
        return [];
    }
}

// =================== SETUP ===================

// Special version of the GalleryUploader updateCategories() for efficiency
const updateCategories = async () => {
    // Disable filters until prepared
    gallerySelect.disabled = true; 
    editor?.setSelectDisabled(true);

    try {
        const resCategories = await fetch(`${API_URL}/api/products?onlyTitles=true`);

        if (!resCategories.ok) {
            throw new Error(`Failed to fetch categories: ${resCategories.status}`);
        }

        // Get category array from server and populate options
        categories = await resCategories.json();
        categories.forEach(c => {
            const nextOptGallery = document.createElement('option');
            
            nextOptGallery.value = c;
            nextOptGallery.textContent = c;

            gallerySelect.add(nextOptGallery);
        });

        // Re-enable filters only on success
        gallerySelect.disabled = false;
        editor?.setSelectDisabled(false);
    } catch (e: any) {
        console.error(e);
    }
}

const toggleUploadMenu = () => {
    if (!editor) { return; }
    
    const container = editor.getContainer();

    if (!container) { return; }
    
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener("DOMContentLoaded", async () => {
    buildComponents();

    emptyGalleryMessage = document.getElementById('empty-gallery-message');
    if (emptyGalleryMessage) {
        emptyGalleryMessage.style.display = 'none';
    }

    gallerySelect = document.getElementById('gallery-select') as HTMLSelectElement;
    if (gallerySelect) {
        gallerySelect.addEventListener('change', () => loadGallery(gallerySelect.value));
        updateCategories();

        // TODO : Replace this with server HTML injection
        if (await basicAdminAccessRequest()) {
            const uploadText = document.createElement('span');
            uploadText.classList = 'upload-text';
            uploadText.textContent = 'Upload New Image';

            gallerySelect.insertAdjacentElement('afterend', uploadText);
            editor = new GalleryEditor();

            const editorContainer = await editor.generateEditor();
            if (editorContainer) {
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close';
                closeButton.addEventListener('click', toggleUploadMenu);

                uploadText.insertAdjacentElement('afterend', editorContainer);
                editorContainer.appendChild(closeButton);
            }
            uploadText.addEventListener('click', toggleUploadMenu);
        }
    }

    toggleUploadMenu();
    loadGallery();
});