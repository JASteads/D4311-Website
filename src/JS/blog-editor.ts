import { API_URL } from './config';
import { basicAdminAccessRequest } from './permissions';

export class BlogEditor {
    private editorBody: HTMLElement | null;
    private editorContent: HTMLElement | null;
    private editorPlaceholder: HTMLElement | null;

    constructor() {
        this.editorBody = document.getElementById('editor-body');
        this.editorContent = document.getElementById('editor-content');
        this.editorPlaceholder = document.getElementById('editor-placeholder');
        
        this.initializeEditor();
    }

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

    /**
     * Creates a blog post record for the database.
     */
    private postBlog = async (title: string, author: string, bodyText: string) => {
        const newBlog = { title, author, bodyText };
    
        try {
            const res = await fetch(`${API_URL}/api/blog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBlog)
            });

            if (!res.ok) throw new Error('Failed to create blog post');

            const blogResult = await res.json();
            alert('Added: ' + blogResult.title);
        } catch (e) {
            console.error('Failed to add:', e);
        }
    };

    public publishBlog = async () => {
        if (await basicAdminAccessRequest() === 'false') {
            console.warn('Access denied');
            return;
        }
        
        const placeholderAuthor = 'Lemon'; // Replace later with local storage
        const titleElement = document.getElementById('blog-title');
        const bodyElement = document.getElementById('blog-body');

        if (!titleElement || !bodyElement) {
            console.error('Blog title or body element not found');
            return;
        }

        const title = titleElement.textContent.trim();
        const body = bodyElement.textContent.trim();
        
        if (!title) {
            alert('You need a title for your blog post.');
            return;
        }

        await this.postBlog(title, placeholderAuthor, body);
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

    private initializeEditor = () => {
        const publishButton = document.getElementById('publish-button');
        
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

        publishButton?.addEventListener('click', this.publishBlog);
    }

    private deleteBlog = async (blogId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/blog/${blogId}`, { method: 'DELETE' });

            if (!res.ok) {
                throw new Error(`Error code: ${res.status}`);
            }

            window.location.reload();
        } catch (e) {
            alert(`Failed to delete blog: ${e}`);
        }
    }
    
    private confirmDelete = (blogId: string) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            this.deleteBlog(blogId);
        }
    }
}