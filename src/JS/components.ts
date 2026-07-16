export class Components {
    constructor() {
        const body = document.body;

        body.insertBefore(this.createHeader(), body.firstChild);
        body.appendChild(this.createFooter());
    }

    private createLogo = (className: string) : HTMLAnchorElement => {
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

    private createHeader = () : HTMLElement => {
        const header = document.createElement('header');
        const title = document.createElement('h1');
        
        title.textContent = 'District 4';
        
        header.className = 'main-header';
        header.append(this.createLogo('header-logo'), title);

        return header;
    }

    private createFooter = () : HTMLElement => {
        const footer = document.createElement('footer');
        const motto = document.createElement('p');
        const logo = this.createLogo('footer-logo');



        motto.innerText = 'The Intermission is Real';

        footer.className = 'main-footer';
        footer.append(logo, motto);

        return footer;
    }
}