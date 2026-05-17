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

const initializeEditor = () => {
    const publishButton = document.getElementById('publish-button');

    publishButton.addEventListener('click', publishBlog);
}

document.addEventListener('DOMContentLoaded', initializeEditor);