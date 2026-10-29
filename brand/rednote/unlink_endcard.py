# RedNote cut of the Halloween Market Reel (owner, 29 Oct 2026: no game link on RedNote): covers the end card's doodledoggo.app pill
# with clean paper from lower on the same card, following the crayon wipe as it slides in.
#   python3 brand/rednote/unlink_endcard.py brand/reels/halloween-market/reel_1080x1920.mp4 brand/reels/halloween-market/reel_1080x1920_rednote.mp4
import subprocess, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
W, H = 1080, 1920; X0, X1, Y0, Y1, DY = 235, 851, 1080, 1286, 405   # pill box; paper source 405 px lower (14 dot rows)
rd = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
frames = []
while True:
    b = rd.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    frames.append(np.frombuffer(b, np.uint8).reshape(H, W, 3).copy())
last = frames[-1].astype(int); patch = frames[-1][Y0 + DY:Y1 + DY, X0:X1].copy()
done = 0
for i, f in enumerate(frames):
    if i < len(frames) - 30 * 3: continue                                  # the end card arrives in the last 2.4 s
    # find the wipe's edge on a plain-paper band just above the pill (rows 1048..1074), then patch only the pill columns right of it
    band = f[1048:1075].astype(int)
    match = ((band[..., 0] > 228) & (band[..., 1] > 215) & (band[..., 2] > 180)).mean(0) > 0.9
    tail = np.cumsum(match[::-1])[::-1] / np.arange(W, 0, -1)
    ok = np.nonzero(tail > 0.97)[0]
    if not len(ok): continue
    e = max(0, ok.min() + 8 - X0)                                          # 8 px inside the card, so the scene is never covered
    if e >= X1 - X0: continue
    f[Y0:Y1, X0 + e:X1] = patch[:, e:]; done += 1
print('frames patched', done, 'of', len(frames))
enc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
for f in frames: enc.stdin.write(f.tobytes())
enc.stdin.close(); enc.wait()
