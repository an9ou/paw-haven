# English voice-over for Reel #4 "I drew all 35 dog breeds badly. Find yours before it ends." (owner's pick, 6 Nov 2026; VIRAL_REEL_IDEAS.md #4).
# Told by Noodle the dachshund, the same voice as our other Reels (Kokoro af_bella at 1.1x, friends_reel/vo_friends.py): the hook at 0.1 s,
# a deadpan joke while the Pug is on screen, a second one on the Greyhound ("Mostly legs."), and the one ask at the end. Kind jokes only (never "ugliest").
#   python3 vo_breeds.py <modelDir> <outDir> [voice af_bella] [speed 1.1]
#   model files: kokoro-v1.0.int8.onnx, voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx, model-files-v1.0)
import soundfile as sf, numpy as np, json, sys
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.int8.onnx", sys.argv[1] + "/voices-v1.0.bin")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "af_bella"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
L = {
 "hook": "I drew all thirty-five dog breeds badly. Find yours before it ends!",
 "pug":  "The Pug was harder than it looks.",
 "legs": "Mostly legs.",
 "ask":  "Didn't see yours? Tell me in the comments!",
}
out = {}
for key, text in L.items():
    a, sr = k.create(text, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L}, open(OUT + "/vo.json", "w"), indent=1); print(out, "total", round(sum(out.values()), 2))
