import { buildComponents } from "./components";
import { Blog, formatBlogDate } from "./blog-viewer";
import { API_URL } from "./config";
import { safeLink } from "./site-nav";

const fillBlogHistory = async () => {
    const container = document.getElementById('blog-history-container');

    if (!container) {
        console.error('No blog-history-container found');
        return;
    }

    try {
        const result = await fetch(`${API_URL}/api/blogs`);

        if (!result.ok) {
            throw new Error(`Failed to fetch blogs.`);
        }

        const blogs: Blog[] = await result.json();
        const listItems = await Promise.all(blogs.map(b => generateListItem(b)));
        container.append(...listItems);
    } catch (e) {
        console.log(e);
    }
};

const generateListItem = async (b: Blog) => {
    const img = document.createElement('img');
    img.className = 'cover';
    img.src = b.cover_link || '';
    img.alt = b.title;

    // Category slot (using author since the API doesn't ship a category field)
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

    const listItem = document.createElement('li');
    listItem.append(img, meta, title, preview);

    // Click-through to a viewer page (same spirit as the product list)
    const hyperlink = await safeLink(`blog_viewer.html?id=${b.id}`);
    listItem.addEventListener('click', () => {
        window.location.href = hyperlink;
    });
    listItem.style.cursor = 'pointer';

    return listItem;
};

document.addEventListener('DOMContentLoaded', () => {
    buildComponents();
    fillBlogHistory();
});