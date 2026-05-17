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

    body.textContent = blog.body;
    
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
    body.textContent = blog.body; // Will replace with a more robust process later
    
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