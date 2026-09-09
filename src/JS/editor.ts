import type { Account } from "./account-manager";

import { buildScripts } from "./page-builder";
import { basicAdminAccessRequest } from "./permissions";

export abstract class Editor {
    protected isUpdate: boolean;
    private elements: Map<string, HTMLElement | null> = new Map();

    constructor(isUpdate = false) {
        this.isUpdate = isUpdate;
        this.elements.set('editor', null);
    }

    abstract setContent(...content: any): void;
    protected abstract init(user: Account): void;
    protected abstract locateElements(): void;
    protected abstract getTemplate(): any;
    protected abstract getTableName(): string;
    protected abstract getViewerURL(): string;
    protected abstract getColumns(): Promise<{ columns: Record<string, string> }>;

    generateEditor = async (user: Account) => {
        if (this.getContainer()) {
            console.warn('Editor already exists');
            return this.getContainer();
        }
        await buildScripts(this.getTemplate());
        this.locateElements();
        
        const editor = this.elements.get('editor');
        if (!editor) {
            console.log('Failed to find editor');
            return null;
        }

        // Hide editor while preparing contents
        editor.hidden = true;
        await this.init(user);
        editor.hidden = false;

        return editor;
    };

    getContainer = () => this.getEl('editor');
    protected getEl = (key: string) => this.elements.get(key) || null;
    protected getID() {
        const item = window.sessionStorage.getItem('edit-item');
        const id = item ? JSON.parse(item).id : -1;
        return parseInt(id);
    };

    protected setText(element: HTMLElement | null, text: string) { if (element) element.textContent = text; }

    protected locate(...items: { key: string; id: string; }[]) { 
        items.forEach(i => this.elements.set(i.key, document.getElementById(i.id)));
    }

    protected publish = async (user: Account) => {
        if (!await basicAdminAccessRequest(user)) {
            console.warn('Access denied');
            return null;
        }
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${this.getTableName()}`, {
                method: this.isUpdate ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.isUpdate ? await this.getPutBody() : await this.getPostBody()),
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Failed to create blog post');
            window.sessionStorage.removeItem('edit-item');

            return await res.json();
        } catch (e) {
            console.error('Failed to add:', e);
            return null;
        }
    }

    private getPostBody = async () => await this.getColumns();

    private getPutBody = async () => {
        const { columns } = await this.getColumns();
        
        return { id: this.getID(), columns };
    }
}