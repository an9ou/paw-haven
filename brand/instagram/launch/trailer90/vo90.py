# Bella's narration for the ~90 s overview trailer (Kokoro TTS, Apache-2.0 model, runs offline).
#   python vo90.py <modelDir> <outDir> [voice=af_bella] [speed=1.1]
import soundfile as sf, numpy as np, json, sys
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.int8.onnx", sys.argv[1] + "/voices-v1.0.bin")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "af_bella"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
L = {  # "!" gives Bella more lift; keep the subtitles (trailer90.js) in step with these
 "w1": "Welcome to a little town drawn in pencil, where every fence post was sketched with care.",
 "w2": "And where every dog... drew themselves!",
 "d1": "There's Noodle! The rest of him is on its way.",
 "d2": "Biscuit, who believes everything is a snack.",
 "d3": "Mochi, who could leave any time. She chooses not to.",
 "d4": "Frost, who has opinions. Loud ones!",
 "d5": "Fourteen dogs in all, each with their own voice, size, and very silly joke.",
 "d6": "Find the one that's yours, and adopt them for free!",
 "c1": "Feed them, cuddle them, give them a bath, and tuck them in for a nap.",
 "c2": "Dress them up! Crayon dogs love a hat.",
 "c3": "Bring the whole pack along to play!",
 "c4": "Head out on walks around town, and hop over anything in your way.",
 "c5": "Visit the Mount Fuji Lookout, and watch the sun go down.",
 "c6": "Grow a garden, and cook treats that are safe for dogs.",
 "c7": "Decorate your home, and make room for a bigger family.",
 "c8": "Plan puppy playdates, where every coat is passed down for real.",
 "c9": "And as the seasons change, the town changes too!",
 "c10": "Snap a postcard of your best friends to keep.",
 "h1": "Getting started is easy! Tap New game, pick your pup, and give them a name.",
 "h2": "Everything you need is right along the bottom.",
 "h3": "Rub your dog to give them a pet.",
 "h4": "On walks, tap to hop, hold to jump further, and swipe down to duck.",
 "h5": "And don't worry. Nothing bad ever happens here.",
 "e1": "Doodle Doggo! A cozy dog game, free in your browser, on your phone or computer.",
 "e2soon": "Coming soon! Follow along, so you don't miss a thing!",
 "e2play": "Come and meet your new best friend. Play free today!",
}
out = {}
for key, text in L.items():
    a, sr = k.create(text, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    sf.write(f"{OUT}/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L}, open(f"{OUT}/vo.json", "w"), indent=1); print(out, "total", round(sum(v for kk, v in out.items() if kk != "e2play"), 1))
