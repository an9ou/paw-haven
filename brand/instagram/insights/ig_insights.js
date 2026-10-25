// Pulls @doodledoggo.app's posts and their insights from the Instagram API (Instagram Login, graph.instagram.com) for the content review
// (docs/marketing/CONTENT_STRATEGY.md). Read-only: it never posts or changes anything.
//
//   IG_ACCESS_TOKEN=<long-lived token> node brand/instagram/insights/ig_insights.js [outdir]
//
// The token comes from the environment (never paste it into a chat or a file in the repo). It needs the permissions
// instagram_business_basic and instagram_business_manage_insights, from a Meta app with "Instagram API with Instagram Login",
// on the Professional (Creator) account. Output: <outdir>/ig_media.json (everything) and <outdir>/ig_media.csv (one row per post).
const fs = require('fs'), path = require('path');
const TOKEN = process.env.IG_ACCESS_TOKEN, V = process.env.IG_API_VERSION || 'v21.0', BASE = `https://graph.instagram.com/${V}`;
const OUT = path.resolve(process.argv[2] || 'ig_out'); fs.mkdirSync(OUT, { recursive: true });
if (!TOKEN) { console.error('IG_ACCESS_TOKEN is not set'); process.exit(1); }

const get = async (url) => {
  const u = new URL(url.startsWith('http') ? url : BASE + url); if (!u.searchParams.has('access_token')) u.searchParams.set('access_token', TOKEN);
  const r = await fetch(u); const j = await r.json(); if (j.error) throw new Error(j.error.message); return j;
};
// metrics per kind; asked one by one when a group is refused, so one unsupported metric does not lose the rest
const METRICS = {
  REELS: ['views', 'reach', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'ig_reels_avg_watch_time', 'ig_reels_video_view_total_time'],
  FEED: ['views', 'reach', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'profile_visits', 'follows'],
  STORY: ['views', 'reach', 'replies', 'shares', 'navigation'],
};
async function insights(m) {
  const list = METRICS[m.media_product_type] || METRICS.FEED, res = {};
  const take = (j) => (j.data || []).forEach((d) => { res[d.name] = d.values ? d.values[0].value : d.total_value ? d.total_value.value : null; });
  try { take(await get(`/${m.id}/insights?metric=${list.join(',')}`)); } catch (e) {
    for (const k of list) { try { take(await get(`/${m.id}/insights?metric=${k}`)); } catch (e2) { res[k] = null; } }
  }
  return res;
}

(async () => {
  const me = await get('/me?fields=id,username,account_type,followers_count,follows_count,media_count');
  console.log(`@${me.username}: ${me.followers_count} followers, ${me.media_count} posts`);
  const media = []; let next = '/me/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=50';
  while (next) { const j = await get(next); media.push(...(j.data || [])); next = j.paging && j.paging.next; }
  for (const m of media) { m.insights = await insights(m); process.stdout.write('.'); }
  console.log();
  fs.writeFileSync(path.join(OUT, 'ig_media.json'), JSON.stringify({ account: me, fetched: new Date().toISOString(), media }, null, 1));
  const cols = ['timestamp', 'media_product_type', 'media_type', 'permalink', 'views', 'reach', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'ig_reels_avg_watch_time', 'profile_visits', 'follows', 'caption'];
  const esc = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const rows = media.map((m) => cols.map((c) => esc(c === 'caption' ? (m.caption || '').split('\n')[0].slice(0, 120) : c in m.insights ? m.insights[c] : m[c])).join(','));
  fs.writeFileSync(path.join(OUT, 'ig_media.csv'), [cols.join(','), ...rows].join('\n') + '\n');
  console.log(`wrote ${media.length} posts to ${OUT}/ig_media.json and ig_media.csv`);
})().catch((e) => { console.error('Instagram API:', e.message); process.exit(1); });
