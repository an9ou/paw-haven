# English voice-over for the v2.19 Friends launch Reel, told by Noodle the dachshund, like our first video (the 45 s promo, VIDEO_SCRIPT_45S.md):
# the same Kokoro voice, af_bella at 1.1x, exclamation marks for a warm, passionate read, a deadpan joke after each feature.
#   pip install kokoro-onnx soundfile ; model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0: kokoro-v1.0.int8.onnx, voices-v1.0.bin)
#   python3 vo_friends.py <modelDir> <outDir> [voice af_bella] [speed 1.1]
# Every line is true to the v2.19 game (V219.md): the friend name and code, read-only visits with pets, the 12 preset paw-print notes
# ("Your dog is so fluffy!" is note 1), one gift a day, a friend's dog on your walk, no chat and no typed messages. Launch 7 Nov 2026.
import soundfile as sf, numpy as np, json, sys, os
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.int8.onnx", sys.argv[1] + "/voices-v1.0.bin")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "af_bella"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
L = {
 "hook":  "Big news! Our dogs can make friends now!",
 "code":  "Pick a friend name, share your code, and your dog can visit theirs!",
 "visit": "Visit their yard! Pet their dogs! This is Waffles. Waffles likes me.",
 "note":  "Leave a paw-print note! Mine says: your dog is so fluffy!",
 "gift":  "Send a gift, once a day! I sent a biscuit. I did not eat it first.",
 "walk":  "And take their dog on your walk! Waffles is faster than me.",
 "walkb": "I let her win.",
 "safe":  "No chat. No messages. Just dogs, being friends!",
 "end":   "Friends arrives on November seventh! Drop your friend code below!",
}
# VO_LINES=<file.json> (the how-to, 7 Nov 2026: howto/vo_howto.json): other lines in the same voice, { key: text }, in order
if os.environ.get("VO_LINES"): L = json.load(open(os.environ["VO_LINES"]))
out = {}
for key, text in L.items():
    a, sr = k.create(text, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L}, open(OUT + "/vo.json", "w"), indent=1); print(out, "total", round(sum(out.values()), 2))
