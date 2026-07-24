export class GalleryItem {
    title: string;
    category: string;
    caption: string;
    thumbnail_link: string;
    image_link: string;
    date_created: string;   

    constructor(title: string, category: string, caption: string, 
        thumbnail_link: string, image_link: string, date_created: Date) {
        this.title = title;
        this.category = category;
        this.caption = caption;
        this.thumbnail_link = thumbnail_link;
        this.image_link = image_link;
        this.date_created = date_created.toISOString();
    }
}