# Voice for the kids' episode "Noodle's Bedtime Walk" (docs/marketing/KIDS_SERIES.md, Pilot 2), told by Noodle the dachshund.
# The kids' voice: Kokoro af_bella at 0.95x for the 16:9 episode (owner, 4 Nov 2026; it was 0.85x), short warm lines, one wav per line so
# the build can leave a short pause between them (and one per star while counting). The script table's lines, plus two short calm lines
# in the same voice ("Hello, friends. It's me, Noodle." and "The ducks are sleepy too."). Line set "teen": the short lines of the fast
# 9:16 cut for teenagers (voice 1.1x, Reel pace): the stars and the goodnight lines from the kids' set plus a few shorter ones.
#   pip install kokoro-onnx soundfile ; model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0: kokoro-v1.0.int8.onnx, voices-v1.0.bin)
#   python3 vo_bedtime_walk.py <modelDir> <outDir> [voice af_bella] [speed 0.95] [lines kids|teen]
#   (the 16:9 episode: speed 0.95, lines kids; the 9:16 cut: speed 1.1, lines teen, into its own outDir)
# Writes <outDir>/<key>.wav and <outDir>/vo.json ({dur, text}); build_bedtime_walk.js reads both.
import soundfile as sf, numpy as np, json, sys, os
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.int8.onnx", sys.argv[1] + "/voices-v1.0.bin")
OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
V = sys.argv[3] if len(sys.argv) > 3 else "af_bella"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 0.95
SET = sys.argv[5] if len(sys.argv) > 5 else "kids"
L = {
 "hello":  "Hello, friends. It's me, Noodle.",
 "sun":    "The sun is going down.",
 "walk":   "Let's take one last little walk before bed.",
 "step":   "Step, step, step.",
 "leaves": "Can you hear the leaves?",
 "ducks0": "The ducks are sleepy too.",
 "ducks":  "Goodnight, ducks. Sleep tight.",
 "light":  "Look, the lighthouse is turning on its light.",
 "sea":    "Goodnight, sea.",
 "count":  "Let's count the stars.",
 "n1": "One.", "n2": "Two.", "n3": "Three.", "n4": "Four.", "n5": "Five.",
 "moon":   "There's the moon.",
 "home0":  "It's time to go home.",
 "back":   "Back home.",
 "yawn":   "A big yawn.",
 "bed":    "A soft bed.",
 "night":  "Goodnight, friends.",
 "dreams": "Sweet dreams.",
}
if SET == "teen":
    L = {k: L[k] for k in ["n1", "n2", "n3", "n4", "n5", "yawn", "dreams"]} | {
     "sun":   "Sun's going down.",
     "walk":  "One last walk.",
     "ducks": "Night night, ducks.",
     "count": "Okay. Stars.",
     "bed":   "And... bed.",
     "night": "Goodnight, friends.",
    }
out = {}
for key, text in L.items():
    a, sr = k.create(text, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
    n = int(0.02 * sr); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n)   # no clicks at the cut
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L}, open(OUT + "/vo.json", "w"), indent=1); print(out, "total", round(sum(out.values()), 2))
