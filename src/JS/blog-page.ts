import { BlogViewer } from "./blog-viewer";
import { buildComponents } from "./components";

const viewer = new BlogViewer();

document.addEventListener('DOMContentLoaded', () => {
    viewer.showBlog();
    buildComponents();
});