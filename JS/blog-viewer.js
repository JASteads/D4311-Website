/**
 * Parses a body of text into all identifiable labels and returns them as a string of text.
 * @param {string} text 
 * @returns {string}
 */
const parseLabels = text => {
    if (!text || text === '') return '';

    let result = '';
    let i = 0;
    
    /**
     * Process
     * 
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


    const parseLabelInfo = (start, end) => {
        const label = text.substring(start + 1, end);
        const equalIndex = label.indexOf('=');

        /**
         * ------------ EXAMPLES ------------
         * a. [b]Text[/b]
         * b. [url="localhost.3000/?id=7"]Link[/url]
         * c. [size=20][/size]
         */
        
        let type, info = '';

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
    
    const parseLabel = (type, info) => {
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
 * @param {string} type 
 * @param {string} info 
 * @param {string} content 
 * @returns {string}
 */
const LabelToinnerHTML = (type, info, content) => {
    const defaultSize = 1.6; // Measured in em

    const handlers = {
        'b': (info, content) => `<strong>${content}</strong>`,
        'i': (info, content) => `<em>${content}</em>`,
        'u': (info, content) => `<u>${content}</u>`,

        'url': (info, content) => {
            const href = info || '#';

            return `<a href="${escapeHTML(href)}" target="_blank">${content}</a>`;
        },

        'img': (info, content) => {
            const source = info || '';
            const alt = content || '';

            return `<img src="${escapeHTML(source)}" alt="${escapeHTML(alt)}">`;
        },

        'size': (info, content) => {
            const size = parseInt(info) || defaultSize;

            return `<span style="font-size: ${size}em;">${content}</span>`;
        }
    }

    const handler = handlers[type];
    if (handler) return handler(info, content);

    console.warn("Invalid label type provided:", type);
    return `[${type}${(info ? `=${info}` : '')}]${content}[/${type}]`;
}

/**
 * Alters characters into HTML-safe strings that are commonly read as normal characters
 * @param {string} unsafe 
 * @returns {string}
 */
const escapeHTML = unsafe => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Generates a string-formatted date from a valid timestamp.
 * @param {string} timestamp 
 * @returns {string}
 */
const formatBlogDate = timestamp => {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "Invalid date";

    const day = date.getDate();
    const suffix = getDaySuffix(day);
    const month = date.toLocaleDateString('en-US', { month: 'long' });

    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

/**
 * Returns the proper suffix of a given date.
 * @param {number} day 
 * @returns {string}
 */
const getDaySuffix = day => {
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
 * @param {number} id 
 * @returns {Object}
 */
const getBlog = async id => {
    try {
        const res = await fetch(`${API_URL}/api/blogs/${id}`);

        if (!res.ok) {
            if (res.status === 404) console.warn(`Blog ${id} was not found.`);
            throw new Error("Failed to fetch blog");
        }

        return await res.json();
    }
    catch (e) {
        console.error("Something went wrong:", e);
        return {};
    }
}

/**
 * Returns n blog entries from the main database (n === 0 for all blogs).
 * @param {number|null} n
 * @returns {Array}
 */
const getRecentBlogs = async (n = null) => {
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
 * @param {Object} blog
 * @param {string} blog.title
 * @param {string} blog.author
 * @param {string} blog.body
 * @param {string} blog.created_at
 * @returns {HTMLElement} preview
 */
const generateBlogPreview = blog => {

    if (!blog) return document.createElement('li');

    const preview = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('h3');
    const meta = document.createElement('small');
    const body = document.createElement('p');

    title.textContent = blog.title;

    link.href = `blog_viewer.html?id=${blog.id}`;
    link.appendChild(title);

    meta.className = 'date';
    meta.textContent = `${blog.author} | ${formatBlogDate(blog.created_at)}`;  

    body.innerHTML = parseLabels(blog.body);
    
    preview.className = 'blog-preview';
    preview.append(link, body, meta);

    return preview;
}

/**
 * Takes a blog and presents it in the desired format.
 * @param {Object} blog
 * @param {string} blog.title
 * @param {string} blog.author
 * @param {string} blog.body
 * @param {string} blog.created_at
 */
const generateBlogFull = blog => {
    if (!blog) {
        alert('Failed to load blog.');
        return;
    }

    const title = document.getElementById('blog-title');
    const meta = document.getElementById('blog-meta');
    const body = document.getElementById('blog-body');
    
    title.textContent = blog.title;
    meta.textContent = `${blog.author} | ${formatBlogDate(blog.created_at)}`;    
    body.innerHTML = parseLabels(blog.body);
    
    localStorage.setItem('currentBlog', JSON.stringify(blog));

    document.title = `District 4 - ${blog.title}`;
}

/**
 * Populates the blog viewer with the target blog via ID.
 */
const showBlog = async () => {
    const params = new URLSearchParams(window.location.search);
    let paramsID = params.get('id');

    if (!paramsID) paramsID = 1;

    // Try grabbing from cache
    const cached = localStorage.getItem('currentBlog');
    if (cached) {
        console.log('Found blog in cache.');
        const blog = JSON.parse(cached);

        if (`${blog.id}` === paramsID) {
            console.log('Cached blog is the one we\'re looking for');
            generateBlogFull(blog);
            return;
        }
    }

    generateBlogFull(await getBlog(paramsID));
}

/**
 * Appends a list of blog HTMLElements to the parent element.
 * @param {HTMLElement} parent
 * @param {number|null} amount
 */
const showRecentBlogs = async (parent, amount = null) => {
    if (!parent) {
        console.error("No valid parent to display blogs in");
        return;
    }

    const blogs = await getRecentBlogs(amount);

    blogs.forEach(b => parent.appendChild(generateBlogPreview(b)));
}