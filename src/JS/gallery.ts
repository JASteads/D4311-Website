import { buildComponents } from "./components.ts";
import { API_URL } from "./config.ts";
import { GalleryUploader } from "./gallery-uploader.ts";
import type { GalleryItem } from "./gallery-item.ts";

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
const uploader = new GalleryUploader(false);

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

        if (!cardMap.has(category)) {
            cardMap.set(category, []);
        }

        cardMap.get(category)?.push(element);
    });
    console.log(cardMap);

    // Create and populate sections with the new cards
    cardMap.forEach((section, category) => {
        if (!(category in sections)) {
            sections[category] = generateCardSection(category);
        }

        sections[category].container.append(...section);
    });
    console.log(sections);

    for (let category in sections) {
        galleryGrid.appendChild(sections[category].section);
    }
}

const generateCardSection = (categoryName: string): Section => {
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
    console.log('Generating image card for', item.title);
    const galleryLocation = 'Resources/Images/Gallery/';

    const cardElement = document.createElement('div');
    cardElement.className = 'gallery-card';

    const image_link = document.createElement('a');
    image_link.href = galleryLocation.concat(item.image_link);
    image_link.target = '_blank';
    cardElement.appendChild(image_link);

    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    thumbnail.src = galleryLocation.concat(item.thumbnail_link);
    thumbnail.alt = item.title;
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    image_link.appendChild(thumbnail);

    return { category: item.category, element: cardElement };
}

const getGalleryItems = async (category?: string): Promise<any[]> => {
    try {
        let url = `${API_URL}/api/gallery`;
        if (category) {
            url += `?category=${category}`;
        }
        console.log(url);

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
    uploader.setSelectDisabled(true);

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

            uploader.addCategory(c);
        });

        // Re-enable filters only on success
        gallerySelect.disabled = false;
        uploader.setSelectDisabled(false);

        console.log("Categories updated");
    } catch (e) {
        console.error(e);
    }
}

const setUploadMenuVisibility = (isVisible: boolean) => {
    const uploadContainer = document.getElementById('upload-container');

    if (!uploadContainer) {
        console.error('No upload menu connected to this button');
        return;
    }
    
    // Allow initial toggle button to also close the container if already open
    if (isVisible && uploadContainer.style.display === 'none') {
        uploadContainer.style.display = 'block';
    } else {
        uploadContainer.style.display = 'none';

        // Reset the preview text
        const preview = document.getElementById('upload-preview');
        if (!preview) {
            console.error("Preview is missing");
        } else {
            preview.textContent = "File Name..";
        }

        // Remove the pending upload so we can start over
        uploader.clearPendingUpload();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    buildComponents();

    emptyGalleryMessage = document.getElementById('empty-gallery-message');
    if (emptyGalleryMessage) {
        emptyGalleryMessage.style.display = 'none';
    }

    gallerySelect = document.getElementById('gallery-select') as HTMLSelectElement;
    if (gallerySelect) {
        gallerySelect.addEventListener('change', () => loadGallery(gallerySelect.value));
        updateCategories();
    }

    const openUploadButton = document.getElementById('upload-text');
    openUploadButton?.addEventListener('click', () => setUploadMenuVisibility(true));

    const closeUploadButton = document.getElementById('close-button');
    closeUploadButton?.addEventListener('click', () => setUploadMenuVisibility(false));

    setUploadMenuVisibility(false);
    loadGallery();
});