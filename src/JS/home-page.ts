import { showRecentBlogs } from './blog-viewer';
import { buildComponents } from './components';

document.addEventListener('DOMContentLoaded', async () => {
    const fabu = document.getElementById('fabu');
    if (fabu) {
        fabu.addEventListener('mouseenter', () => fabu.classList.add('bounce'));
        fabu.addEventListener('animationend', () => fabu.classList.remove('bounce'));
    }

    await buildComponents();
    await showRecentBlogs(document.getElementById('news-feed'));
});