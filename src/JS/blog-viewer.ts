import { API_URL } from './config';

export interface Blog {
    id: number;
    title: string;
    author: string;
    body: string;
    created_at: string;
    hook: string;
}

/**
 * Populates the blog viewer with the target blog via ID.
 */
export const showBlog = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        console.error('No ID was provided in the URL');
        return;
    }

    try {
        const paramsID = parseInt(id);

        // Try grabbing from cache
        const cached = localStorage.getItem('currentBlog');
        if (cached) {
            console.log('Found blog in cache.');
            const blog: Blog = JSON.parse(cached);

            if (`${blog.id}` as unknown === paramsID) {
                console.log('Cached blog is the one we\'re looking for');
                generateBlogFull(blog);
                return;
            }
        }

        const blog = await getBlog(paramsID) as Blog;
        if (!blog || !blog.id) {
            throw new Error('Blog does not exist.');
        }

        generateBlogFull(blog);
    } catch (e) {
        window.location.href = 'load_fail.html';
    }
}

/**
 * Appends a list of blog HTMLElements to the parent element.
 */
export const showRecentBlogs = async (parent: HTMLElement | null, amount?: number) => {
    if (!parent) {
        console.error("No valid parent to display blogs in");
        return;
    }

    const blogs: Blog[] = await getRecentBlogs(amount);

    blogs.forEach(async b => parent.appendChild(await generateBlogPreview(b)));
}

/**
 * Parses a body of text into all identifiable labels and returns them as a string of text.
 */

const parseLabels = (text: string) => {
    if (!text || text === '') return '';

    let result = '';
    let i = 0;
    
    /**
     * Process
     * 1. Read as normal until finding a valid label
     * 2. Upon finding a valid label, append previous text to result
     * 3. Recursively call parse function with the label type as the end condition.
     *    Pass index position
     * 4. In recursive function, repeat process until finding a close label. 
     *    Pass updated index position while traversing string
     * 5. Upon finding close label, use label type to generate 
     *    the correct innerHTML and return it to upper level
     * 6. Upon exiting recursive loop, continue at final updated index position
     *    until next valid label or end of text
     * 7. At end of text, append remaining text to result and return it
     */
    const parseLabelInfo = (start: number, end: number) => {
        const label = text.substring(start + 1, end);
        const equalIndex = label.indexOf('=');

        /**
         * ------------ EXAMPLES ------------
         * a. [b]Text[/b]
         * b. [url="localhost.3000/?id=7"]Link[/url]
         * c. [size=20][/size]
         */
        
        let type: string, info = '';

        if (equalIndex === -1) {
            type = label;
        }
        else {
            type = label.substring(0, equalIndex);
            info = label.substring(equalIndex + 1);

            if (info.startsWith('"') && info.endsWith('"')) {
                info = info.slice(1, -1); // Remove quotation marks
            }
        }

        if (!type || type.includes('?') || type.includes('[')) {
            console.warn("Label type is invalid:", label);
            return { type: null, info: '' };
        }

        return {type, info};
    }
    
    const parseLabel = (type: string | null, info: string) => {
        if (!type) return '';
        
        let content = '';

        // Assume cursor is correctly placed after the label start
        while (i < text.length) {
            if (text[i] === '[') {
                if (text.startsWith(`/${type}]`, i + 1)) {
                    // Escape label found
                    i += 3 + type.length; // '[/]' + `${type}`
                    return LabelToinnerHTML(type, info, content); // Handles intended behavior for each type
                }
                else if (text[i + 1] !== '/') {
                    // Found another potential label
                    const labelEnd = text.indexOf(']', i);
                    if (labelEnd !== -1) {
                        const { type: innerType, info: innerInfo } = parseLabelInfo(i, labelEnd);

                        i = labelEnd + 1;
                        content += parseLabel(innerType, innerInfo);
                        continue;
                    }
                }
            }

            content += text[i++];
        }

        return `[${type}]${content}`;
    }

    while (i < text.length) {
        if (text[i] === '[' && text[i + 1] !== '/') {
            const labelEnd = text.indexOf(']', i);
            
            if (labelEnd === -1) {
                console.warn('Label start found, but no label end to complete it');
                break;
            }

            const {type, info} = parseLabelInfo(i, labelEnd);
            i = labelEnd + 1;

            result += parseLabel(type, info);
        }
        else result += text[i++];
    }

    return result;
}

/**
 * Uses a label type and info to handle the HTML formatting for a body of text.
 * If the label type is invalid, the label and its content is returned in plain text.
 */
const LabelToinnerHTML = (type: string, info: string, content: string): string => {
    const defaultSize = 1.6; // Measured in em

    const handlers: {[key: string]: (content: string, info: string) => string} = {
        b: (content: string) => `<strong>${content}</strong>`,
        i: (content: string) => `<em>${content}</em>`,
        u: (content: string) => `<u>${content}</u>`,

        url: (content: string, info: string) => {
            const href = info || '#';

            return `<a href="${escapeHTML(href)}" target="_blank">${content}</a>`;
        },

        img: (content: string, info: string) => {
            const source = info || '';
            const alt = content || '';

            return `<img src="${escapeHTML(source)}" alt="${escapeHTML(alt)}">`;
        },

        size: (content: string, info: string) => {
            const size = parseInt(info) || defaultSize;

            return `<span style="font-size: ${size}em;">${content}</span>`;
        }
    }

    const handler = handlers[type];
    if (handler) return handler(content, info);

    console.warn("Invalid label type provided:", type);
    return `[${type}${(info ? `=${info}` : '')}]${content}[/${type}]`;
}

/**
 * Alters characters into HTML-safe strings that are commonly read as normal characters
 */
const escapeHTML = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Generates a string-formatted date from a valid timestamp.
 */
export const formatBlogDate = (timestamp: string) => {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "Invalid date";

    const day = date.getDate();
    const suffix = getDaySuffix(day);
    const month = date.toLocaleDateString('en-US', { month: 'long' });

    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

/**
 * Returns the proper suffix of a given date.
 */
const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';

    switch(day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Returns the blog post from the database containing the given id, if possible.
 */
const getBlog = async (id: number) => {
    try {
        const res = await fetch(`${API_URL}/api/blog/${id}`);

        if (!res.ok) {
            if (res.status === 404) console.warn(`Blog ${id} was not found.`);
            throw new Error("Failed to fetch blog");
        }

        return await res.json() as Blog[];
    }
    catch (e) {
        console.error("Something went wrong:", e);
        return { id: -1, title: '', author: '', created_at: '', body: '', hook: '' } as Blog;
    }
}

/**
 * Returns n blog entries from the main database (n === 0 for all blogs).
 */
const getRecentBlogs = async (n: number | null = null) => {
    try {
        const url = n && n > 0 
            ? `${API_URL}/api/blogs?limit=${n}` 
            : `${API_URL}/api/blogs`;

        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to get blogs");

        return await res.json();
    }
    catch (e) {
        console.error("Something went wrong:", e);
        return [];
    }
};

/**
 * Takes a blog and presents it in the desired format.
 */
const generateBlogPreview = async (blog: Blog) => {

    if (!blog) return document.createElement('li');

    const title = document.createElement('h3');
    title.textContent = blog.title;

    const link = document.createElement('a');
    link.href = `blog_viewer.html?id=${blog.id}`;
    link.appendChild(title);

    const meta = document.createElement('small');
    meta.className = 'date';
    meta.textContent = `${blog.author} | ${formatBlogDate(blog.created_at)}`;  

    const body = document.createElement('p');
    body.innerHTML = parseLabels(blog.body);
    
    const preview = document.createElement('li');
    preview.className = 'blog-preview';
    preview.append(link, body, meta);

    return preview;
}

/**
 * Takes a blog and presents it in the desired format.
 */
const generateBlogFull = (blog: Blog) => {
    if (!blog) {
        alert('Failed to load blog.');
        return;
    }

    const title = document.getElementById('blog-title');
    const meta = document.getElementById('blog-meta');
    const body = document.getElementById('blog-body');
    
    if (title != null && meta != null && body != null) {
        title.textContent = blog.title;
        meta.textContent = `${blog.author} | ${formatBlogDate(blog.created_at)}`;    
        body.innerHTML = parseLabels(blog.body);
    }
    
    localStorage.setItem('currentBlog', JSON.stringify(blog));

    document.title = `District 4 - ${blog.title}`;
}