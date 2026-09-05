import { buildComponents } from "./components";
import { API_URL } from "./config";
import { formatBlogDate } from "./blog-viewer";
import { buildScripts, DataRequest } from "./page-builder";

const requests = {
    product: ['title', 'release_date', 'description'],
    recentNews: ['title', 'created_at']
}

const bodyTemplate = {
    'product-body': { children: [
        { id: 'title', textContent: requests.product[0], requires: 'product' },
        { id: 'date', textContent: requests.product[1], requires: 'product' },
        { id: 'content', children: [
            { id: 'introduction', children: [
            { tag: 'p', textContent: requests.product[2], requires: 'product' },
            { tag: 'div', classList: 'trailer' }
        ]}
    ]}],
    'news': { function: 'list', requires: 'recentNews', args: [
        { tag: 'a', textContent: requests.recentNews[0], requires: 'recentNews', href: '#' },
        { 
            tag: 'small', textContent: requests.recentNews[1], requires: 'recentNews', 
            type: 'date', dateFormat: 'GR-U'
        }
    ]}}, 
    'links': { children: [
        { id: 'steam-link', href: '' }, 
        { id: 'paypal-link', href: '' }, 
        { id: 'other-link', href: '' } 
    ]}
};

document.addEventListener('DOMContentLoaded', async () => {
    buildComponents();
    const productID = new URLSearchParams(window.location.search).get('id');
    const newsLimit = 8;

    await buildScripts(bodyTemplate,
        new DataRequest('product', `${API_URL}/api/product/${productID}`),
        new DataRequest('recentNews', `${API_URL}/api/blogs?game_id=${productID}&limit=${newsLimit}`)
    );

    const date = document.getElementById('date');
    if (date) {
        date.textContent = formatBlogDate(date.textContent);
    }
});