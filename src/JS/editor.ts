import { API_URL } from "./config";
import { buildScripts } from "./page-builder";
import { basicAdminAccessRequest } from "./permissions";
import { safeLink } from "./site-nav";

export abstract class Editor {
    protected editor: HTMLElement | null = null;
    protected isUpdate: boolean;

    constructor(isUpdate: boolean = false) {
        this.isUpdate = isUpdate;
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

    getContainer = () => this.editor;
    
    generateEditor = async () => {
        if (this.editor) {
            console.warn('Editor already exists');
            return this.editor;
        }
        await buildScripts(this.getTemplate());

        this.locateElements();
        this.init();

        return this.editor!;
    };

    protected publish = async () => {
        console.log('Publish');
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