import { BlogViewer } from './blog-viewer';
import { buildComponents } from './components';

const newsFeed = new BlogViewer();

const initBounceImg = (elementID: string) => {
    const img = document.getElementById(elementID);

    if (!img) return;

    let isBouncing = false;

    const bounceImg = () => {
        if (isBouncing) return;

        const bounceStrength = 0.8; // Max scale increase

        isBouncing = true;

        let startTime: number;

        const duration = 500; // measured in ms

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1); // 0 to 1

            // Bounce formula
            const bounce = Math.sin(progress * Math.PI * 5) * Math.pow(1 - progress, 2.5);
            const currentScale = 1 + bounce * bounceStrength;

            img.style.transform = `scale(${currentScale})`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                img.style.transform = 'scale(1)';
                isBouncing = false;
            }
        }

        requestAnimationFrame(animate);
    }

    // Image will now bounce when hovered over
    img.addEventListener('mouseover', bounceImg);
}

document.addEventListener('DOMContentLoaded', () => {
    newsFeed.showRecentBlogs(document.getElementById('news-feed'));
    initBounceImg('fabu_img');

    buildComponents();    
});