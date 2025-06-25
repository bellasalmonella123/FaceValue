document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const video = document.getElementById('interviewVideo');
    const endBtn = document.getElementById('endInterviewBtn');
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.display = 'none';

    // Speech recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Sentiment analysis (simple version)
    const positiveWords = ['great', 'excellent', 'happy', 'positive', 'success', 'achieve', 'love', 'like', 'good'];
    const negativeWords = ['bad', 'terrible', 'unhappy', 'negative', 'failure', 'hate', 'dislike', 'problem'];

    // Interview Statistics
    let stats = {
        gender: [],
        age: [],
        emotions: [],
        smiling: [],
        speechSentiments: [],
        transcript: '',
        startTime: new Date(),
        detectionCount: 0
    };

    let stream = null;
    let detectionInterval = null;
    let modelsLoaded = false;

    // 1. Load face-api.js
    async function loadFaceAPI() {
        try {
            await loadScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
            return true;
        } catch (err) {
            console.error('Failed to load face-api.js:', err);
            return false;
        }
    }

    // 2. Load models
    async function loadModels() {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                faceapi.nets.ageGenderNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
            ]);
            modelsLoaded = true;
            return true;
        } catch (err) {
            console.error('Failed to load models:', err);
            return false;
        }
    }

    // 3. Start camera and microphone
    async function startMedia() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });
            video.srcObject = stream;
            
            return new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    resolve();
                };
            });
        } catch (err) {
            console.error('Media error:', err);
            throw new Error(`Could not access media devices: ${err.message}`);
        }
    }

    // 4. Start speech recognition
    function startSpeechRecognition() {
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    analyzeSentiment(transcript);
                } else {
                    interimTranscript += transcript;
                }
            }
            
            stats.transcript += finalTranscript;
            updateSpeechUI(interimTranscript, finalTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();
    }

    // 5. Simple sentiment analysis
    function analyzeSentiment(text) {
        const words = text.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        let sentiment;
        if (positiveCount > negativeCount) sentiment = 'positive';
        else if (negativeCount > positiveCount) sentiment = 'negative';
        else sentiment = 'neutral';
        
        stats.speechSentiments.push(sentiment);
        updateSentimentUI(sentiment);
    }

    // 6. Face detection
    async function detectFaces() {
        if (!modelsLoaded) return;
        
        try {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const detections = await faceapi.detectAllFaces(
                canvas,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceExpressions()
            .withAgeAndGender();
            
            if (detections?.length > 0) {
                processDetection(detections[0]);
            }
        } catch (err) {
            console.error('Face detection error:', err);
        }
    }

    // 7. Process detection results
    function processDetection(detection) {
        const expressions = detection.expressions;
        const gender = detection.gender;
        const age = detection.age;
        const smiling = expressions.happy > 0.7;
        const emotion = getDominantEmotion(expressions);
        
        // Update stats
        stats.gender.push(gender);
        stats.age.push(Math.round(age));
        stats.emotions.push(emotion);
        stats.smiling.push(smiling);
        stats.detectionCount++;
        
        // Update UI
        updateFaceUI({
            gender,
            age: Math.round(age),
            emotion,
            smiling: smiling ? "Yes" : "No"
        });
    }

    // UI Update functions
    function updateFaceUI({gender, age, emotion, smiling}) {
        document.getElementById('gender').textContent = gender;
        document.getElementById('age').textContent = age;
        document.getElementById('emotion').textContent = emotion;
        document.getElementById('smiling').textContent = smiling;
    }

    function updateSpeechUI(interim, final) {
        const transcriptElement = document.getElementById('transcript');
        transcriptElement.innerHTML = `
            <p><strong>Final:</strong> ${stats.transcript}</p>
            <p><strong>Interim:</strong> ${interim}</p>
        `;
    }

    function updateSentimentUI(sentiment) {
        const sentimentElement = document.getElementById('sentiment');
        sentimentElement.textContent = sentiment;
        sentimentElement.className = sentiment; // For CSS styling
    }

    function updateTimer() {
        const elapsed = Math.floor((new Date() - stats.startTime) / 1000);
        document.getElementById('timer').textContent = 
            `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`;
        setTimeout(updateTimer, 1000);
    }

    // Helper functions
    function getDominantEmotion(expressions) {
        return Object.entries(expressions).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // End interview
    function endInterview() {
        clearInterval(detectionInterval);
        recognition.stop();
        if (stream) stream.getTracks().forEach(track => track.stop());
        
        // Calculate final results
        const result = {
            gender: getMostFrequent(stats.gender) || "unknown",
            age: Math.round(average(stats.age)) || 0,
            smilePercent: Math.round((stats.smiling.filter(Boolean).length / stats.smiling.length) * 100) || 0,
            dominantEmotion: getMostFrequent(stats.emotions) || "neutral",
            sentiment: getMostFrequent(stats.speechSentiments) || "neutral",
            transcript: stats.transcript
        };
        
        localStorage.setItem('interviewResults', JSON.stringify(result));
        window.open('results.html', '_blank');
        window.close();
    }

    // Utility functions
    function getMostFrequent(arr) {
        if (!arr?.length) return null;
        const counts = {};
        arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // Initialize everything
    async function init() {
        try {
            // Load face-api.js
            if (!await loadFaceAPI()) {
                throw new Error('Could not load face detection library');
            }
            
            // Load models
            if (!await loadModels()) {
                console.warn('Proceeding without face detection models');
            }
            
            // Start camera
            await startMedia();
            
            // Start face detection
            if (modelsLoaded) {
                detectionInterval = setInterval(detectFaces, 1000);
            }
            
            // Start speech recognition
            startSpeechRecognition();
            
            // Start timer
            updateTimer();
            
        } catch (err) {
            console.error('Initialization error:', err);
            alert(`Initialization failed: ${err.message}`);
        }
    }

    endBtn.addEventListener('click', endInterview);
    init();
});