# Mandarin voice-over for the RedNote cut of the v2.19 Friends launch Reel (owner, 2 Nov 2026: "Chinese voice (Kokoro)"), told by Noodle like the English one.
# Kokoro v1.1-zh (the Mandarin model) with misaki's Chinese G2P, a female voice like the English af_bella. The words follow vo_friends.py line by line
# (same keys, so build_friends.js times the shots the same way), in the game's own zh-Hans words: 好友名, 好友码, 做客, 摸摸, 留个爪印, 送一份礼物,
# 和好友的狗狗一起散步; note 0 is "你的狗狗毛茸茸的！". Owner's rule: "no chat, no messages", never "no typing" (没有聊天，没有私信).
# Waffles is said 华夫 (spoken Latin names come out badly in the Mandarin model); the subtitles say 华夫 too.
#   pip install kokoro-onnx soundfile misaki pypinyin cn2an proces addict pypinyin_dict ; jieba 0.42.1 from its sdist (PYTHONPATH) if it will not build
#   model files: github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.1: kokoro-v1.1-zh.onnx, voices-v1.1-zh.bin)
#   python3 vo_friends_zh.py <modelDir> <outDir> [voice zf_001] [speed 1.1]
import soundfile as sf, numpy as np, json, sys
from kokoro_onnx import Kokoro
from misaki import zh
k = Kokoro(sys.argv[1] + "/kokoro-v1.1-zh.onnx", sys.argv[1] + "/voices-v1.1-zh.bin")
g2p = zh.ZHG2P(version="1.1")
OUT = sys.argv[2]; V = sys.argv[3] if len(sys.argv) > 3 else "zf_001"; SP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
L = {
 "hook":  "好消息！我们的狗狗可以交朋友啦！",
 "code":  "选一个好友名，分享你的好友码，你的狗狗就能去好友家做客啦！",
 "visit": "去好友的院子做客！摸摸好友的狗狗！这是华夫。华夫喜欢我。",
 "note":  "留个爪印！我写的是：你的狗狗毛茸茸的！",
 "gift":  "每天可以送一份礼物！我送了一块饼干。我没有先偷吃。",
 "walk":  "还可以带好友的狗狗一起散步！华夫跑得比我快。",
 "walkb": "是我让着她。",
 "safe":  "没有聊天，没有私信。只有狗狗，一起做朋友！",
 "end":   "好友功能十一月七日上线！在评论区留下你的好友码吧！",
}
out = {}
for key, text in L.items():
    ph, _ = g2p(text)
    a, sr = k.create(ph, voice=V, speed=SP, is_phonemes=True)
    th = 0.01; idx = np.where(np.abs(a) > th)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    sf.write(OUT + f"/{key}.wav", a, sr); out[key] = round(len(a) / sr, 2)
json.dump({"dur": out, "text": L}, open(OUT + "/vo.json", "w"), indent=1, ensure_ascii=False); print(out, "total", round(sum(out.values()), 2))
