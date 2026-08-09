export class Product {
    id: number;
    title: string;
    description: string;
    hook: string;
    release_date: string;
    splash_art_link: string;
    library_doll_link: string;
    icon_link: string
    txn_link: string;

    constructor(p: Product) {
        this.id = p.id;
        this.title = p.title;
        this.description = p.description;
        this.hook = p.hook;
        this.release_date = p.release_date;
        this.splash_art_link = p.splash_art_link;
        this.library_doll_link = p.library_doll_link;
        this.icon_link = p.icon_link;
        this.txn_link = p.txn_link;
    }
}