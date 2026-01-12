import asyncio
import numpy as np
import websockets
import json
import os
import sys

# --- DLL YOLU EKLEME ---
if os.name == 'nt':
    try:
        python_path = os.path.dirname(sys.executable)
        os.add_dll_directory(python_path)
    except Exception as e:
        print(f"DLL Hatası: {e}")
# -----------------------

from faster_whisper import WhisperModel
from deep_translator import GoogleTranslator

MODEL_SIZE = "small" 
DEVICE = "cuda" 
COMPUTE_TYPE = "float16"

print(f"Yükleniyor ({MODEL_SIZE})...")
try:
    model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    translator = GoogleTranslator(source='auto', target='tr')
    print(f"✅ Hazır! (Canlı İngilizce -> Final Türkçe)")
except Exception as e:
    print(f"❌ Model Hatası: {e}")
    sys.exit(1)

async def transcribe_audio(websocket):
    print("Bağlantı kuruldu")
    
    audio_buffer = np.array([], dtype=np.float32)
    SAMPLE_RATE = 16000
    
    try:
        async for message in websocket:
            chunk = np.frombuffer(message, dtype=np.float32)
            audio_buffer = np.concatenate((audio_buffer, chunk))

            duration = len(audio_buffer) / SAMPLE_RATE

            # Veri birikince işle (0.5 sn'ye düşürdük, daha seri olsun)
            if duration >= 0.5: 
                
                # --- FISILTI MODELİ (WHISPER) ---
                segments, _ = model.transcribe(
                    audio_buffer, 
                    beam_size=1,       # Düşünme, yaz.
                    best_of=1,
                    temperature=0.0, 
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=300),
                    #language="en"
                )
                
                full_text = " ".join([seg.text for seg in segments]).strip()
                
                if full_text:
                    # Sessizlik kontrolü (Cümle bitti mi?)
                    rms = np.sqrt(np.mean(audio_buffer[-2000:]**2))
                    is_silence = bool(rms < 0.008)
                    
                    # Cümle bittiyse VEYA çok uzadıysa final yap
                    is_final = bool(is_silence or (duration > 4.0))
                    
                    text_to_send = full_text
                    
                    # SADECE Cümle bittiyse çeviri yap (Lag'ı önler)
                    if is_final:
                        try:
                            # Google'a sadece burada gidiyoruz
                            text_to_send = translator.translate(full_text)
                            print(f"🇹🇷 {text_to_send}")
                        except:
                            pass
                    else:
                        # Cümle bitmediyse çeviriyle vakit kaybetme, İngilizce göster
                        # (Kullanıcı duyduğunu anlasın diye)
                        pass

                    response = {
                        "tr": text_to_send,
                        "is_final": is_final
                    }
                    
                    await websocket.send(json.dumps(response))
                    
                    if is_final:
                        audio_buffer = np.array([], dtype=np.float32)

    except websockets.exceptions.ConnectionClosed:
        print("Bağlantı kesildi")
    except Exception as e:
        print(f"Hata: {e}")

async def main():
    async with websockets.serve(transcribe_audio, "localhost", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())