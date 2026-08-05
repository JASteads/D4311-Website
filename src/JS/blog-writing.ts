import { buildComponents } from './components';
import { BlogEditor } from './blog-editor';

document.addEventListener('DOMContentLoaded', () => {
    buildComponents();
    new BlogEditor();
});