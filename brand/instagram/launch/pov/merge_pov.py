# Merge the AI office shot with the real-art screen insert: track the laptop screen frame by frame (ORB features + RANSAC homographies,
# chained, corners smoothed), pin the browser window (noodle-browser-insert frames) onto the lower right of the screen, match it to the
# shot (a little softness, contrast and a cool screen tint, a faint glare), then hold the last, zoomed-in frame with a slow push-in so the
# click, the munching and the hearts play while we are close.
#   python3 merge_pov.py <office.mp4> <insert_frames_dir (f0000.png.. 60 fps, RGBA)> <workdir> <out.mp4> [music.wav-or-mp4]
import sys, os, glob, subprocess, math
import numpy as np, cv2

src, insdir, work, out = sys.argv[1:5]
music = sys.argv[5] if len(sys.argv) > 5 else None
os.makedirs(os.path.join(work, 'src'), exist_ok=True); os.makedirs(os.path.join(work, 'out'), exist_ok=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, os.path.join(work, 'src', 'f%04d.png')], check=True)
frames = sorted(glob.glob(os.path.join(work, 'src', 'f*.png')))
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip()
num, den = (int(x) for x in probe.split('/')); SRC_FPS = num / den
F0 = cv2.imread(frames[0]); H, W = F0.shape[:2]
OUT_FPS, INS_FPS = 30, 60
ins = sorted(glob.glob(os.path.join(insdir, 'f*.png'))); INS_T = len(ins) / INS_FPS

# the window in frame 0: lower right of the laptop screen, 16:10 (the frame is 720 x 1280; scaled by the frame size)
sx, sy = W / 720, H / 1280
WX, WY, WW = 385 * sx, 600 * sy, 310 * sx; WH = WW * 10 / 16
quad0 = np.float32([[WX, WY], [WX + WW, WY], [WX + WW, WY + WH], [WX, WY + WH]])
SCREEN0 = np.float32([[60 * sx, 395 * sy], [720 * sx, 395 * sy], [720 * sx, 830 * sy], [60 * sx, 830 * sy]])  # where features are taken

# ---- tracking: homography from frame 0 to each frame, chained frame to frame inside the (moving) screen area ----
orb = cv2.ORB_create(4000)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
Hs = [np.eye(3)]
prev = cv2.cvtColor(F0, cv2.COLOR_BGR2GRAY)
for i in range(1, len(frames)):
    cur = cv2.cvtColor(cv2.imread(frames[i]), cv2.COLOR_BGR2GRAY)
    m = np.zeros_like(prev); poly = cv2.perspectiveTransform(SCREEN0[None], Hs[-1])[0]; cv2.fillConvexPoly(m, poly.astype(np.int32), 255)
    k1, d1 = orb.detectAndCompute(prev, m); k2, d2 = orb.detectAndCompute(cur, None)
    Hstep = np.eye(3)
    if d1 is not None and d2 is not None and len(k1) > 20:
        ms = sorted(bf.match(d1, d2), key=lambda x: x.distance)[:600]
        if len(ms) > 20:
            p1 = np.float32([k1[x.queryIdx].pt for x in ms]); p2 = np.float32([k2[x.trainIdx].pt for x in ms])
            Hh, inl = cv2.findHomography(p1, p2, cv2.RANSAC, 3.0)
            if Hh is not None and inl.sum() > 15: Hstep = Hh
    Hs.append(Hstep @ Hs[-1]); prev = cur
# place the window by where it should be at the END (zoomed in): centred, in the lower half, then map that back to frame 0,
# so the push-in lands on it (the source decides where the camera goes, so the window follows the camera, not the other way round)
TW = W * 0.86; TH = TW * 10 / 16; TX = (W - TW) / 2; TY = H * 0.60 - TH / 2
target = np.float32([[TX, TY], [TX + TW, TY], [TX + TW, TY + TH], [TX, TY + TH]])
quad0 = cv2.perspectiveTransform(target[None], np.linalg.inv(Hs[-1]))[0].astype(np.float32)
print('window in frame 0:', quad0.round(1).tolist(), flush=True)
corners = np.array([cv2.perspectiveTransform(quad0[None], h)[0] for h in Hs])  # (n, 4, 2)
# smooth the corner paths (a centred moving average) so AI wobble and tracking noise do not shake the window
k = 5; pad = np.concatenate([np.repeat(corners[:1], k // 2, 0), corners, np.repeat(corners[-1:], k // 2, 0)])
corners = np.array([pad[i:i + k].mean(0) for i in range(len(corners))])
np.save(os.path.join(work, 'corners.npy'), corners)

# ---- the timeline: the source plays, then its last frame holds with a slow push-in; the insert starts so the click lands just as the push-in ends ----
SRC_T = len(frames) / SRC_FPS
OFFSET = SRC_T - 3.2                      # insert time 0 at this video time (the click, insert 2.4 s, lands 0.8 s before the source ends)
TOTAL = OFFSET + INS_T                    # the insert plays to its end
HOLD_ZOOM = 0.07                          # extra push-in over the hold
glare = np.zeros((H, W), np.float32); cv2.ellipse(glare, (int(W * 0.72), int(H * 0.35)), (int(W * 0.5), int(H * 0.22)), -25, 0, 360, 1.0, -1); glare = cv2.GaussianBlur(glare, (0, 0), W * 0.12)

def insert_frame(t):
    ti = t - OFFSET
    if ti < 0: ti = ti % 0.36             # before it starts: loop the opening wag (no cursor yet)
    return cv2.imread(ins[min(len(ins) - 1, int(ti * INS_FPS))], cv2.IMREAD_UNCHANGED)

n_out = int(round(TOTAL * OUT_FPS))
for o in range(n_out):
    t = o / OUT_FPS
    si = min(len(frames) - 1, int(t * SRC_FPS))
    base = cv2.imread(frames[si]).astype(np.float32)
    q = corners[si].copy()
    if t > SRC_T:                          # the hold: a slow push-in towards the window
        z = 1 + HOLD_ZOOM * min(1, (t - SRC_T) / (TOTAL - SRC_T)) ** 0.8
        c = q.mean(0); A = np.float32([[z, 0, c[0] * (1 - z)], [0, z, c[1] * (1 - z)]])
        base = cv2.warpAffine(base, A, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        q = (q - c) * z + c
    fr = insert_frame(t).astype(np.float32); ih, iw = fr.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [iw, 0], [iw, ih], [0, ih]]), q.astype(np.float32))
    warped = cv2.warpPerspective(fr, M, (W, H), flags=cv2.INTER_AREA if np.linalg.norm(q[1] - q[0]) < iw else cv2.INTER_CUBIC)
    rgb, a = warped[..., :3], warped[..., 3:] / 255.0
    # match the filmed screen: softer, lower contrast, a touch cooler and darker, plus the glare the screen has
    scale = np.linalg.norm(q[1] - q[0]) / W
    rgb = cv2.GaussianBlur(rgb, (0, 0), 0.6 + 0.9 * scale)
    rgb = (rgb - 128) * 0.86 + 128 + np.array([6, 0, -4], np.float32)  # BGR: a little blue, a little less red
    rgb = rgb * 0.95 + glare[..., None] * 18
    a = a * 0.96
    # a faint drop shadow under the window, like a desktop window
    sh = cv2.GaussianBlur(np.roll(a[..., 0], (int(6 * scale * 4), int(3 * scale * 4)), (0, 1)), (0, 0), 4 + 14 * scale)
    base = base * (1 - 0.28 * sh[..., None])
    comp = base * (1 - a) + rgb * a
    cv2.imwrite(os.path.join(work, 'out', f'o{o:04d}.png'), np.clip(comp, 0, 255).astype(np.uint8))
    if o % 60 == 0: print('frame', o, '/', n_out, flush=True)

# ---- sound: the source's own sound, then quiet game music under it, and a soft pop at the click ----
click_t = OFFSET + 2.4
sr = 44100; n = int(TOTAL * sr); pop = np.zeros(n, np.float32)
for i in range(int(0.09 * sr)):
    tt = i / sr; j = int(click_t * sr) + i
    if j < n: pop[j] += 0.35 * math.sin(2 * math.pi * (900 - 5000 * tt) * tt) * math.exp(-45 * tt)
pcm = (np.clip(pop, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(os.path.join(work, 'pop.wav'), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
inputs = ['-framerate', str(OUT_FPS), '-i', os.path.join(work, 'out', 'o%04d.png'), '-i', src, '-i', os.path.join(work, 'pop.wav')]
fc = f'[1:a]apad,atrim=0:{TOTAL:.3f},volume=2.0[s];[2:a]volume=1[p]'; mix = '[s][p]'; nmix = 2
if music:
    inputs += ['-i', music]; fc += f';[3:a]atrim=0:{TOTAL:.3f},volume=0.45,afade=t=in:d=0.8,afade=t=out:st={TOTAL - 0.8:.3f}:d=0.8[m]'; mix += '[m]'; nmix = 3
fc += f';{mix}amix=inputs={nmix}:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100[a]'  # Reel loudness
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-t', f'{TOTAL:.3f}',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], check=True)
print('wrote', out, f'{TOTAL:.2f} s')
