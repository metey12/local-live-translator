let socket = null;
let audioContext = null;
let processor = null;
let mediaStream = null;

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'START_RECORDING') {
        startRecording(msg.streamId);
    } else if (msg.type === 'STOP_RECORDING') {
        stopRecording();
    }
});

async function startRecording(streamId) {
    if (socket) return; 

    try {
        // 1. Stream ID ile sesi yakala
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            },
            video: false
        });

        // 2. WebSocket Bağlantısı
        socket = new WebSocket("ws://localhost:8765");
        
        socket.onopen = () => console.log("✅ Offscreen: Sunucuya Bağlandı");
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.tr) {
                    chrome.runtime.sendMessage({
                        type: 'TRANSLATION_RECEIVED',
                        data: data
                    });
                }
            } catch (e) {}
        };

        // 3. Ses İşleme
        audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(mediaStream);
        
        // Sesi doğrudan hoparlöre (Destination) bağlıyoruz ki sen de duy.
        source.connect(audioContext.destination);
        // ----------------------------------------------------

        processor = audioContext.createScriptProcessor(4096, 1, 1);

        // Processor hattı (Veri hattı)
        source.connect(processor);
        
        // Chrome'da ScriptProcessor'ın çalışması için bir yere bağlı olması şarttır.
        // Ama source'u zaten bağladık, yankı yapmasın diye bunu sessize alıp bağlıyoruz.
        const zeroGain = audioContext.createGain();
        zeroGain.gain.value = 0; // Sesi kıs
        processor.connect(zeroGain);
        zeroGain.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                socket.send(inputData.buffer);
            }
        };

    } catch (err) {
        console.error("Offscreen Hatası:", err);
    }
}

function stopRecording() {
    if (processor) { processor.disconnect(); processor = null; }
    if (audioContext) { audioContext.close(); audioContext = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    if (socket) { socket.close(); socket = null; }
}