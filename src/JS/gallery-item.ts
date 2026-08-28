export class GalleryItem {
    id: number;
    title: string;
    category: string;
    caption: string;
    date_created: string;   

    constructor(id: number, title: string, category: string, caption: string, date_created: Date) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.caption = caption;
        this.date_created = date_created.toISOString();
    }
}