import { Editor } from './editor';

const keys = { body: 'body', content: 'content', placeholder: 'placeholder' };

export class BlogEditor extends Editor {
    constructor(isUpdate: boolean = false) {
        super(isUpdate);
        this.locateElements();

        if (this.getContainer()) { this.init(); }
    }

    setContent = (title: string, body: string) => {
        this.setText(document.getElementById('blog-title'), title);
        this.setText(this.getEl(keys.content), body);
    }

    protected getTemplate = () => { 
        return {
            'blog-editor': { tag: 'div', classList: 'blog-editor', children: [
                { tag: 'span', id: 'title-label', classList: 'title-label', textContent: 'Title' },
                { tag: 'div', id: 'blog-title', classList: 'blog-title', edit: true },
                { tag: 'div', id: 'buttons', children: [
                    { tag: 'button', id: 'bold-button', textContent: 'Bold' },
                    { tag: 'button', id: 'em-button', textContent: 'Italics' },
                    { tag: 'button', id: 'u-button', textContent: 'Underline' },
                    { tag: 'button', id: 'url-button', textContent: 'URL' },
                    { tag: 'button', id: 'image-button', textContent: 'Image' },
                    { tag: 'button', id: 'size-button', textContent: 'Size' },
                ]},
                { tag: 'div', id: 'editor-body', classList: 'blog-editor-body', children: [
                    { tag: 'span', id: 'editor-content', classList: 'blog-editor-content', edit: true },
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

    protected locateElements = () => this.locate(
        { key: 'editor',         id: 'blog-editor'        },
        { key: keys.body,        id: 'editor-body'        },
        { key: keys.content,     id: 'editor-content'     },
        { key: keys.placeholder, id: 'editor-placeholder' }
    );
    
    protected init = () => {
        if (!this.getContainer()) {
            console.error('Editor does not exist on this page. Create it first');
            return;
        }

        const body = this.getEl(keys.body);
        if (body) {
            body.addEventListener('click', () => body.focus());
            body.addEventListener('input', this.updatePlaceholder);
            body.addEventListener('keyup', this.updatePlaceholder);
            body.addEventListener('focus', this.updatePlaceholder);
            body.addEventListener('blur', this.updatePlaceholder);
            body.addEventListener('paste', (e: ClipboardEvent) => this.fixPaste(e));
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
            if (!selection || !this.getEl(keys.body)?.contains(selection.anchorNode)) return;

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
        const isEmpty = this.getEl(keys.body)?.textContent.trim() === '';
        const placeholder = this.getEl(keys.placeholder);

        if (placeholder) {
            placeholder.style.display = isEmpty ? 'inline' : 'none';
        }
    }

    // Doesn't work super well right now, but it does prevent pasting rich text
    private fixPaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) return;

        e.preventDefault();

        const selection = window.getSelection();

        if (!selection) return;

        const range = selection.getRangeAt(0);

        if (!range || !this.getEl(keys.content)?.contains(range.commonAncestorContainer)) return;

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