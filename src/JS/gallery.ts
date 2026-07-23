import { Components } from "./components.ts";
import { API_URL } from "./config.ts";
import { GalleryUploader } from "./gallery-uploader.ts";
import { GalleryItem } from "./gallery-item.ts";

// =================== PERSISTENT DATA ===================

let cardMap: Map<string, HTMLElement>; // Stores generated cards that can be overwritten via filter
let sections: Record<string, HTMLElement>;
let categories: string[];

let gallerySelect: HTMLSelectElement;
let emptyGalleryMessage: HTMLElement | null;
let uploader: GalleryUploader;

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
    if (!galleryItems || galleryItems.length === 0) {
        console.warn("No gallery items found.");
        return;
    }

    // Reset the gallery, then prepare the cards
    emptyGallery(); 
    galleryItems.forEach((i: GalleryItem) => {
        const { category, element } = generateImageCard(i);

        cardMap.set(category, element);
    });

    // Create and populate sections with the new cards
    cardMap.forEach((element, category) => {
        if (!(category in sections)) {
            sections[category] = generateCardSection(category);
        }
        sections[category].appendChild(element);
    });
}

const generateCardSection = (categoryName: string): HTMLElement => {
    const section = document.createElement('section');
    
    const title = document.createElement('h2');
    title.textContent = categoryName;

    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-section';

    section.append(title, cardContainer);

    return section;
}

const emptyGallery = () => {
    cardMap?.forEach(e => e.remove);
    for (let category in sections) {
        sections[category].remove();
    }

    cardMap = new Map<string, HTMLElement>();
    sections = {};
}

// Does not use caption or date yet. This is intended for when full images are rendered on top of the page.
const generateImageCard = (item: GalleryItem) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'gallery-card';

    const image_link = document.createElement('a');
    image_link.href = item.image_link;
    image_link.target = '_blank';
    cardElement.appendChild(image_link);

    const thumbnail = document.createElement('img');
    thumbnail.className = 'card-thumbnail';
    thumbnail.src = item.thumbnail_link;
    thumbnail.alt = item.title;
    image_link.appendChild(thumbnail);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    cardElement.appendChild(title);

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
const updateCategories = async (uploader: GalleryUploader) => {
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
    new Components();
    uploader = new GalleryUploader(false);

    emptyGalleryMessage = document.getElementById('empty-gallery-message');
    if (emptyGalleryMessage) {
        emptyGalleryMessage.style.display = 'none';
    }

    gallerySelect = document.getElementById('gallery-select') as HTMLSelectElement;
    if (gallerySelect) {
        gallerySelect.addEventListener('change', () => loadGallery(gallerySelect.value));
        updateCategories(uploader);
    }

    const openUploadButton = document.getElementById('upload-text');
    openUploadButton?.addEventListener('click', () => setUploadMenuVisibility(true));

    const closeUploadButton = document.getElementById('close-button');
    closeUploadButton?.addEventListener('click', () => setUploadMenuVisibility(false));

    setUploadMenuVisibility(false);
    loadGallery();
});