import { API_URL, DEV_URL } from "./config";

class NavItem {
    name: string;
    link: string;

    constructor(name: string, link: string) {
        this.name = name;
        this.link = link;
    }
}

export class Components {
    adminTest: boolean;
    
    constructor() {
        // Admin view test -- Remove later
        this.adminTest = window.localStorage.getItem('admin-test') === 'true';
        if (this.adminTest === null) {
            console.warn('nope');
            this.adminTest = true;
            window.localStorage.setItem('admin-test', `${this.adminTest}`);
        }

        this.buildComponents();
    }

    private createLogo = (className: string): HTMLAnchorElement => {
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

    private createHeader = (): HTMLElement => {
        const header = document.createElement('header');
        const title = document.createElement('h1');
        
        title.textContent = 'District 4';
        
        header.className = 'main-header';
        header.append(this.createLogo('header-logo'), title);

        return header;
    }

    private createFooter = (): HTMLElement => {
        const footer = document.createElement('footer');
        const motto = document.createElement('p');
        const siteName = document.createElement('small');
        const logo = this.createLogo('footer-logo');

        siteName.innerText = 'District 4';
        motto.innerText = 'The Intermission is Real';

        footer.className = 'main-footer';
        footer.append(motto, logo, siteName);

        return footer;
    }

    private createDropdown = (childNodes: Node[]) => {
        if (childNodes.length === 0) {

        }
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';

        dropdown.append(...childNodes);
        return dropdown;
    }

    // Create on-demand, stored references aren't needed
    private getNavSections = () => {
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

    private createNavButton = (item: NavItem) => {
        const button = document.createElement('a');
        button.className = 'navigation-button';
        button.textContent = item.name;
        button.href = `/${item.link}.html`;

        return button;
    }

    private createButtonContainer = (nodes: Node[]) => {
        if (nodes.length === 0) {
            return null;
        }

        const container = document.createElement('div');
        container.className = 'main-nav-button-container';
        
        container.append(...nodes);
        return container;
    }

    private toggleAdminTest = () => {
        const tryAdminLoad = async (url: string) => {
            const res = await this.tryAdminRequest(url);
            const redirect = JSON.parse(res);

            if (redirect) {
                window.location.href = redirect.redirectTo;
            } else {
                console.error('Load failed');
            }
        }

        this.adminTest = !this.adminTest;
        localStorage.setItem('admin-test', `${this.adminTest}`)

        if (window.location.href === `${DEV_URL}/admin_panel.html`) {
            tryAdminLoad(`${API_URL}/api/admin_panel`);
        } else {
            location.reload();
        }
    }

    private tryAdminRequest = async (url: string) => {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ session: window.localStorage.getItem('admin-test') }),
            headers: { 'Content-Type': 'application/json' }
        });

        return res.text();
    }

    private tryAdminNodes = async () => {
        console.log('Getting admin nodes...');
        const result: Node[] = [];

        try {
            const dropDownHTML = await this.tryAdminRequest(`${API_URL}/api/get_admin_nav`);

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

                result.push(this.createNavButton({ name: 'Admin', link: '#' }));
                result.push(this.createDropdown(adminNodes));
            } else {
                console.warn('No admin nodes');
            }
        } catch (e) {
            console.error('No good:', e);
        }

        return result;
    }

    private buildComponents = async () => {
        const body = document.body;
        body.insertBefore(this.createHeader(), body.firstChild);
        body.insertBefore(await this.createNavigation(), body.firstChild);
        body.appendChild(this.createFooter());
    }
    
    private createNavigation = async () => {
        const createDevToggle = () => {
            const devToggleButton = document.createElement('button');
            devToggleButton.textContent = `${this.adminTest ? 'Guest' : 'Admin'} View`;
            devToggleButton.style = `
                position: absolute;
                padding: 5px 20px;
                border: #0a0 solid 2px;
                border-radius: 2px;
                color: rgb(214, 255, 214);
                background-color: rgba(0, 100, 0, 0.3);
                font-size: 1.2em;
                font-family: 'Courier', system-ui;
                top: 160%;
                left: 30px;
                cursor: pointer;
            `;
            devToggleButton.addEventListener('click', () => this.toggleAdminTest());

            devToggleButton.addEventListener('mouseenter', () => {
                devToggleButton.style.backgroundColor = 'rgba(104, 231, 125, 0.3)';
            });
            
            devToggleButton.addEventListener('mouseleave', () => {
                devToggleButton.style.backgroundColor = 'rgba(0, 100, 0, 0.3)';
            });

            return devToggleButton;
        }

        const websiteTitle = document.createElement('a');
        websiteTitle.className = 'website-title'
        websiteTitle.textContent = 'District 4';
        websiteTitle.href = '../index.html';

        // Prepare sections
        const generateNavButtons = (items: NavItem[]) => items.map(i => this.createNavButton(i));
        const sectionLeft = document.createElement('section');
        const sectionMid = document.createElement('section');
        const sectionRight = document.createElement('section');
        const { middle, right } = this.getNavSections();

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

            return this.createDropdown([accountInfo, accountSettings, logout]);
        }


        const rightGroups = { 
            accountNodes: [
                this.createNavButton({ name: 'Log In', link: 'login' }),
                createAccountDropdown()
            ],
            adminNodes: [ ...(await this.tryAdminNodes()) ]
        };
        const rightContainers: Node[] = [ this.createButtonContainer(rightGroups.accountNodes)! ];

        if (rightGroups.adminNodes.length > 0) {
            const adminContainer = (this.createButtonContainer(rightGroups.adminNodes));
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
}