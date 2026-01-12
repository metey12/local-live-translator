document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');

    // Eklenti açıldığında şu anki durumu sor
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
        updateUI(response.isActive);
    });

    btn.addEventListener('click', () => {
        // Butona basınca durumu tersine çevir isteği at
        chrome.runtime.sendMessage({ type: 'TOGGLE_CAPTURE' }, (response) => {
            updateUI(response.isActive);
        });
    });

    function updateUI(isActive) {
        if (isActive) {
            btn.textContent = "DURDUR";
            btn.classList.add('active');
            statusText.textContent = "Canlı Çeviri Aktif";
            statusDot.style.backgroundColor = "#00ff00"; 
        } else {
            btn.textContent = "BAŞLAT";
            btn.classList.remove('active');
            statusText.textContent = "Hazır (Local)";
            statusDot.style.backgroundColor = "#ff4444"; 
        }
    }
});