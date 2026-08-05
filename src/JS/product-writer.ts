import { API_URL } from "./config";
import { basicAdminAccessRequest } from "./permissions";

export class ProductWriter {
    titleField: HTMLElement | null;
    descriptionField: HTMLElement | null;
    dateField: HTMLElement | null;
    splashArtLinkField: HTMLElement | null;
    txnLinkField: HTMLElement | null;
    
    constructor() {
        this.titleField = document.getElementById('product-title-field');
        this.descriptionField = document.getElementById('product-description-field');
        this.dateField = document.getElementById('product-date-field')
        this.splashArtLinkField = document.getElementById('product-splash-field');
        this.txnLinkField = document.getElementById('product-txn-field');
     
        const uploadButton = document.getElementById('product-upload-button');
        if (uploadButton) {
            uploadButton.addEventListener('click', this.publish);
        }
    }

    private publish = async () => {
        if (await basicAdminAccessRequest() === 'false') {
            console.warn('Access denied');
            return;
        }
        
        const record = {
            title: this.titleField?.textContent || 'Untitled',
            description: this.descriptionField?.textContent || '',
            splash_art_link: this.splashArtLinkField?.textContent || '',
            txn_link: this.txnLinkField?.textContent || ''
        };

        try {
            const result = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                body: JSON.stringify(record),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!result.ok) {
                throw new Error(`Error code: ${result.status}`);
            }
        } catch (e) {
            console.error('Something went wrong with publishing the product', e);
        }
    }
}