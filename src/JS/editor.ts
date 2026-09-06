import type { Account } from "./account-manager";
import { API_URL } from "./config";
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

        const defaultDisplay = editor.style.display;

        // Hide editor while preparing contents
        editor.style.display = 'none';
        await this.init(user);
        editor.style.display = defaultDisplay;

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
            return;
        }

        // Redirect to viewing page on success
        if (await (this.isUpdate ? this.put : this.post)()) {
            window.location.href = `${this.getViewerURL()}?id=${this.getID()}`;
        }
    }

    private getPostBody = async () => await this.getColumns();

    private getPutBody = async () => {
        const { columns } = await this.getColumns();
        
        return { id: this.getID(), columns };
    }

    private post = async () => {
        try {
            const res = await fetch(`${API_URL}/api/${this.getTableName()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(await this.getPostBody()),
                credentials: 'include'
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
                body: JSON.stringify(await this.getPutBody()),
                credentials: 'include'
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