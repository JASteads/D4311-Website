class NavItem {
    name: string;
    link: string;

    constructor(name: string, link: string) {
        this.name = name;
        this.link = link;
    }
}

export class Components {
    constructor() {
        const body = document.body;

        body.insertBefore(this.createHeader(), body.firstChild);
        body.insertBefore(this.createNavigation(), body.firstChild);
        body.appendChild(this.createFooter());
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
            ] as NavItem[],
            right: [
                { name: 'Upload',     link: 'upload' }
            ] as NavItem[]
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
        const container = document.createElement('div');
        container.className = 'main-nav-button-container';
        
        container.append(...nodes);
        return container;
    }

    private createNavigation = (): HTMLElement => {
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
        sectionLeft.append(websiteTitle);
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

        // TODO: Move to server-side injection when preparing for launch
        const createAdminDropdown = () => {
            const adminPanelButton = document.createElement('button');
            adminPanelButton.textContent = 'Admin Panel';
            adminPanelButton.addEventListener('click', () => {});

            const adminViewButton = document.createElement('button');
            adminViewButton.textContent = 'Admin View';
            adminViewButton.addEventListener('click', () => {});

            return this.createDropdown([ adminPanelButton, adminViewButton ]);
        }

        const rightGroups = { 
            accountNodes: [
                this.createNavButton({ name: 'Lemonfaace', link: '#' }),
                createAccountDropdown()
            ],
            adminNodes: [
                this.createNavButton({ name: 'Admin', link: '#' }),
                createAdminDropdown()
            ]
        };
        const rightContainers = [
            this.createButtonContainer(rightGroups.accountNodes),
            this.createButtonContainer(rightGroups.adminNodes)
        ]

        sectionRight.append(...rightContainers);

        // Finally, create the nav bar
        const navigation = document.createElement('div');
        navigation.className = 'navigation';
        navigation.append(sectionLeft, sectionMid, sectionRight);

        return navigation;
    }
}