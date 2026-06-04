import { BlogViewer } from "./blog-viewer";
import { Components } from "./components";

const viewer = new BlogViewer();

document.addEventListener('DOMContentLoaded', () => {
    viewer.showBlog();
    new Components();
});