import { API_URL } from "./config";
import { requestAdminAccess, tryAdminTest, getSession } from './permissions.ts';

class NavItem {
    name: string;
    link: string;

    constructor(name: string, link: string) {
        this.name = name;
        this.link = link;
    }
}

export const buildComponents = async () => {
    const body = document.body;

    // Create parallax for the background
    const html = document.getElementsByTagName('html')[0];
    const parallaxStrength = 0.9;
    document.addEventListener('scroll', () => {
        html.style.backgroundPositionY = `${(window.scrollY * parallaxStrength).toPrecision()}px`;
    });

    body.insertBefore(createHeader(), body.firstChild);
    body.insertBefore(await createNavigation(), body.firstChild);
    body.appendChild(createFooter());
}

const createLogo = (className: string): HTMLAnchorElement => {
    const logo = document.createElement('img');
    const indexLink = document.createElement('a');
    
    logo.className = 'logo';
    logo.src = 'Resources/Images/LoL.png';
    logo.alt = "A Lemon head";

    indexLink.href = 'index.html';
    indexLink.className = className;
    indexLink.appendChild(logo);
    
    return indexLink;
}

const createHeader = (): HTMLElement => {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    
    title.textContent = 'District 4';
    
    header.className = 'main-header';
    header.append(createLogo('header-logo'), title);

    return header;
}

const createFooter = (): HTMLElement => {
    const footer = document.createElement('footer');
    const motto = document.createElement('p');
    const siteName = document.createElement('small');
    const logo = createLogo('footer-logo');

    siteName.innerText = 'District 4';
    motto.innerText = 'The Intermission is Real';

    footer.className = 'main-footer';
    footer.append(motto, logo, siteName);

    return footer;
}

const createDropdown = (childNodes: Node[]) => {
    if (childNodes.length === 0) {

    }
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    dropdown.append(...childNodes);
    return dropdown;
}

// Create on-demand, stored references aren't needed
const getNavSections = () => {
    return {
        middle: [
            { name: 'News',   link: 'blog_history'},
            { name: 'Library', link: 'library'},
            { name: 'Gallery', link: 'gallery' },
            { name: 'Portfolio', link: 'portfolio'}
        ],
        right: []
    };
}

const createNavButton = (item: NavItem) => {
    const button = document.createElement('a');
    button.className = 'navigation-button';
    button.textContent = item.name;
    button.href = `/${item.link}.html`;

    return button;
}

const createButtonContainer = (nodes: Node[]) => {
    if (nodes.length === 0) {
        return null;
    }

    const container = document.createElement('div');
    container.className = 'main-nav-button-container';
    
    container.append(...nodes);
    return container;
}

const tryAdminNodes = async () => {
    const result: Node[] = [];

    try {
        const dropDownHTML = await requestAdminAccess(`${API_URL}/api/get_admin_nav`);

        if (dropDownHTML) {
            const adminNodes: Node[] = [];
            console.log('Found admin elements!');
            document.body.insertAdjacentHTML('beforeend', dropDownHTML);

            const panelButton = document.getElementById('admin-panel-button');
            const portalButton = document.getElementById('admin-portal-button');

            const linkPrefix = 'http://localhost:5173'; // TODO : Correct this

            if (panelButton) {
                panelButton.addEventListener('click', () => {
                    window.location.href = `${linkPrefix}/admin_panel.html`;
                });
                adminNodes.push(panelButton);
            }

            if (portalButton) {
                portalButton.addEventListener('click', () => {
                    window.location.href = `${linkPrefix}/upload.html`;
                })
                adminNodes.push(portalButton);
            }

            result.push(createNavButton({ name: 'Admin', link: '#' }));
            result.push(createDropdown(adminNodes));
        }
    } catch (e) {
        console.error('No good:', e);
    }

    return result;
}

const createNavigation = async () => {
    const createDevToggle = () => {
        const isAdmin = getSession().session === 'true';
        const devToggleButton = document.createElement('button');
        devToggleButton.className = 'dev-toggle-button';
        devToggleButton.textContent = `${isAdmin ? 'Guest' : 'Admin'} View`;
        devToggleButton.addEventListener('click', () => tryAdminTest());

        return devToggleButton;
    }

    const websiteTitle = document.createElement('a');
    websiteTitle.className = 'website-title'
    websiteTitle.textContent = 'District 4';
    websiteTitle.href = '../index.html';

    // Prepare sections
    const generateNavButtons = (items: NavItem[]) => items.map(i => createNavButton(i));
    const sectionLeft = document.createElement('section');
    const sectionMid = document.createElement('section');
    const sectionRight = document.createElement('section');
    const { middle, right } = getNavSections();

    // Append default buttons
    sectionLeft.append(websiteTitle, createDevToggle());
    sectionMid.append(...generateNavButtons(middle));
    sectionRight.append(...generateNavButtons(right));

    /* ================= MANUAL NODE GROUP HANDLING ================= */

    const createAccountDropdown = () => {
        const accountInfo = document.createElement('div');
        const username = document.createElement('span');
        const icon = document.createElement('img');

        accountInfo.append(username, icon);

        const accountSettings = document.createElement('span');
        const logout = document.createElement('span');

        return createDropdown([accountInfo, accountSettings, logout]);
    }

    const rightGroups = { 
        accountNodes: [
            createNavButton({ name: 'Log In', link: 'login' }),
            createAccountDropdown()
        ],
        adminNodes: [ ...(await tryAdminNodes()) ]
    };
    const rightContainers: Node[] = [ createButtonContainer(rightGroups.accountNodes)! ];

    if (rightGroups.adminNodes.length > 0) {
        const adminContainer = (createButtonContainer(rightGroups.adminNodes));
        if (adminContainer) {
            rightContainers.push(adminContainer);
        }
    }

    sectionRight.append(...rightContainers);

    // Finally, create the nav bar
    const navigation = document.createElement('div');
    navigation.className = 'navigation';
    navigation.append(sectionLeft, sectionMid, sectionRight);

    return navigation;
}