// Konteyner
let subContainer = document.getElementById('py-subs-container');
if (!subContainer) {
    subContainer = document.createElement('div');
    subContainer.id = 'py-subs-container';
    subContainer.style.cssText = `
        position: fixed; 
        bottom: 80px; 
        left: 50%; 
        transform: translateX(-50%);
        width: 80%;
        max-width: 1000px;
        text-align: center;
        z-index: 2147483647;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
    `;
    document.body.appendChild(subContainer);
}

// Aktif (geçici) satır için element
let tempLine = document.createElement('div');
tempLine.style.cssText = `
    background-color: rgba(0, 0, 0, 0.5);
    color: #b0b0b0; 
    padding: 8px 16px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 24px;
    font-style: italic;
    transition: all 0.1s;
    display: none; 
`;
subContainer.appendChild(tempLine);

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_SUBTITLE') {
        const text = msg.text;
        
        // Basit konuşmacı renklendirmesi (Eğer metinde yakalarsa)
        let formattedText = text
            .replace(/Speaker 1:|Konuşmacı 1:/gi, '<span style="color:#00ffff">👦:</span>')
            .replace(/Speaker 2:|Konuşmacı 2:/gi, '<span style="color:#ff00ff">👩:</span>');

        if (msg.isFinal) {
            // FİNAL SATIR (Kalıcı)
            tempLine.style.display = 'none'; // Geçiciyi gizle
            tempLine.innerHTML = '';
            addFinalLine(formattedText);
        } else {
            // GEÇİCİ SATIR (Güncellenen)
            tempLine.style.display = 'block';
            tempLine.innerHTML = formattedText + ' <span style="font-size:16px">...</span>';
        }
    } else if (msg.type === 'HIDE_SUBTITLE') {
        subContainer.innerHTML = '';
        subContainer.appendChild(tempLine); // Temp satırı geri ekle
    }
});

function addFinalLine(htmlContent) {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    div.style.cssText = `
        background-color: rgba(0, 0, 0, 0.85);
        color: #ffffff; 
        padding: 10px 20px;
        border-radius: 10px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 26px;
        font-weight: 600;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        animation: popIn 0.3s ease-out;
    `;
    
    // Temp satırın hemen üstüne ekle (DOM'da temp en altta kalsın)
    subContainer.insertBefore(div, tempLine);

    // 3 satırdan fazlasını sil
    const finals = subContainer.querySelectorAll('div:not([style*="italic"])'); // Temp olmayanlar
    if (finals.length > 2) {
        finals[0].remove();
    }

    // 5 saniye sonra kaybolsun
    setTimeout(() => { if(div.parentNode) div.remove(); }, 6000);
}

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes popIn {
        0% { opacity: 0; transform: translateY(20px) scale(0.9); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
`;
document.head.appendChild(styleSheet);