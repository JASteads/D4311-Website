import { buildComponents } from "./components";
import { BlogEditor } from "./blog-editor";
import { ProductWriter } from "./product-writer";
import { PortfolioWriter } from "./portfolio-writer";
import { GalleryEditor } from "./gallery-editor";
import { basicAdminAccessRequest } from "./permissions";

import type { Editor } from "./editor";
import type { Account } from "./account-manager";

const loadEditor = async (user: Account, editor: Editor, ...content: any) => {
    const container = await editor.generateEditor(user);
    editor.setContent(...content);

    return container;
}

const load: { [key: string]: (user: Account, item: any) => Promise<HTMLElement | null> } = {
    'library': async (user: Account, item: any) => await loadEditor(user, 
        new ProductWriter(user, true), item.title, item.description, item.hook, item.date_created),

    'gallery': async (user: Account, item: any) => await loadEditor(user, 
        new GalleryEditor(user, true), item.title, item.caption, item.game_id),

    'portfolio': async (user: Account, item: any) => await loadEditor(user,
        new PortfolioWriter(user, true),
        item.title, item.lang_api, item.project_link, item.date, item.description),

    'blog': async (user: Account, item: any) => await loadEditor(user, 
        new BlogEditor(user, true), item.title, item.body)
};

const openEditor = async (user: Account) => {
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

    const editor = await load[editorName](user, data);
    if (editor) {
        document.getElementById('editor-container')?.appendChild(editor);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await buildComponents();
    
    if (!await basicAdminAccessRequest(user)) {
        console.warn('Access deined.');
        return;
    }
    await openEditor(user);
});