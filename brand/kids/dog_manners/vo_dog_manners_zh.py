# Mandarin voice for the RedNote Reel of the kids' episode "How to say hello to a dog" (owner, 5 Nov 2026: "Dog manners ... can create reels version
# for rednote"): the 9:16 teen cut (vo_dog_manners.py set "teen"), line by line with the same keys, so build_dog_manners.js FORMAT=tall REDNOTE=1
# lays it out like the English cut. Told by Noodle as 我 (spoken Latin names come out badly in the Mandarin model; if a name is ever needed,
# Noodle = 面条, Bagel the Beagle = 贝果). Each rule keeps its meaning exactly: ask the dog's grown-up (主人) first; stand still, hands down, let the
# dog come and sniff; pet softly on the shoulder or side, 3 strokes then stop; if the dog walks away, let it go.
# Kokoro v1.1-zh (the Mandarin model), voice zf_073 at 1.0x (the owner's pick for RedNote, as vo_friends_zh.py).
# misaki's Chinese G2P (ZHG2P(version="1.1"), misaki >= 0.9; on Python 3.13 pip finds only 0.7.x: pip install --no-deps --ignore-requires-python misaki==0.9.4).
# The hook avoids 教 (misaki reads it jiao4, not "teach" jiao1).
#   pip install kokoro-onnx soundfile misaki pypinyin cn2an pypinyin_dict ; jieba 0.42.1 from its sdist (PYTHONPATH) if it will not build
#   model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.1: kokoro-v1.1-zh.onnx, voices-v1.1-zh.bin), and the model's own
#   vocab: huggingface.co/hexgrad/Kokoro-82M-v1.1-zh, config.json, saved as <modelDir>/config-v1.1-zh.json, used when present (kokoro-onnx 0.6's
#   built-in vocab is v1.0's, which has no bopomofo tokens)
#   python3 vo_dog_manners_zh.py <modelDir> <outDir> [voice zf_073] [speed 1.0]
# Writes <key>.wav per clip and vo.json ({dur, text, voice, speed, set: "teen", lang: "zh"}).
import soundfile as sf, numpy as np, json, sys, os
from kokoro_onnx import Kokoro
from misaki import zh
VOCAB = sys.argv[1] + "/config-v1.1-zh.json"
k = Kokoro(sys.argv[1] + "/kokoro-v1.1-zh.onnx", sys.argv[1] + "/voices-v1.1-zh.bin", vocab_config=VOCAB if os.path.exists(VOCAB) else None)
g2p = zh.ZHG2P(version="1.1")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "zf_073"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
L = {
 "tHook":  "来学学怎么和狗狗打招呼吧！",
 "tAsk":   "先问问狗狗的主人。",
 "tStill": "站着别动，手放低，让狗狗自己过来闻一闻。",
 "tPet":   "轻轻地摸，摸它的肩膀或身体侧面。",
 "one":    "一，",
 "two":    "二，",
 "three":  "三。",
 "stop":   "然后就停下来。",
 "tGo":    "如果狗狗走开了，就让它走吧。",
}
out = {}
for key, text in L.items():
    ph, _ = g2p(text); print(key, text, "|", ph)
    a, sr = k.create(ph, voice=V, speed=SP, is_phonemes=True)
    # trim by loudness in 10 ms windows (the model leaves a soft hiss of ~0.3 s before short words, which a peak threshold keeps)
    w = int(0.01 * sr); e = np.array([np.sqrt(np.mean(a[i:i + w] ** 2)) for i in range(0, len(a) - w, w)]); on = np.where(e > 0.02)[0]
    a = a[max(0, (on[0] - 3) * w): min(len(a), (on[-1] + 1) * w + int(0.1 * sr))]
    fade = int(0.02 * sr); a[-fade:] *= np.linspace(1, 0, fade)
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 3)
json.dump({"dur": out, "text": L, "voice": V, "speed": SP, "set": "teen", "lang": "zh"}, open(OUT + "/vo.json", "w"), indent=1, ensure_ascii=False)
print(out, "total", round(sum(out.values()), 2))
