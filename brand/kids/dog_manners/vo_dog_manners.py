# Voice for the kids' episode "How to say hello to a dog" (Dog manners, ep. 1; docs/marketing/KIDS_SERIES.md, Pilot 1, the FINAL script table,
# checked against Dogs Trust, the Royal Kennel Club, the AVMA and HSE Ireland on 3 Nov 2026). Told by Noodle the dachshund: Kokoro af_bella at 0.9x,
# slower and warmer than the Reels. Every line is said exactly as the table writes it; a line is cut into its sentences (and the count into its
# numbers) only so the pictures can follow the words: the words and their order never change.
#   pip install kokoro-onnx soundfile ; model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0: kokoro-v1.0.int8.onnx, voices-v1.0.bin)
#   python3 vo_dog_manners.py <modelDir> <outDir> [voice af_bella] [speed 0.9]
# Writes <key>.wav per clip and vo.json ({dur, text}); build_dog_manners.js lays them out (about 0.6 s between lines) and cuts the subtitles.
import soundfile as sf, numpy as np, json, sys
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.int8.onnx", sys.argv[1] + "/voices-v1.0.bin")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "af_bella"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 0.9
L = {
 # Hello
 "hi1": "Hi, friends! I'm Noodle.",
 "hi2": "Today I'll show you how to say hello to a dog.",
 "hi3": "Gently!",
 # 1. Ask first (Dogs Trust, Royal Kennel Club, AVMA)
 "ask1": "Before you pet a dog, ask the dog's grown-up: may I say hello?",
 "ask2": "If they say no, that's okay.",
 "ask3": "We can wave instead!",
 # 2. Stand still (Dogs Trust, HSE, AVMA)
 "still1": "Stand still, with your hands down.",
 "still2": "Let the dog come to you and sniff.",
 "still3": "Sniffing is how dogs say hello!",
 "still4": "If the dog doesn't come, that's okay too.",
 # 3. Pet softly (Dogs Trust: 3 strokes; HSE: not the face)
 "pet1": "Pet softly, on the shoulder or the side.",
 "pet2": "Not the face.",
 "one": "One,",
 "two": "two,",
 "three": "three...",
 "stop": "then stop.",
 "pet3": "Does the dog want more?",
 "pet4": "It leans in.",
 "pet5": "Yes, please!",
 # 4. Let it go (Royal Kennel Club, AVMA)
 "go1": "If the dog walks away, it means: that's enough for now.",
 "go2": "Let it go.",
 "go3": "That's being a good friend.",
 # Also (Royal Kennel Club, HSE, AVMA)
 "also1": "And when a dog is sleeping,",
 "also2": "or eating, we let it be.",
 # Recap
 "rc0": "Let's say it together!",
 "rc1": "One: ask first.",
 "rc2": "Two: stand still.",
 "rc3": "Three: pet softly.",
 "rc4": "Four: let it go.",
 # Bye
 "bye1": "Bye-bye, friends!",
 "bye2": "See you next time.",
}
out = {}
for key, text in L.items():
    a, sr = k.create(text, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
    fade = int(0.02 * sr); a[-fade:] *= np.linspace(1, 0, fade)
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 3)
json.dump({"dur": out, "text": L, "voice": V, "speed": SP}, open(OUT + "/vo.json", "w"), indent=1); print(out, "total", round(sum(out.values()), 2))
