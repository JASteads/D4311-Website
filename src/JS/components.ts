import { Account } from "./account-manager.ts";
import { API_URL } from "./config";

class NavItem {
    name: string;
    link: string;

    constructor(name?: string, link?: string) {
        this.name = name || '';
        this.link = link || '';
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

    const { username, alias, email, type } = await (await fetch(`${API_URL}/api/me`, { credentials: 'include' })).json();
    const user = new Account(username, alias, email, type);

    body.insertBefore(createHeader(), body.firstChild);
    body.insertBefore(await createNavigation(user), body.firstChild);
    body.appendChild(createFooter());

    return user;
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

const createDropdown = (...childNodes: HTMLElement[]) => {
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    dropdown.append(...childNodes);
    return dropdown;
}

// Create on-demand, stored references aren't needed
const getNavSections = () => {
    return {
        middle: [
            { name: 'News',   link: 'news'},
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
    const nodes: HTMLElement[] = [];

    try {
        const dropDownHTML = await (await fetch(`${API_URL}/api/get_admin_nav`, { credentials: 'include' })).text();

        if (dropDownHTML) {
            document.body.insertAdjacentHTML('beforeend', dropDownHTML);

            const prepareAdminButton = async (id: string, url: string) => {
                const button = document.getElementById(id);

                button?.addEventListener('click', () => window.location.href = url);

                return button;
            }

            const adminNodes = await Promise.all([
                prepareAdminButton('admin-panel-button', './admin_panel.html'),
                prepareAdminButton('admin-portal-button', './upload.html')
            ]);

            nodes.push(
                createNavButton({ name: 'Admin', link: '#' }), 
                createDropdown(...adminNodes.filter(b => !(!b)))
            );
        }
    } catch (e) {
        console.error('No good:', e);
    }

    return nodes;
}

const createNavigation = async (user: Account) => {
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
    sectionLeft.append(websiteTitle);
    sectionMid.append(...generateNavButtons(middle));
    sectionRight.append(...generateNavButtons(right));

    /* ================= MANUAL NODE GROUP HANDLING ================= */

    const createAccountDropdown = () => {
        const username = document.createElement('span');
        const icon = document.createElement('img');

        const accountInfo = document.createElement('div');
        accountInfo.append(username, icon);

        const accountSettings = document.createElement('span');
        const logout = document.createElement('span');

        return createDropdown(accountInfo, accountSettings, logout);
    }

    const { name, link } = user.isEmpty() ? { name: 'Log In', link: 'login' } : { name: user.alias, link: '#' };
    const accountNodes: HTMLElement[] = [createNavButton(new NavItem(name, link))];
    if (!user.isEmpty()) {
        accountNodes.push(createAccountDropdown());
    }
    
    const rightGroups = {
        accountNodes: accountNodes,
        adminNodes: [ ...(await tryAdminNodes()) ]
    };
    const rightContainers = [ createButtonContainer(rightGroups.accountNodes) ];

    if (rightGroups.adminNodes.length > 0) {
        const adminContainer = createButtonContainer(rightGroups.adminNodes);
        if (adminContainer) {
            rightContainers.push(adminContainer);
        }
    }

    sectionRight.append(...rightContainers.filter(n => !(!n)));

    // Finally, create the nav bar
    const navigation = document.createElement('div');
    navigation.className = 'navigation';
    navigation.append(sectionLeft, sectionMid, sectionRight);

    return navigation;
}