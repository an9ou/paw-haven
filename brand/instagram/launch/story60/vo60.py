# Bella's narration for the 1-minute Noodle story (story60) (Kokoro TTS, Apache-2.0 model, runs offline).
#   python vo60.py <modelDir> <outDir> [voice=af_bella] [speed=1.1]
import soundfile as sf, numpy as np, json, sys
from kokoro_onnx import Kokoro
k = Kokoro(sys.argv[1] + "/kokoro-v1.0.int8.onnx", sys.argv[1] + "/voices-v1.0.bin")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "af_bella"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
L = {  # "!" gives Bella more lift; keep the subtitles (build60.js) in step with these
  "n1a": "Hi! I'm Noodle. Everything in this town was drawn very carefully.",
  "n1b": "Except me. I drew myself!",
  "n2a": "This is my yard. My house. My mountain.",
  "n2b": "Okay, the mountain isn't mine. But I look at it a lot.",
  "n3a": "Every morning, I go for a walk. I hop over logs.",
  "n3b": "Mostly.",
  "n4a": "Then, the Town Square! The cafe smells like treats. The clock says it's snack time.",
  "n4b": "The clock always says that.",
  "n5a": "At the Dog Park, I made friends. This is Biscuit. Biscuit thinks everything is a snack.",
  "n5b": "Including me, once.",
  "n6a": "This is Mochi. She said, heh.",
  "n6b": "We're best friends now.",
  "n7": "And Frost. Frost has opinions. Loud ones!",
  "n8a": "Gerald the duck lives by the river. He knows everything.",
  "n8b": "He told me so.",
  "n9": "At the end of the day, we watch the sun go down over Mount Fuji. It's my favourite part.",
  "n10a": "My town is almost ready for you. Doodle Doggo is coming soon!",
  "n10b": "Follow us on Instagram for news, so you don't miss me!",
}
# spelled for the voice only (the subtitles keep the real names): Kokoro reads "Mochi" as MAH-chai; Mochi is MOH-chee
SAY = {"Mochi": "Mohchee"}
# CUT=short: the 15-second ad cut (same keys where the shot is the same)
if __import__("os").environ.get("CUT") == "short":
    L = {"n1a": "Hi! I'm Noodle.", "n1b": "I drew myself!", "n3a": "I hop over logs.", "n3b": "Mostly.", "n5a": "I made friends!",
         "n9": "And every day ends with Mount Fuji.", "n10a": "Doodle Doggo. Coming soon!", "n10b": "Follow us, so you don't miss me!"}
out = {}
for key, text in L.items():
    said = text
    for w, sp in SAY.items(): said = said.replace(w, sp)
    a, sr = k.create(said, voice=V, speed=SP, lang="en-gb" if V.startswith("b") else "en-us")
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    sf.write(f"{OUT}/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L}, open(f"{OUT}/vo.json", "w"), indent=1); print(out, "total", round(sum(v for kk, v in out.items() if True), 1))
