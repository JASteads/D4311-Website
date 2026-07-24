export class Product {
    id: number;
    title: string;
    description: string;
    release_date: string;
    splash_art_link: string;
    txn_link: string;

    constructor(id: number, title: string, description: string, 
        release_date: string, splash_art_link: string, txn_link: string) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.release_date = release_date;
        this.splash_art_link = splash_art_link;
        this.txn_link = txn_link;
    }
}