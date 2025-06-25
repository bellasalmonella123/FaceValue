document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const startBtn = document.getElementById('startBtn');
    
    // Access camera
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Error accessing camera/microphone:", err);
            alert("Could not access camera/microphone. Please ensure you've granted permissions.");
        }
    }
    
    startBtn.addEventListener('click', () => {
        // Open interview page in new tab
        window.open('interview.html', '_blank');
    });
    
    startCamera();
});