# Mandarin voice for the RedNote cut of Reel #4 "I drew all 35 dog breeds badly" (owner approved the English, 6 Nov 2026: "make rednote version").
# The same keys as vo_breeds.py (hook, pug, legs, ask), so build_breeds.js times the parade the same way; told by Noodle.
# Kokoro v1.1-zh (the Mandarin model) with misaki's Chinese G2P, the soft female voice zf_073 (the owner's RedNote pick, as in
# kids/bedtime_walk/vo_bedtime_walk_zh.py) at 1.1x. Spoken numbers in Chinese (三十五); the subtitles show 35. Kind jokes only (never 最丑).
#   model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.1: kokoro-v1.1-zh.onnx, voices-v1.1-zh.bin)
#   vocab: huggingface.co/hexgrad/Kokoro-82M-v1.1-zh config.json, saved as <modelDir>/config-v1.1-zh.json (without it the Mandarin sounds are
#   dropped: kokoro-onnx 0.6's built-in vocab is v1.0's); misaki 0.9.x for ZHG2P(version="1.1"); jieba 0.42.1 on PYTHONPATH if it will not build
#   python3 vo_breeds_zh.py <modelDir> <outDir> [voice zf_073] [speed 1.1]
#   then REDNOTE=1 node build_breeds.js <workdir> <outDir>
import soundfile as sf, numpy as np, json, sys, os
from kokoro_onnx import Kokoro
from misaki import zh
VOCAB = sys.argv[1] + "/config-v1.1-zh.json"
if not os.path.exists(VOCAB): sys.exit("missing " + VOCAB + " (the v1.1-zh vocab, see above)")
k = Kokoro(sys.argv[1] + "/kokoro-v1.1-zh.onnx", sys.argv[1] + "/voices-v1.1-zh.bin", vocab_config=VOCAB)
g2p = zh.ZHG2P(version="1.1")
OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
V = sys.argv[3] if len(sys.argv) > 3 else "zf_073"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
L = {
 "hook": "我把三十五种狗狗都画歪了。快找找你家的狗狗！",
 "pug":  "巴哥犬比看起来难画多了。",
 "legs": "基本全是腿。",
 "ask":  "没看到你家的狗狗？评论区告诉我，我们帮你画一只！",
}
out = {}
for key, text in L.items():
    ph, _ = g2p(text)
    a, sr = k.create(ph, voice=V, speed=SP, is_phonemes=True)
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
    n = int(0.02 * sr); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n)   # no clicks at the cut
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L, "lang": "zh"}, open(OUT + "/vo.json", "w"), indent=1, ensure_ascii=False); print(out, "total", round(sum(out.values()), 2))
