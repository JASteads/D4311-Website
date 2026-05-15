// script.js - District 4311

document.addEventListener('DOMContentLoaded', () => {
    
    const fabuImg = document.getElementById('fabu_img');
    if (!fabuImg) return;

    let isBouncing = false;

    bounceImg = () => {
        if (isBouncing) return;
        isBouncing = true;

        let startTime = null;
        const duration = 500; // measured in ms

        animate = timestamp => {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1); // 0 to 1

            // Bounce formula
            const bounce = Math.sin(progress * Math.PI * 5) * Math.pow(1 - progress, 2.5);
            const currentScale = 1 + bounce * 0.8;   // 0.8 = max bounce strength

            fabuImg.style.transform = `scale(${currentScale})`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                fabuImg.style.transform = 'scale(1)';
                isBouncing = false;
            }
        }

        requestAnimationFrame(animate);
    }

    // Trigger on hover
    fabuImg.addEventListener('mouseover', bounceImg);
    
    console.log("Script loaded in");
});