import { showBlog } from "./blog-viewer";
import { buildComponents } from "./components";

document.addEventListener('DOMContentLoaded', async () => {
    await buildComponents();
    await showBlog();
});