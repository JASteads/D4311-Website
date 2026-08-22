import { API_URL } from "./config";
import { buildScripts } from "./page-builder";
import { basicAdminAccessRequest } from "./permissions";
import { safeLink } from "./site-nav";

export abstract class Editor {
    protected isUpdate: boolean;
    private elements: Map<string, HTMLElement | null> = new Map();

    constructor(isUpdate = false) {
        this.isUpdate = isUpdate;
        this.elements.set('editor', null);
    }

    abstract setContent(...content: any): void;
    protected abstract init(): void;
    protected abstract locateElements(): void;
    protected abstract getTemplate(): any;
    protected abstract getTableName(): string;
    protected abstract getPostBody(): any;
    protected abstract getPutBody(): any;
    protected abstract getViewerURL(): string;

    private getID = () => new URLSearchParams(window.location.search).get('id');

    getContainer = () => this.getEl('editor');
    
    generateEditor = async () => {
        if (this.getContainer()) {
            console.warn('Editor already exists');
            return this.getContainer();
        }
        await buildScripts(this.getTemplate());
        this.locateElements();
        
        const editor = this.elements.get('editor')!;
        const defaultDisplay = editor.style.display;

        // Hide editor while preparing contents
        editor.style.display = 'none';
        await this.init();
        editor.style.display = defaultDisplay;

        return editor;
    };

    protected setText(element: HTMLElement | null, text: string) { if (element) element.textContent = text; }

    protected locate = (...items: { key: string; id: string; }[]) => { 
        items.forEach(i => this.elements.set(i.key, document.getElementById(i.id)));
    }

    protected getEl = (key: string) => this.elements.get(key) || null;

    protected publish = async () => {
        if (!await basicAdminAccessRequest()) {
            console.warn('Access denied');
            return;
        }

        let id = this.getID();
        
        if (this.isUpdate) {
            await this.put();
        } else {
            id = (await this.post()).id;
        }
        
        window.location.href = await safeLink(`${this.getViewerURL()}?id=${id}`);
    }

    private post = async () => {
        try {
            const res = await fetch(`${API_URL}/api/${this.getTableName()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.getPostBody())
            });

            if (!res.ok) throw new Error('Failed to create blog post');

            const itemResult = await res.json();
            alert('Added: ' + itemResult.title);

            return itemResult;
        } catch (e) {
            console.error('Failed to add:', e);
        }
    };

    private put = async () => {
        try {
            const res = await fetch(`${API_URL}/api/${this.getTableName()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.getPutBody())
            });

            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }

            return await res.json();
        } catch (e) {
            alert(`Failed to update: ${e}`);
        }
    }
}