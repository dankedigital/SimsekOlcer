// Ses algılama ayarları
const THRESHOLD = 0.3; // Ses eşiği
const DETECTION_TIME = 500; // Algılama süresi (ms)

// DOM elementleri
const startButton = document.getElementById('startButton');
const statusElement = document.getElementById('status');
const meterValue = document.getElementById('meterValue');

// Uyarı sesi
const alertSound = new Audio('http://www.mertsabuncu.com/wp-content/uploads/2024/12/Applause-Crowd-Cheering-sound-effect.mp3');

let audioContext;
let analyser;
let dataArray;
let isListening = false;

// Safari için AudioContext kontrolü
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// Mikrofon erişimi ve ses analizi başlatma
async function startListening() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Tarayıcınız mikrofon erişimini desteklemiyor.');
        }

        // Safari için özel ayarlar
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // AudioContext'i kullanıcı etkileşimi ile başlat
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 2048;
        dataArray = new Float32Array(analyser.frequencyBinCount);
        
        source.connect(analyser);
        
        isListening = true;
        startButton.disabled = true;
        statusElement.textContent = 'Dinleniyor...';
        statusElement.className = 'status listening';
        
        // Ses algılama döngüsünü başlat
        detectSound();

        // Test amaçlı ses çal
        try {
            await alertSound.play();
            alertSound.pause();
            alertSound.currentTime = 0;
        } catch (error) {
            console.log('Test sesi çalınamadı:', error);
        }
    } catch (error) {
        console.error('Mikrofon erişimi hatası:', error);
        statusElement.textContent = 'Mikrofon erişimi reddedildi veya bir hata oluştu!';
        statusElement.className = 'status detected';
        startButton.disabled = false;
    }
}

// Ses seviyesi analizi
function detectSound() {
    if (!isListening) return;

    analyser.getFloatTimeDomainData(dataArray);
    
    // RMS (Root Mean Square) hesaplama
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / dataArray.length);
    
    // Ses seviyesi göstergesi güncelleme
    const meterPercentage = Math.min(rms * 300, 100);
    meterValue.style.width = `${meterPercentage}%`;
    
    // Eşik değeri kontrolü
    if (rms > THRESHOLD) {
        lightningDetected();
    }
    
    requestAnimationFrame(detectSound);
}

// Şimşek algılandığında
function lightningDetected() {
    if (!isListening) return;
    
    isListening = false;
    statusElement.textContent = 'Şimşek Algılandı!';
    statusElement.className = 'status detected';
    
    // Uyarı sesi çal
    alertSound.currentTime = 0;
    alertSound.play().catch(error => console.log('Uyarı sesi çalınamadı:', error));
    
    // Belirli bir süre sonra tekrar dinlemeye başla
    setTimeout(() => {
        if (audioContext.state === 'running') {
            isListening = true;
            statusElement.textContent = 'Dinleniyor...';
            statusElement.className = 'status listening';
        }
    }, DETECTION_TIME);
}

// Event listener
startButton.addEventListener('click', startListening);