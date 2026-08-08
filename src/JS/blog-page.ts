import { showBlog } from "./blog-viewer";
import { buildComponents } from "./components";

document.addEventListener('DOMContentLoaded', () => {
    showBlog();
    buildComponents();
});