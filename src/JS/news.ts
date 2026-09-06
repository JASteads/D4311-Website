import { buildComponents } from "./components";
import { formatBlogDate } from "./blog-viewer";
import { API_URL } from "./config";
import type { Blog } from "./blog-viewer";

const fillBlogHistory = async () => {
    const container = document.getElementById('blog-history-container');

    if (!container) {
        console.error('No blog-history-container found');
        return;
    }

    try {
        const result = await fetch(`${API_URL}/api/blogs`);

        if (!result.ok) { throw new Error(`Failed to fetch blogs.`); }

        const blogs: Blog[] = await result.json();
        container.append(...blogs.map(b => generateListItem(b)));
    } catch (e) {
        console.log(e);
    }
};

const generateListItem = (b: Blog) => {
    const img = document.createElement('img');
    img.className = 'cover';
    img.src = `Resources/Images/Cover/cover_${b.id}.png` || '';
    img.alt = b.title;

    const category = document.createElement('small');
    category.className = 'category';
    category.textContent = b.author || 'News';

    const separator = document.createElement('small');
    separator.textContent = ' | ';

    const date = document.createElement('small');
    date.className = 'date';
    date.textContent = formatBlogDate(b.created_at);

    const meta = document.createElement('span');
    meta.append(category, separator, date);

    const title = document.createElement('h3');
    title.textContent = b.title;

    const preview = document.createElement('p');
    preview.textContent = b.hook;

    const listItem = document.createElement('a');
    listItem.href = `blog_viewer.html?id=${b.id}`;
    listItem.append(img, meta, title, preview);

    return listItem;
};

document.addEventListener('DOMContentLoaded', async () => {
    await buildComponents();
    await fillBlogHistory();
});