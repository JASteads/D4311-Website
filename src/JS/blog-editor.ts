import { Editor } from './editor';

export class BlogEditor extends Editor {
    private editorBody: HTMLElement | null = null;
    private editorContent: HTMLElement | null = null;
    private editorPlaceholder: HTMLElement | null = null;

    constructor(isUpdate: boolean = false) {
        super(isUpdate);
        this.locateElements();

        if (this.editor) {
            this.init();
        }
    }

    setContent = (title: string, body: string) => {
        const titleField = document.getElementById('blog-title');
        if (titleField) {
            titleField.textContent = title;
        }

        const bodyField = document.getElementById('editor-content');
        if (bodyField) {
            bodyField.textContent = body;
        }
    }

    protected getTemplate = () => { 
        return {
            'blog-editor': { tag: 'div', classList: 'blog-editor', children: [
                { tag: 'span', id: 'title-label', classList: 'title-label', textContent: 'Title' },
                { tag: 'div', id: 'blog-title', classList: 'blog-title' },
                { tag: 'div', id: 'buttons', children: [
                    { tag: 'button', id: 'bold-button', textContent: 'Bold' },
                    { tag: 'button', id: 'em-button', textContent: 'Italics' },
                    { tag: 'button', id: 'u-button', textContent: 'Underline' },
                    { tag: 'button', id: 'url-button', textContent: 'URL' },
                    { tag: 'button', id: 'image-button', textContent: 'Image' },
                    { tag: 'button', id: 'size-button', textContent: 'Size' },
                ]},
                { tag: 'div', id: 'editor-body', classList: 'blog-editor-body', children: [
                    { tag: 'span', id: 'editor-content', classList: 'blog-editor-content' },
                    { tag: 'span', id: 'editor-placeholder', classList: 'blog-editor-placeholder' }
                ]},
                { tag: 'button', id: 'publish-button', textContent: 'Update' }
            ]}
        }
    }

    protected getViewerURL = () => 'blog_viewer.html';

    protected getTableName = () => 'blog';

    protected getPostBody = () => {
        const placeholderAuthor = 'Lemon'; // Replace later with local storage
        const title = document.getElementById('blog-title')?.textContent.trim() || '';
        const body = document.getElementById('editor-content')?.textContent.trim() || '';

        return { title, placeholderAuthor, body };
    }

    protected getPutBody = () => {
        const title = document.getElementById('blog-title')?.textContent.trim() || 'Untitled';
        const body = document.getElementById('editor-content')?.textContent.trim() || '';        
        const id = new URLSearchParams(window.location.search).get('id');

        if (!id) {
            console.error('No ID specified for update');
            return;
        }

        return { id: parseInt(id), title, body };
    }

    protected locateElements = () => {
        this.editor = document.getElementById('blog-editor');
        this.editorBody = document.getElementById('editor-body');
        this.editorContent = document.getElementById('editor-content');
        this.editorPlaceholder = document.getElementById('editor-placeholder');
    }

    protected init = () => {
        if (!this.editor) {
            console.error('Editor does not exist on this page. Create it first');
            return;
        }

        const titleField = document.getElementById('blog-title');
        if (titleField) {
            titleField.contentEditable = 'true';
        }

        if (this.editorContent) {
            this.editorContent.contentEditable = 'true';
        }

        // Initialize editor body
        if (this.editorBody) {
            this.editorBody.addEventListener('click', () => this.editorContent?.focus());
            this.editorBody.addEventListener('input', this.updatePlaceholder);
            this.editorBody.addEventListener('keyup', this.updatePlaceholder);
            this.editorBody.addEventListener('focus', this.updatePlaceholder);
            this.editorBody.addEventListener('blur', this.updatePlaceholder);
            this.editorBody.addEventListener('paste', (e: ClipboardEvent) => this.fixPaste(e));
        }

        this.updatePlaceholder();

        // Initialize formatting tools
        this.assignLabel('b', document.getElementById('bold-button'));
        this.assignLabel('i', document.getElementById('em-button'));
        this.assignLabel('u', document.getElementById('u-button'));
        this.assignLabel('url', document.getElementById('url-button'));
        this.assignLabel('img', document.getElementById('image-button'));
        this.assignLabel('size', document.getElementById('size-button'));

        const publishButton = document.getElementById('publish-button');
        publishButton?.addEventListener('click', this.publish);
    }

    // =================== EDITOR-SPECIFIC FUNCTIONS ===================

    /**
     * Gives the target button the ability to augment text.
     */
    private assignLabel = (type: string, button: HTMLElement | null) => {
        if (!button) return;

        const activateLabelButton = (type: string) => {
            const selection = window.getSelection();

            // Make sure only the text editor is being modified
            if (!selection || !this.editorBody?.contains(selection.anchorNode)) return;

            console.log('Selection area found');
            
            // Properties setup
            const range = selection.getRangeAt(0);
            const targetText = range.toString();
            const labeledText = `[${type}]${targetText}[/${type}]`;
            const textNode = document.createTextNode(labeledText);
            
            // Clear the selected area, replace with the labeled text, and prepare reselection
            range.deleteContents();
            range.insertNode(textNode);
            range.setStart(textNode, 0);
            range.setEnd(textNode, textNode.length);
            
            // Finally, reselect using the new selection range
            selection.removeAllRanges();
            selection.addRange(range);

            // Update placeholder text in case it's empty
            this.updatePlaceholder(); 
        }

        button.addEventListener('click', () => activateLabelButton(type));
    }

    private updatePlaceholder = () => {
        const isEmpty = this.editorContent?.textContent.trim() === '';

        if (this.editorPlaceholder) {
            this.editorPlaceholder.style.display = isEmpty ? 'inline' : 'none';
        }
    }

    // Doesn't work super well right now, but it does prevent pasting rich text
    private fixPaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) return;

        e.preventDefault();

        const selection = window.getSelection();

        if (!selection) return;

        const range = selection.getRangeAt(0);

        if (!range || !this.editorContent?.contains(range.commonAncestorContainer)) return;

        const plainText = e.clipboardData.getData('text/plain');
        const textNode = document.createTextNode(plainText);

        range.deleteContents();
        range.insertNode(textNode);
        range.setStart(textNode, textNode.length);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        this.updatePlaceholder();
    }
}