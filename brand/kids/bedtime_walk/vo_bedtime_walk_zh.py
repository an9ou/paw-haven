# Mandarin voice for the RedNote Reel of "Noodle's Bedtime Walk" (owner, 5 Nov 2026: "can create reels version for rednote"): the fast 9:16 cut,
# line for line (the same keys as the "teen" set of vo_bedtime_walk.py, so build_bedtime_walk.js times the shots the same way), told by Noodle.
# Kokoro v1.1-zh (the Mandarin model) with misaki's Chinese G2P, the soft female voice zf_073 (the owner's RedNote pick, as in
# friends_reel/vo_friends_zh.py) at 1.1x, the Reel pace of the English teen cut. The star count uses the Chinese numbers; the subtitles show 1. to 5. like the English cut.
#   pip install kokoro-onnx soundfile misaki pypinyin cn2an proces addict pypinyin_dict ordered-set ; jieba 0.42.1 from its sdist (PYTHONPATH) if it will not build
#   model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.1: kokoro-v1.1-zh.onnx, voices-v1.1-zh.bin)
#   vocab: huggingface.co/hexgrad/Kokoro-82M-v1.1-zh config.json, saved as <modelDir>/config-v1.1-zh.json (kokoro-onnx 0.6's built-in vocab is
#   v1.0's, which has no bopomofo tokens, so without it the Mandarin sounds are dropped); misaki 0.9.x for ZHG2P(version="1.1")
#   python3 vo_bedtime_walk_zh.py <modelDir> <outDir> [voice zf_073] [speed 1.1]
#   then REDNOTE=1 FORMAT=tall node build_bedtime_walk.js <workdir> <outDir>
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
 "sun":    "太阳要下山啦。",
 "walk":   "最后再散一次步。",
 "ducks":  "鸭鸭们，晚安。",
 "count":  "来，数星星。",
 "n1": "一。", "n2": "二。", "n3": "三。", "n4": "四。", "n5": "五。",
 "yawn":   "打个大哈欠。",
 "bed":    "然后，睡觉。",
 "night":  "朋友们，晚安。",
 "dreams": "做个好梦。",
}
out = {}
for key, text in L.items():
    ph, _ = g2p(text)
    a, sr = k.create(ph, voice=V, speed=SP, is_phonemes=True)
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.12 * sr)]
    n = int(0.02 * sr); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n)   # no clicks at the cut
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L, "lang": "zh"}, open(OUT + "/vo.json", "w"), indent=1, ensure_ascii=False); print(out, "total", round(sum(out.values()), 2))
