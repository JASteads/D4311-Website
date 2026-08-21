import { buildComponents } from "./components";
import { BlogEditor } from "./blog-editor";
import { ProductWriter } from "./product-writer";
import { PortfolioWriter } from "./portfolio-writer";
import { GalleryEditor } from "./gallery-editor";
import { basicAdminAccessRequest } from "./permissions";
import type { Editor } from "./editor";

const loadEditor = async (editor: Editor, ...content: any) => {
    const container = await editor.generateEditor();
    editor.setContent(...content);

    return container;
}

const load: {[key: string]: (item: any) => Promise<HTMLElement> } = {
    'library': (item: any) => loadEditor(new ProductWriter(true),
        item.title, item.description, item.hook, item.date_created, item.splash_art_link),

    'gallery': (item: any) => loadEditor(new GalleryEditor(true)),

    'portfolio': async (item: any) => loadEditor(new PortfolioWriter(true)),

    'blog': async (item: any) => loadEditor(new BlogEditor(true),
        item.title, item.body)
};

const openEditor = async () => {
    const dataString = sessionStorage.getItem('edit-item');
    if (!dataString) {
        console.error('No edit item loaded');
        return;
    }

    const data = JSON.parse(dataString);
    const editorName = data.editor;

    if (editorName === undefined) {
        console.error('edit-item found, but editor value is undefined');
        return;
    }

    const editor = await load[editorName](data.item);

    document.getElementById('editor-container')?.appendChild(editor);
}

document.addEventListener('DOMContentLoaded', async () => {
    buildComponents();
    if (!await basicAdminAccessRequest()) {
        console.warn('Access deined.');
        return;
    }
    await openEditor();
});