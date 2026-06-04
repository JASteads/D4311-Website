export class Components {
    constructor() {
        this.initComponents();
    }

    /**
     */
    private createLogo = () : HTMLElement => {
        const logo = document.createElement('img');
        
        logo.className = 'logo';
        logo.src = 'Resources/Images/LoL.png';
        logo.alt = "A Lemon head";
        
        return logo;
    }

    /**
     */
    private createHeader = () : HTMLElement => {
        const header = document.createElement('header');
        const title = document.createElement('h1');
        
        title.textContent = 'District 4';
        
        header.className = 'main-header';
        header.append(this.createLogo(), title);

        return header;
    }

    /**
     */
    private createFooter = () : HTMLElement => {
        const footer = document.createElement('footer');
        const indexLink = document.createElement('a');
        const motto = document.createElement('p');

        indexLink.href = 'index.html';
        indexLink.className = 'footer-logo';
        indexLink.appendChild(this.createLogo());

        motto.innerText = 'The Intermission is Real';

        footer.className = 'main-footer';
        footer.append(indexLink, motto);

        return footer;
    }

    /**
     * Creates common page elements for the document body.
     */
    private initComponents = () => {
        const body = document.body;

        body.insertBefore(this.createHeader(), body.firstChild);
        body.appendChild(this.createFooter());
    }
}