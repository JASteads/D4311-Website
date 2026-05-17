const indexURL = './index.html';
const logoURL = './Resources/Images/LoL.png';

/**
 * @returns {HTMLElement}
 */
const createLogo = () => {
    const logo = document.createElement('img');
    
    logo.className = 'logo';
    logo.src = logoURL;
    logo.alt = "A Lemon head";
    
    return logo;
}

/**
 * @returns {HTMLElement}
 */
const createHeader = () => {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    
    title.textContent = 'District 4';
    
    header.className = 'main-header';
    header.append(createLogo(), title);

    return header;
}

/**
 * @returns {HTMLElement}
 */
const createFooter = () => {
    const footer = document.createElement('footer');
    const indexLink = document.createElement('a');
    const motto = document.createElement('p');

    indexLink.href = indexURL;
    indexLink.className = 'footer-logo';
    indexLink.appendChild(createLogo());

    motto.innerText = 'The Intermission is Real';

    footer.className = 'main-footer';
    footer.append(indexLink, motto);

    return footer;
}

/**
 * Creates common page elements for the document body.
 */
const initComponents = () => {
    const body = document.body;

    body.insertBefore(createHeader(), body.firstChild);
    body.appendChild(createFooter());
}