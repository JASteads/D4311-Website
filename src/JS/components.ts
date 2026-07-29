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
        const logo = this.createLogo('footer-logo');

        motto.innerText = 'The Intermission is Real';

        footer.className = 'main-footer';
        footer.append(logo, motto);

        return footer;
    }

    // Create on-demand, stored references aren't needed
    private getNavSections = () => {
        return {
            middle: [
                { name: 'Blogs',   link: 'blog_viewer'},
                { name: 'Library', link: 'library'},
                { name: 'Gallery', link: 'gallery' },
                { name: 'Portfolio', link: 'portfolio'}
            ] as NavItem[],
            right: [
                { name: 'Upload',     link: 'upload' },
                { name: 'Lemonfaace', link: '#' }
            ] as NavItem[]
        };
    }

    private createNavigation = (): HTMLElement => {
        const generateNavButtons = (items: NavItem[]): HTMLAnchorElement[] => {
            return items.map(i => {
                const button = document.createElement('a');
                button.className = 'navigation-button';
                button.textContent = i.name;
                button.href = `/${i.link}.html`;

                return button;
            });
        };

        const navigation = document.createElement('div');
        navigation.className = 'navigation';

        const { middle, right } = this.getNavSections();
        
        const sectionLeft = document.createElement('section');
        const sectionMid = document.createElement('section');
        const sectionRight = document.createElement('section');

        const websiteTitle = document.createElement('a');
        websiteTitle.className = 'website-title'
        websiteTitle.textContent = 'District 4';
        websiteTitle.href = '../index.html';

        sectionLeft.append(websiteTitle);
        sectionMid.append(...generateNavButtons(middle));
        sectionRight.append(...generateNavButtons(right));

        navigation.append(sectionLeft, sectionMid, sectionRight);

        return navigation;
    }
}