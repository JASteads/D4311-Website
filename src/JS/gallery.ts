import { Components } from "./components.ts";
import { API_URL } from "./config.ts";

class GalleryItem {
    title: string;
    category: string;
    caption: string;
    thumbnail_link: string;
    image_link: string;
    date_created: string;   

    constructor(title: string, category: string, caption: string, thumbnail_link: string, image_link: string, date_created: Date) {
        this.title = title;
        this.category = category;
        this.caption = caption;
        this.thumbnail_link = thumbnail_link;
        this.image_link = image_link;
        this.date_created = date_created.toISOString();
    }
}

// =================== PERSISTENT DATA ===================

let cardMap: Map<string, HTMLElement>; // Stores generated cards that can be overwritten via filter
let sections: Record<string, HTMLElement>;
let categories: string[];

let pendingUpload: File | null;

let gallerySelect: HTMLSelectElement;
let categorySelect: HTMLSelectElement;
let emptyGalleryMessage: HTMLElement | null;

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

// =================== IMAGE UPLOADING ===================

const browseImages = () => {
    let input: (HTMLInputElement | null) = document.createElement('input');
    input.type = 'file';

    const handleBrowse = (e: Event) => {
        const removeInput = () => {
            input?.removeEventListener('change', handleBrowse);
            input = null;
        }

        const target = e.target as HTMLInputElement;
        if (!target.files) {
            console.error("No files selected");
            removeInput();
            return;
        }

        if (target.files[0].type !== 'image/png') {
            alert('File must be a PNG');
            removeInput();
            return;
        }

        const preview = document.getElementById('upload-preview');
        if (!preview) {
            console.error("Preview is missing");
            removeInput();
            return;
        }

        pendingUpload = target.files[0];
        preview.textContent = pendingUpload.name;
        removeInput();
    }

    input.addEventListener('change', handleBrowse);
    input.click();
}

const uploadImage = async () => {
    if (!pendingUpload) {
        console.warn(`No file has been prepared to upload`);
        return;
    }

    // Prepare and attempt uploading new item
    const newItem = generateGalleryItem();
    try {
        const res = await fetch(`${API_URL}/api/gallery/upload`, {
            method: 'POST',
            body: pendingUpload,
            headers: {
                'Content-Type': pendingUpload.type || 'application/octet-stream',
                'X-File-Name': encodeURIComponent(pendingUpload.name),
                'Path': '/Resources/Images/Gallery',
                'Gallery-Item': JSON.stringify(newItem)
            }
        });

        if (!res.ok) {
            console.error("Upload failed");
            throw new Error(`HTTP Error: ${res.status}`);
        }

        alert('File uploaded to gallery successful');
    } catch (e) {
        console.error('File upload failed:', e);
        return;
    }
}

const generateGalleryItem = (): GalleryItem =>  {
    const title = document.getElementById('title-field');
    const category = document.getElementById('category-select') as HTMLSelectElement;
    const description = document.getElementById('description-field');

    return new GalleryItem(
        title ? title.textContent : 'Untitled',
        category ? category.value : 'Other',
        description ? description.textContent : '',
        '', // Thumbnail link not used
        '', // Image link not used
        new Date(Date.now())
    );
}

// =================== SETUP ===================

const updateCategories = async () => {
    // Disable filters until prepared
    gallerySelect.disabled = true; 
    categorySelect.disabled = true;

    try {
        const resCategories = await fetch(`${API_URL}/api/products?onlyTitles=true`);

        if (!resCategories.ok) {
            throw new Error(`Failed to fetch categories: ${resCategories.status}`);
        }

        // Get category array from server and populate options
        categories = await resCategories.json();
        categories.forEach(c => {
            const nextOptGallery = document.createElement('option');
            const nextOptCategory = document.createElement('option');
            
            nextOptGallery.value = c;
            nextOptGallery.textContent = c;
            
            nextOptCategory.value = c;
            nextOptCategory.textContent = c;

            gallerySelect.add(nextOptGallery);
            categorySelect.add(nextOptCategory);
        });

        // Re-enable filters only on success
        gallerySelect.disabled = false;
        categorySelect.disabled = false;

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
        pendingUpload = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new Components();

    emptyGalleryMessage = document.getElementById('empty-gallery-message');
    if (emptyGalleryMessage) {
        emptyGalleryMessage.style.display = 'none';
    }

    gallerySelect = document.getElementById('gallery-select') as HTMLSelectElement;
    categorySelect = document.getElementById('category-select') as HTMLSelectElement;
    if (gallerySelect && categorySelect) {
        updateCategories();
        gallerySelect.addEventListener('change', () => loadGallery(gallerySelect.value));
    }

    const browseButton = document.getElementById('browse-button');
    browseButton?.addEventListener('click', browseImages);

    const openUploadButton = document.getElementById('upload-text');
    openUploadButton?.addEventListener('click', () => setUploadMenuVisibility(true));

    const closeUploadButton = document.getElementById('close-button');
    closeUploadButton?.addEventListener('click', () => setUploadMenuVisibility(false));

    const uploadButton = document.getElementById('upload-button') as HTMLButtonElement;
    uploadButton?.addEventListener('click', uploadImage);
    
    loadGallery();
});