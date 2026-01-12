# 🎙️ Local Live Translator (RTX Powered)

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=google-chrome)
![NVIDIA](https://img.shields.io/badge/GPU-Accelerated-76B900?logo=nvidia)
![Whisper](https://img.shields.io/badge/AI-OpenAI_Whisper-00A67E)

**Local Live Translator**, tarayıcı tabanlı videoları (YouTube, Twitch, Netflix vb.) **anlık olarak** (Real-Time) yakalayan, yerel GPU gücünü kullanarak metne döken ve Türkçeye çeviren açık kaynaklı bir projedir.

Bulut tabanlı API maliyetlerine ve kota sınırlarına son verir. Tamamen **Localhost** üzerinde, **0.5 saniye altı gecikme** ile çalışır.

## 🏗️ Architectural Overview (Mimari Bakış)

Proje, yüksek performanslı bir Client-Server mimarisi kullanır:

1.  **Audio Capture (Client):** Chrome Eklentisi, `chrome.offscreen` API kullanarak aktif sekmenin sesini `Float32Array` formatında ham olarak yakalar.
2.  **Streaming (Transport):** Yakalanan ses paketleri, **WebSocket** üzerinden kayıpsız bir şekilde Python sunucusuna (`localhost:8765`) akıtılır.
3.  **Inference (Server/GPU):** Python sunucusu, **Faster-Whisper** kütüphanesi ile sesi işler. Bu aşamada NVIDIA Tensor Core'ları kullanılarak matris işlemleri milisaniyeler içinde tamamlanır.
4.  **Translation (Server):** İngilizce metin, `deep-translator` (Google Translate) aracılığıyla Türkçeye çevrilir.
5.  **Overlay (Client):** Sonuçlar WebSocket ile geri döner ve `Content Script` aracılığıyla videonun üzerine Netflix stili dinamik altyazı olarak basılır.

## 🛠️ Gereksinimler

* **OS:** Windows 10 / 11 (x64)
* **Python:** 3.11.x (Önerilen)
* **GPU:** NVIDIA RTX Serisi Ekran Kartı (CUDA 12.x destekli)
* **Browser:** Google Chrome (veya Chromium tabanlı tarayıcılar)

## 🚀 Dev Scripts & Usage

Sistemi başlatmak için:

```bash
# Terminalde (server klasöründe):
python server.py
```

*Sunucu başladığında `✅ Hazır!` mesajını gördüğünüzde, Chrome eklentisindeki **BAŞLAT** butonuna basabilirsiniz.*

### Konfigürasyon (`server.py`)
Modeli donanımınıza göre optimize edebilirsiniz:

```python
# Hız Canavarı (Düşük VRAM, En Hızlı)
MODEL_SIZE = "tiny.en" 

# Kalite Odaklı (Yüksek VRAM, Daha Yavaş)
MODEL_SIZE = "large-v3" 

# Evrensel Mod (Japonca, Almanca vb. -> Türkçe)
MODEL_SIZE = "small" # .en takısını kaldırın
```

## ⚠️ Common Pitfalls & Troubleshooting

Yeni katkıda bulunanların (Contributors) en sık karşılaştığı hatalar:

### 1. `Could not load library cublas64_12.dll`
* **Sebep:** Python, NVIDIA kütüphanelerini bulamıyor.
* **Çözüm:** `cublas64_12.dll`, `cudnn_*.dll` dosyalarını `server.py` ile aynı klasöre veya `venv/Scripts` içine kopyalayın.

### 2. `[WinError 193] %1 is not a valid Win32 application`
* **Sebep:** `zlibwapi.dll` dosyasının 32-bit sürümünü indirdiniz.
* **Çözüm:** Linkteki **x64** sürümünü indirin ve System32'ye atın.

### 3. `ConnectionRefusedError` / Eklenti Bağlanmıyor
* **Sebep:** Sunucu çalışmıyor veya Port 8765 dolu.
* **Çözüm:** Terminalin açık olduğundan ve `python server.py` komutunun çalıştığından emin olun.

### 4. Ses Var, Çeviri Yok (VAD Sorunu)
* **Sebep:** Mikrofon gürültüsü veya sessizlik eşiği yanlış.
* **Çözüm:** `server.py` içindeki `min_silence_duration_ms=300` değerini düşürün.

## 🤝 Contributing

Bu proje topluluk katkılarına açıktır! Pull Request göndermekten çekinmeyin.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
**Author:** Mete Yıldırım
