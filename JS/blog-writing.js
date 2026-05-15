class BlogPost {
    /** 
     * @param {string} title
     * @param {string} author
     * @param {string} bodyText
    */
    constructor(title, author, bodyText) {
        this.title = title;
        this.author = author;
        this.bodyText = bodyText;
    }
}

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
 * Creates a blog post record for the database using admin-specific credentials.
 * @param {string} title 
 * @param {string} bodyText 
 */
const postAdminBlog = async (title, bodyText) => {
    const newBlog = new BlogPost(title, 'Lemonfaace', bodyText);

    try {
        const res = await fetch(`${API_URL}/api/blog`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newBlog)
        });

        if (!res.ok) throw new Error("Failed to create blog post");

        const blogResult = await res.json();
        alert("Added: " + blogResult.title);
    } catch (e) {
        console.error("Failed to add:", e);
    }
};

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
 * @returns {HTMLElement} display
 */
const generateBlogHTML = blog => {
    if (!blog) return document.createElement('div');

    const display = document.createElement('div');
    display.className = 'blog-post';

    const title = document.createElement('h2');
    title.textContent = blog.title;

    const meta = document.createElement('small');
    meta.textContent = `${blog.author} | ${blog.created_at}`;

    const body = document.createElement('p');
    body.textContent = blog.body;

    display.append(title, meta, body);

    return display;
}

/**
 * Appends the target blog entry given the provided id.
 * @param {HTMLElement} parent 
 * @param {number} id 
 */
const showBlog = async (parent, id) => {
    if (!parent) {
        console.error("No valid parent to display blogs in");
        return;
    }

    const blog = await getBlog(id);
    
    parent.appendChild(generateBlogHTML(blog));
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

    blogs.forEach(b => parent.appendChild(generateBlogHTML(b)));
}