# English voice-over for the 45 s promo, with Kokoro TTS (Apache-2.0 model, runs offline).
#   pip install kokoro-onnx soundfile ; model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0: kokoro-v1.0.int8.onnx, voices-v1.0.bin)
#   python vo45.py <voice, e.g. am_michael> <speed, e.g. 1.08> <modelDir> <outDir>
import soundfile as sf, numpy as np, json, sys
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[3] + "/kokoro-v1.0.int8.onnx", sys.argv[3] + "/voices-v1.0.bin")
V = sys.argv[1] if len(sys.argv) > 1 else "am_michael"; SP = float(sys.argv[2]) if len(sys.argv) > 2 else 0.95
L = {  # punctuation is part of the delivery: "!" gives the voice more lift
 "l1a": "Everything in this town was drawn very carefully.", "l1b": "Except me! I drew myself!",
 "l2": "Hi, I'm Noodle! Welcome to Doodle Doggo!",
 "l3": "Adopt a wobbly crayon pup! There are fourteen of us. We are all very proud!",
 "l4": "Feed us! Pet us! Bathe us, if you must.",
 "l5a": "Take us on walks! Dig up treasure! Visit Mount Fuji!", "l5b": "Somebody should dig a tunnel through that mountain. I volunteer!",
 "l6": "Grow a garden! Cook dog-safe treats! Have puppy playdates, with real coat genetics!",
 "l7": "Dress up for every season! The ugly sweater contest is judged by a duck!",
 "l8a": "And nothing bad ever happens here. Worst case? You walk into a log.", "l8b": "I meant to do that!",
 "l9soon": "Doodle Doggo. Coming soon! Follow, so you don't miss me!",
 "l9play": "Doodle Doggo! Free to play in your browser. Link in bio!",
}
out = {}
for key, text in L.items():
    a, sr = k.create(text, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    # trim leading/trailing silence
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0]-int(0.03*sr)): idx[-1]+int(0.08*sr)]
    sf.write(sys.argv[4] + f"/{key}.wav", a, sr); out[key] = round(len(a)/sr, 2)
json.dump(out, open(sys.argv[4] + "/dur.json", "w")); print(out, "sum(no l9play)", round(sum(v for kk, v in out.items() if kk != "l9play"), 2))
