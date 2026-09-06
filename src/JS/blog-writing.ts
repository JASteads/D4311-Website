import { buildComponents } from './components';
import { BlogEditor } from './blog-editor';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await buildComponents();
    
    new BlogEditor(user);
});