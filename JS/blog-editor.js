const editorBody = document.getElementById('editor-body');
const editorContent = document.getElementById('editor-content');
const editorPlaceholder = document.getElementById('editor-placeholder');

/**
 * Gives the target button the ability to augment text
 * @param {string} type 
 * @param {HTMLElement} button 
 */
const assignLabel = (type, button) => {
    if (!button) return;

    const activateLabelButton = () => {
        const selection = window.getSelection();

        // Make sure only the text editor is being modified
        if (!editorBody.contains(selection.anchorNode)) return;

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

        updatePlaceholder(); // Update placeholder text in case it's empty
    }

    button.addEventListener('click', () => activateLabelButton(type));
}

/**
 * Creates a blog post record for the database.
 * @param {string} title 
 * @param {string} bodyText 
 */
const postBlog = async (title, author, bodyText) => {
    const newBlog = { title, author, bodyText };
 
    try {
        const res = await fetch(`${API_URL}/api/blog`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newBlog)
        });

        if (!res.ok) throw new Error("Failed to create blog post");

        const blogResult = await res.json();
        alert("Added: " + blogResult.title);
    } catch (e) {
        console.error("Failed to add:", e);
    }
};

const publishBlog = async () => {
    const placeholderAuthor = 'Lemon'; // Replace later with local storage
    const title = document.getElementById('blog-title').value.trim();
    const bodyText = document.getElementById('blog-body').value.trim();

    if (title) await postBlog(title, placeholderAuthor, bodyText);
    else alert('Title must be defined.');
}

const updatePlaceholder = () => {
    const isEmpty = editorContent.innerText.trim() === '';
    console.log(isEmpty);

    editorPlaceholder.style.display = isEmpty ? 'inline' : 'none';
}

/**
 * 
 * @param {ClipboardEvent} e 
 */
const fixPaste = e => {
    e.preventDefault(); // Don't paste yet

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    if (!editorContent.contains(range.commonAncestorContainer)) return;

    const plainText = e.clipboardData.getData('text/plain');
    const textNode = document.createTextNode(plainText);

    range.deleteContents();
    range.insertNode(textNode);
    range.setStart(textNode, textNode.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    updatePlaceholder();
}

const initializeEditor = () => {
    const publishButton = document.getElementById('publish-button');
    
    editorBody.addEventListener('click', () => editorContent.focus());

    editorBody.addEventListener('input', updatePlaceholder);
    editorBody.addEventListener('keyup', updatePlaceholder);
    editorBody.addEventListener('focus', updatePlaceholder);
    editorBody.addEventListener('blur', updatePlaceholder);
    editorBody.addEventListener('paste', e => fixPaste(e));

    updatePlaceholder();

    // Initialize formatting tools
    assignLabel('b', document.getElementById('bold-button'));
    assignLabel('i', document.getElementById('em-button'));
    assignLabel('u', document.getElementById('u-button'));
    assignLabel('url', document.getElementById('url-button'));
    assignLabel('img', document.getElementById('image-button'));
    assignLabel('size', document.getElementById('size-button'));

    publishButton.addEventListener('click', publishBlog);
}

document.addEventListener('DOMContentLoaded', initializeEditor);