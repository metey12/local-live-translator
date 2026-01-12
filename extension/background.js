let isCapturing = false;

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TOGGLE_CAPTURE') {
        if (isCapturing) {
            stopCapture();
            sendResponse({ isActive: false });
        } else {
            startCapture();
            sendResponse({ isActive: true });
        }
    } else if (msg.type === 'GET_STATUS') {
        sendResponse({ isActive: isCapturing });
    }
    return true;
});

async function startCapture() {
    try {
        // 1. Önce Offscreen (Görünmez) dökümanı oluştur
        const existingContexts = await chrome.runtime.getContexts({});
        const offscreenExists = existingContexts.some(c => c.contextType === 'OFFSCREEN_DOCUMENT');
        
        if (!offscreenExists) {
            await chrome.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: ['AUDIO_PLAYBACK', 'USER_MEDIA'],
                justification: 'Sesi yakalayıp sunucuya iletmek için'
            });
        }

        // 2. Aktif sekmenin Stream ID'sini al
        const tab = await getActiveTab();
        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });

        // 3. Stream ID'yi Offscreen dökümana gönder (İşlem orada başlayacak)
        chrome.runtime.sendMessage({
            type: 'START_RECORDING',
            streamId: streamId
        });

        isCapturing = true;
        
    } catch (err) {
        console.error("Başlatma hatası:", err);
        isCapturing = false;
    }
}

function stopCapture() {
    isCapturing = false;
    // Offscreen dökümana dur emri ver
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    
    // Ekranda kalan yazıları temizle
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'HIDE_SUBTITLE' });
    });
}

async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

// Offscreen'den gelen çeviriyi alıp kullanıcıya göster
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TRANSLATION_RECEIVED') {
        // Aktif sekmeye gönder
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    type: 'SHOW_SUBTITLE', 
                    text: msg.data.tr,
                    isFinal: msg.data.is_final 
                });
            }
        });
    }
});