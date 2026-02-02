import speech_recognition as sr
import sys
import json
import os

def get_wake_word(config_path):
    """Read wake word from assistant config file"""
    if not config_path:
        return 'nova'
        
    try:
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                word = config.get('wakeWord', 'nova').lower()
                # Ensure it's not empty
                return word if word.strip() else 'nova'
    except Exception:
        pass
    return 'nova'

def listen_for_wake_word(config_path):
    r = sr.Recognizer()
    r.energy_threshold = 300
    r.dynamic_energy_threshold = True
    
    # Track wake word to avoid redundant logging
    last_wake_word = None
    
    with sr.Microphone() as source:
        print(json.dumps({"type": "INFO", "msg": "Microphone initialized. Tuning ambient noise..."}))
        sys.stdout.flush()
        
        r.adjust_for_ambient_noise(source, duration=0.5)
        
        while True:
            try:
                # Re-read wake word each iteration to pick up changes
                wake_word = get_wake_word(config_path)
                
                if wake_word != last_wake_word:
                    print(json.dumps({"type": "INFO", "msg": f"Wake word engine active. Listening for '{wake_word}'..."}))
                    sys.stdout.flush()
                    last_wake_word = wake_word
                
                audio = r.listen(source, phrase_time_limit=10)
                
                text = r.recognize_google(audio).lower()
                
                # Check if wake word is in the spoken text
                if wake_word in text.split() or wake_word in text:
                    # If we found the wake word, trigger the AI
                    result = {
                        "type": "WAKE_WORD",
                        "text": text,
                        "command": text.replace(wake_word, "", 1).strip()
                    }
                    print(json.dumps(result))
                    sys.stdout.flush()
                
            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                print(json.dumps({"type": "ERROR", "msg": "Google Speech API Connection Issue"}))
                sys.stdout.flush()
            except Exception as e:
                # Critical error logger
                print(json.dumps({"type": "ERROR", "msg": str(e)}))
                sys.stdout.flush()

if __name__ == "__main__":
    # Get config path from command line arg
    config_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    try:
        listen_for_wake_word(config_path)
    except KeyboardInterrupt:
        sys.exit(0)