// The order emails (Resend): the buyer's nine kinds and the owner's notes (docs/design/merch/PART6.md, TRANSACTIONS.md 2 "Emails").
// build(kind, view, env) is pure: it makes { subject, text, html } from a buyer-safe view of the order, read at send time (the ledger's page(o),
// plus what this email is about: a parcel, a refund, a line, a reprint). No address and no email address ever go in a body; the dog's name only
// as it is printed; the gift code only in the buyer's own emails. Each body is a plain-text part and a small HTML part (inline styles only, no
// remote images, no tracking, no scripts) drawn from the same blocks, so they always say the same and the text reads fine alone.
// The ledger sends through its outbox (merch_outbox, PART3.md S7): a row per email written in the same transaction as the change it tells
// about, sent after commit, retried with backoff. Talks only through env.MAIL_FETCH; without it (or without RESEND_API_KEY) nothing is sent and
// the answer says so. The buyer's address is passed in by the caller, read from the Stripe session at send time: it is never stored here.
import { fetcher, call, siteOf, orderLink } from './util.js';

export const CONTACT = 'contact@doodledoggo.app';
export const KINDS = ['thanks', 'address', 'ship', 'cancelled', 'refunded', 'refunded_all', 'reject', 'late', 'late_again', 'reprint'];
const ZERO_DEC = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']; // Stripe's zero-decimal currencies
const THREE_DEC = ['BHD', 'JOD', 'KWD', 'OMR', 'TND'];
const INK = '#5B3D32', PAPER = '#FFFBF3', YELLOW = '#FFE3A1', MINT = '#C8E9CF';

/* ---------------- small words ---------------- */
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
// US cents -> "$1,234.56"
export function usd(c) { const n = Math.max(0, Math.round(num(c))), d = String(Math.floor(n / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return '$' + d + '.' + String(n % 100).padStart(2, '0'); }
// what the buyer paid in their own currency (Adaptive Pricing, display only): { currency, amount } in that currency's minor units
export function presMoney(p) {
  if (!p || typeof p.currency !== 'string' || !Number.isFinite(p.amount)) return '';
  const cur = p.currency.toUpperCase(); if (!/^[A-Z]{3}$/.test(cur) || cur === 'USD') return '';
  const d = ZERO_DEC.includes(cur) ? 0 : THREE_DEC.includes(cur) ? 3 : 2, v = p.amount / Math.pow(10, d);
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(v); } catch (e) { return cur + ' ' + v.toFixed(d); }
}
// "8 Dec 2026" (the order page's own form), in UTC: the buyer's clock is not known here
export function day(t) { const d = new Date(num(t)); return d.getUTCDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
// "Friday 4 December": the posting date in words (the delay plan). ship_by and late_eta are moments; the date said is their UTC date, always with
// "by", so the day we name is never earlier than the moment we keep to (the order page says it the same way: site/merch/merch.js postDay)
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function postDay(t) { const d = new Date(num(t)); return DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }
// the one posting promise (catalog.js SHIP_BY_DAYS; the shop page, the legal pages): printing 2 to 5 working days, posted within 7 of payment
export const PRINT_WORDS = 'printing usually takes 2 to 5 working days';
const shortId = (id) => String(id || '').replace(/^mo_/, '');
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').trim().slice(0, max || 80);
// one line of the order in words: "Mug with Biscuit", "Tee with your dog, navy, L"; q: how many (the line's own qty by default)
export function itemName(l) {
  const who = l && l.name ? clean(l.name, 40) : 'your dog';
  if (l && l.product === 'tee') return 'Tee with ' + who + ', ' + clean(l.colour_name || l.colour || '', 30).toLowerCase() + ', ' + clean(l.size || '', 6);
  return 'Mug with ' + who;
}
const itemLine = (l, q) => { q = q == null ? num(l.qty) : q; return (q > 1 ? q + ' × ' : '') + itemName(l); };
const httpsUrl = (u) => (typeof u === 'string' && /^https:\/\/[^\s"'<>]{1,500}$/.test(u) ? u : null);
// the gift's name from the Worker's settings (MERCH_GIFT_NAME): not decided yet, so it may be unset
export const giftName = (env) => { const n = clean(env && env.MERCH_GIFT_NAME, 60); return n || null; };

/* ---------------- blocks: one body, drawn as text and as HTML ---------------- */
// ['p', text] | ['list', [text]] | ['facts', [[label, value]]] | ['button', label, url] | ['gift', { code, name }] | ['small', text]
const escH = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function giftWords(g) {
  return { h: 'A little thank-you for your dog',
    p: 'With your order comes ' + (g.name ? 'the ' + g.name + ', a little gift for your dog in the game.' : 'a little gift for your dog in the game.'),
    how: 'How to use it: play Doodle Doggo at https://doodledoggo.app, open Settings (on a phone: the ⋯ menu), tap "Have a code?" and type the code. Gift codes are for players with the free cloud save account, so your gift stays safe on every device.',
    one: 'Each code works once. Got more than one? Pass the extra to a friend who plays.' };
}
function textOf(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b[0] === 'p' || b[0] === 'small') out.push(b[1]);
    else if (b[0] === 'list') out.push(b[1].map((x) => '- ' + x).join('\n'));
    else if (b[0] === 'facts') out.push(b[1].map((x) => x[0] + ': ' + x[1]).join('\n'));
    else if (b[0] === 'button') out.push(b[1] + ': ' + b[2]);
    else if (b[0] === 'gift') { const g = giftWords(b[1]); out.push(g.h.toUpperCase() + '\n' + g.p + '\nYour code: ' + b[1].code + '\n' + g.how + '\n' + g.one); }
  }
  return out.join('\n\n');
}
function htmlOf(blocks) {
  const P = 'margin:0 0 14px;';
  return blocks.map((b) => {
    if (b[0] === 'p') return '<p style="' + P + '">' + escH(b[1]) + '</p>';
    if (b[0] === 'small') return '<p style="' + P + 'font-size:15px;">' + escH(b[1]) + '</p>';
    if (b[0] === 'list') return '<ul style="margin:0 0 14px;padding:0 0 0 22px;">' + b[1].map((x) => '<li style="margin:0 0 4px;">' + escH(x) + '</li>').join('') + '</ul>';
    if (b[0] === 'facts') return '<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px;width:100%;">' + b[1].map((x) =>
      '<tr><td style="padding:3px 12px 3px 0;vertical-align:top;white-space:nowrap;">' + escH(x[0]) + '</td><td style="padding:3px 0;vertical-align:top;text-align:right;font-weight:bold;">' + escH(x[1]) + '</td></tr>').join('') + '</table>';
    if (b[0] === 'button') return '<p style="' + P + '"><a href="' + escH(b[2]) + '" style="display:inline-block;background:' + YELLOW + ';border:2px solid ' + INK + ';border-radius:10px;padding:10px 18px;color:' + INK + ';font-weight:bold;text-decoration:none;">' + escH(b[1]) + '</a></p>';
    if (b[0] === 'gift') {
      const g = giftWords(b[1]);
      return '<div style="margin:0 0 14px;padding:14px 16px;background:' + YELLOW + ';border:2px solid ' + INK + ';border-radius:12px;">' +
        '<p style="margin:0 0 6px;font-family:Georgia,\'Times New Roman\',serif;font-size:20px;font-weight:bold;">' + escH(g.h) + '</p>' +
        '<p style="margin:0 0 8px;">' + escH(g.p) + '</p>' +
        '<p style="margin:0 0 8px;">Your code: <span style="display:inline-block;font-family:\'Courier New\',Courier,monospace;font-size:20px;letter-spacing:1px;padding:4px 10px;background:#FFFFFF;border:2px dashed ' + INK + ';border-radius:8px;">' + escH(b[1].code) + '</span></p>' +
        '<p style="margin:0 0 6px;font-size:15px;">' + escH(g.how) + '</p><p style="margin:0;font-size:15px;">' + escH(g.one) + '</p></div>';
    }
    return '';
  }).join('');
}
function footer(env, site) {
  const name = clean(env && env.MERCH_SELLER_NAME, 120), addr = clean(env && env.MERCH_SELLER_ADDR, 240); // names only in the repo: the owner sets the values
  const seller = name ? 'Seller: ' + name + (addr ? ', ' + addr : '') + '.' : null;
  const links = [['Terms of sale', site + '/merch/terms/'], ['Shipping and returns', site + '/merch/shipping/'], ['Privacy', site + '/privacy']];
  return { seller, links, ask: 'Questions? Reply to this email or write to ' + CONTACT };
}
function page(subject, heading, blocks, env, site) {
  const f = footer(env, site);
  const text = heading + '\n\n' + textOf(blocks) + '\n\n--\nDoodle Doggo merch' + (f.seller ? '\n' + f.seller : '') + '\n' + f.links.map((l) => l[0] + ': ' + l[1]).join('\n') + '\n' + f.ask + '\n';
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>' + escH(subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + PAPER + ';">' +
    '<div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;color:' + INK + ';">' +
    '<p style="margin:0 0 6px;font-size:15px;">Doodle Doggo merch</p>' +
    '<h1 style="margin:0 0 16px;font-family:Georgia,\'Times New Roman\',serif;font-size:26px;line-height:1.2;color:' + INK + ';">' + escH(heading) + '</h1>' +
    '<div style="background:#FFFFFF;border:2px solid ' + INK + ';border-radius:14px;padding:18px 18px 4px;">' + htmlOf(blocks) + '</div>' +
    '<div style="margin:18px 4px 0;font-size:14px;line-height:1.5;">' + (f.seller ? '<p style="margin:0 0 6px;">' + escH(f.seller) + '</p>' : '') +
    '<p style="margin:0 0 6px;">' + f.links.map((l) => '<a href="' + escH(l[1]) + '" style="color:' + INK + ';">' + escH(l[0]) + '</a>').join(' &middot; ') + '</p>' +
    '<p style="margin:0;">' + escH(f.ask) + '</p></div></div></body></html>';
  return { subject, text, html };
}

/* ---------------- the buyer's emails ---------------- */
// view: { id, status, can_cancel, lines[{ line, product, colour, colour_name, size, name, qty, unit, status, refunded_qty, parcel, reprint_of, rp }],
//   parcels[{ id, carrier, tracking_url }], totals{ subtotal, ship_fee, tax, total, refunded }, pres, gift ('soon' | 'ready' | null), gift_code
//   (only once shown), gift_name, ship_by, late_eta, late, eta[min, max],
//   about{ parcel, gift (this email carries the gift), refund{ amount, reason, lines[{ line, qty }] }, line, reprint{ n, why }, reship } }
const LIVE = (l) => !['void', 'replaced', 'cancelled', 'rejected'].includes(l.status) && num(l.refunded_qty) < num(l.qty);
const SHIPPED = ['shipped', 'delivered'];
const WHY_ALL = { // the first line of "refunded in full", by the refund's reason (never the owner's own words)
  nothing: 'Sorry: we couldn’t make your order, so we’ve refunded all of it.', provider: 'Sorry: our print partner couldn’t make your order, so we’ve refunded all of it.',
  render: 'Sorry: we couldn’t get your order ready to print, so we’ve refunded all of it.', render_72h: 'Sorry: we couldn’t get your order ready to print in time, so we’ve refunded all of it.',
  address_7d: 'We didn’t hear back about the address, so we’ve refunded your order instead.', address_refund: 'As you asked, we’ve refunded your order instead of sending it.',
  wallet_5d: 'Sorry: our print partner couldn’t start on your order in time, so we’ve refunded all of it.',
  review_other_country: 'The address on the payment was in another country than the order, so we couldn’t send it. Please order again with the right country.',
  late: 'As you asked, we’ve refunded the part of your order that was running late. That was everything left, so all of it is refunded now.',
  late_auto: 'Your order didn’t go out by the new date we gave you. It took too long, so we’ve refunded it. Sorry.',
  reship: 'We didn’t hear back about the address, so we’ve refunded the things that came back.', lost: 'Sorry your parcel went missing.' };
const WHY_PART = { late: 'As you asked, we’ve refunded the part of your order that was running late.', lost: 'Sorry your parcel went missing.',
  late_auto: 'Part of your order didn’t go out by the new date we gave you. It took too long, so we’ve refunded it. Sorry.',
  reship: 'We didn’t hear back about the address, so we’ve refunded the things from the parcel that came back.' };

export function build(kind, view, env) {
  const v = view && typeof view === 'object' ? view : {}, site = siteOf(env), link = orderLink(site, v.id || '');
  const A = v.about || {}, L = Array.isArray(v.lines) ? v.lines.filter((l) => l && typeof l === 'object') : [], T = v.totals || {};
  const byLine = (n) => L.find((l) => l.line === n) || null, orderFact = ['Order', shortId(v.id)];
  const pres = presMoney(v.pres), card = 'It can take a few days to show on your card.';
  // the gift block only in the one email that carries it (A.gift: the ledger's gift_mailed) and only once it is shown (gift_code is then set)
  const gift = v.gift_code && A.gift ? ['gift', { code: clean(v.gift_code, 48), name: v.gift_name || giftName(env) }] : null;
  const ended = ['cancelled', 'refunded', 'expired'].includes(v.status);
  const toPage = ['button', 'Open your order page', link];
  const priced = (ls) => ls.map((l) => itemLine(l) + ': ' + usd(num(l.unit) * num(l.qty)));
  // review finding 6: the Tax row when there is tax (on top of the prices it adds up to the total; inside them, it says so)
  const totals = () => {
    const f = [orderFact, ['Shipping', num(T.ship_fee) ? usd(T.ship_fee) : 'Free']];
    if (num(T.tax) > 0) f.push([num(T.subtotal) + num(T.ship_fee) + num(T.tax) === num(T.total) ? 'Tax' : 'Tax (included in the prices)', usd(T.tax)]);
    f.push(['Total', usd(T.total) + ' (US dollars)']); return ['facts', f];
  };
  const post = num(v.ship_by) > 0 ? postDay(v.ship_by) : null;
  const B = [];
  switch (kind) {
    case 'thanks': {
      const ls = L.filter((l) => !['void', 'replaced'].includes(l.status) && l.reprint_of == null);
      B.push(['p', 'Thank you for putting your dog on something. Here is your order:'], ['list', priced(ls)], totals());
      if (pres) B.push(['p', 'You paid ' + pres + ' at checkout.']);
      if (v.can_cancel) B.push(['p', 'Changed your mind? You can cancel the whole order for a full refund within 1 hour of paying, from your order page.']);
      B.push(['p', 'What happens next: our print partner makes each one just for you (' + PRINT_WORDS + '), then it goes in the post.' + (post ? ' We’ll post it by ' + post + '.' : '') +
        ' We’ll email you a tracking link when it’s on its way.' + (Array.isArray(v.eta) && v.eta.length === 2 ? ' It usually takes about ' + num(v.eta[0]) + ' to ' + num(v.eta[1]) + ' working days to reach you.' : '')]);
      // the gift is shown only once the cancel hour is over (review finding 2): here only a word about it, and only when a code is reserved
      if (v.gift === 'soon') B.push(['p', 'A little thank-you for your dog in the game will be waiting on your order page once printing starts.']);
      else if (v.gift === 'ready') B.push(['p', 'A little thank-you for your dog in the game is waiting on your order page.']);
      B.push(toPage, ['small', 'Stripe sends its own receipt for the payment too.']);
      return page('Thank you for your order', 'Thank you! Your order is in.', B, env, site);
    }
    case 'address': {
      const reship = !!A.reship, ls = reship ? L.filter((l) => Array.isArray(A.reship_lines) && A.reship_lines.includes(l.line)) : L.filter(LIVE);
      B.push(['p', reship ? 'A parcel from your order came back to our print partner: it couldn’t be delivered to the address it had. We’d love to send it again, free.'
        : 'Our print partner couldn’t send your order to the address we were given.']);
      if (ls.length) B.push(['list', ls.map((l) => itemLine(l))]);
      B.push(['facts', [orderFact]], ['p', 'Could you check it for us? Open your order page and type the address again. It goes straight to our print partner, and we don’t keep it.'],
        ['p', reship ? 'If we don’t hear from you within 7 days, we’ll refund those things instead.' : 'If you’d rather not, you can ask for a full refund on the same page. If we don’t hear from you within 7 days, we’ll refund the whole order.'],
        ['button', 'Check my address', link]);
      return page('We need your address', 'Could you check your address?', B, env, site);
    }
    case 'ship': {
      const p = (Array.isArray(v.parcels) ? v.parcels : []).find((x) => x && x.id === A.parcel) || {};
      const ls = L.filter((l) => l.parcel && l.parcel === A.parcel), rest = L.filter((l) => LIVE(l) && !SHIPPED.includes(l.status) && l.parcel !== A.parcel).length;
      const url = httpsUrl(p.tracking_url);
      B.push(['p', 'Good news: this parcel has left our print partner.']);
      if (ls.length) B.push(['list', ls.map((l) => itemLine(l))]);
      B.push(['facts', [orderFact].concat(p.carrier ? [['Carrier', clean(p.carrier, 40)]] : [])]);
      if (url) B.push(['button', 'Track your parcel', url]); else B.push(['p', 'The tracking link is on your order page.']);
      if (rest) B.push(['p', 'The rest of your order travels in its own parcel. We’ll email you again when it’s sent.']);
      B.push(['p', 'Something wrong when it arrives? Reply to this email with a photo within 30 days, and we’ll reprint it or refund it, whichever you prefer.']);
      if (gift && A.gift) B.push(gift);
      B.push(toPage);
      return page('On its way', rest ? 'Part of your order is on its way' : 'Your order is on its way', B, env, site);
    }
    case 'cancelled': {
      B.push(['p', 'As you asked, we’ve cancelled your order. Nothing will be printed.'], ['list', L.filter((l) => !['void', 'replaced'].includes(l.status)).map((l) => itemLine(l))], ['facts', [orderFact]],
        ['p', 'We’ve refunded all of it, ' + usd(T.total) + ', shipping too. ' + card]);
      if (pres) B.push(['p', 'You paid ' + pres + ' at checkout; the refund comes back in that currency at the same rate.']);
      B.push(['p', 'Want to change something and order again? Your order page can put these back in your basket.'], toPage);
      return page('Your order is cancelled', 'Your order is cancelled', B, env, site);
    }
    case 'refunded': case 'refunded_all': {
      const R = A.refund || {}, all = kind === 'refunded_all', why = (all ? WHY_ALL : WHY_PART)[R.reason] || '';
      const ls = (Array.isArray(R.lines) ? R.lines : []).map((x) => { const l = byLine(x.line); return l ? itemLine(l, num(x.qty) || num(l.qty)) : null; }).filter(Boolean);
      if (why) B.push(['p', why]);
      if (all) B.push(['p', 'We’ve refunded your order in full: ' + usd(num(T.refunded) || num(T.total)) + '. ' + card]);
      else { // review finding 13: "the rest goes on" only while something of the order still goes on when this is sent
        B.push(['p', 'We’ve refunded ' + usd(R.amount) + ' for part of your order' + (ls.length ? ':' : '.')]); if (ls.length) B.push(['list', ls]);
        B.push(['p', (!ended && L.some(LIVE) ? 'The rest of your order goes on as before. ' : '') + card]);
      }
      B.push(['facts', [orderFact]]);
      if (pres) B.push(['p', 'You paid in ' + String(v.pres.currency).toUpperCase() + ' at checkout; the refund comes back in that currency at the same rate.']);
      B.push(toPage);
      return all ? page('Your order is refunded', 'Your order is refunded in full', B, env, site) : page('A refund for part of your order', 'We’ve refunded part of your order', B, env, site);
    }
    case 'reject': { // one line, or several rejected together (review finding 5): one email
      const R = A.refund || {}, nums = Array.isArray(R.lines) && R.lines.length ? R.lines.map((x) => x.line) : A.line != null ? [A.line] : [];
      const ls = nums.map(byLine).filter(Boolean), many = ls.length > 1, rest = L.filter((x) => LIVE(x) && !nums.includes(x.line)).length;
      B.push(['p', many ? 'We’re sorry: we couldn’t make these in your order.' : 'We’re sorry: we couldn’t make this one in your order.']);
      if (ls.length) B.push(['list', ls.map((l) => itemLine(l))]);
      B.push(['p', 'We’ve refunded ' + (R.amount ? usd(R.amount) + ' ' : '') + (many ? 'for them. ' : 'for it. ') + card]);
      if (rest && !ended) B.push(['p', 'The rest of your order goes on as usual.']);
      B.push(['facts', [orderFact]], toPage);
      return many ? page('Sorry, we couldn’t print some things', 'Sorry, we couldn’t make some things', B, env, site) : page('Sorry, we couldn’t print one thing', 'Sorry, we couldn’t make one thing', B, env, site);
    }
    case 'late': { // the delay plan (a, b, d): at the date we said, with a definite new date; waiting needs no answer
      const ls = L.filter((l) => LIVE(l) && !SHIPPED.includes(l.status) && l.reprint_of == null), whole = ls.length && !L.some((l) => LIVE(l) && SHIPPED.includes(l.status));
      B.push(['p', 'We’re sorry: we said we’d post your order by ' + (post || 'the date we gave you') + ', and ' + (whole ? 'it hasn’t gone out yet.' : 'part of it hasn’t gone out yet:')]);
      if (ls.length) B.push(['list', ls.map((l) => itemLine(l))]);
      if (num(v.late_eta) > 0) B.push(['p', 'We now expect to post ' + (whole ? 'it' : 'the late part') + ' by ' + postDay(v.late_eta) + '.']);
      B.push(['p', 'You don’t need to do anything to keep waiting: we’ll email you when it’s on its way.'],
        ['p', 'Or, if you’d rather not wait, you can cancel the late part for a full refund from your order page, any time until it’s posted.']);
      if (gift) B.push(gift);
      B.push(['facts', [orderFact]], ['button', 'Open your order page', link], ['small', 'A refund goes back to your card at once; it can take a few days to show.']);
      return page('Taking longer than we said', 'Your order is taking longer than we said', B, env, site);
    }
    case 'late_again': { // the delay plan (c): the buyer said keep waiting, and the new date passed too: no new date, still on it, cancel any time
      const ls = L.filter((l) => LIVE(l) && !SHIPPED.includes(l.status) && l.reprint_of == null), whole = ls.length && !L.some((l) => LIVE(l) && SHIPPED.includes(l.status));
      B.push(['p', 'We’re sorry: ' + (whole ? 'your order' : 'the late part of your order') + ' still hasn’t gone out' + (num(v.late_eta) > 0 ? ', and we said ' + postDay(v.late_eta) + '.' : '.')]);
      if (ls.length) B.push(['list', ls.map((l) => itemLine(l))]);
      B.push(['p', 'Thank you for waiting. We’re still on it, and we’ll email you as soon as it’s posted.'],
        ['p', 'You can still cancel the late part for a full refund from your order page, any time until it’s posted.']);
      if (gift) B.push(gift);
      B.push(['facts', [orderFact]], ['button', 'Open your order page', link], ['small', 'A refund goes back to your card at once; it can take a few days to show.']);
      return page('Still taking longer than we said', 'Still working on your order', B, env, site);
    }
    case 'reprint': {
      const n = A.reprint && A.reprint.n, ls = L.filter((l) => l.reprint_of != null && (n == null || l.rp === n)), why = A.reprint && A.reprint.why;
      B.push(['p', (why === 'lost' ? 'Sorry your parcel went missing. ' : why === 'reship' ? 'Thank you for checking your address. ' : 'Sorry it didn’t arrive as it should. ') + 'We’re making a new one for you, free:']);
      if (ls.length) B.push(['list', ls.map((l) => itemLine(l))]);
      B.push(['p', 'There’s nothing to pay. Our print partner makes it again, and we’ll email you a tracking link when it’s on its way.']);
      if (gift) B.push(gift);
      B.push(['facts', [orderFact]], toPage);
      return page('A new one is on its way', 'A new one is on its way', B, env, site);
    }
    default: // an unknown kind (never sent by the ledger): a plain note with the order link, never a blank email
      B.push(['p', 'There is news about your order.'], ['facts', [orderFact]], toPage);
      return page('About your order', 'About your order', B, env, site);
  }
}

export async function send(env, to, kind, view, key) {
  const f = fetcher(env.MAIL_FETCH);
  if (!f || !env.RESEND_API_KEY || !to) return { sent: false, why: !to ? 'no_address' : 'not_set_up' };
  const m = build(kind, view, env);
  const r = await call(f, 'https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ from: env.MAIL_FROM || 'orders@doodledoggo.app', reply_to: CONTACT, to: [to], subject: m.subject, text: m.text, html: m.html }) }, 15000);
  return { sent: !!r.ok, status: r.status, why: r.ok ? null : 'error' };
}

/* ---------------- the owner's emails (MERCH_OWNER_TO): no buyer data, only the order id, what happened and what to do ---------------- */
// reason -> [what happened, what to do, the merch.sh command (with <order>), or null]
const OWNER = {
  review: ['An order is held for you to look at.', 'Look at it; confirm it to make it, or let it be refunded when its time runs out.', 'confirm'],
  cant_make: ['A basket failed the margin guard at checkout (nothing was paid).', 'Check the printer’s costs (the nightly job reads them); prices change only by a reviewed change to catalog.js.', null],
  mail_failed: ['An email to a buyer could not be sent.', 'Write to the buyer from the Stripe dashboard (the order id is in the payment’s metadata).', 'show'],
  refund_stuck: ['A refund has not gone through for 24 hours.', 'Look at the payment in Stripe; the Worker keeps trying with the same key.', 'show'],
  refund_failed: ['A refund failed at the bank.', 'Write to the buyer (from Stripe) and refund another way.', 'show'],
  dispute: ['A payment is disputed.', 'Answer in Stripe with the tracking, the delivery scan and the print picture.', 'show'],
  dispute_won: ['A dispute was won.', 'If it was held before printing, decide: make it (confirm) or refund it.', 'confirm'],
  provider_hold: ['Our print partner put an order on hold.', 'Look in the Printful dashboard; it goes on when the hold is lifted.', 'show'],
  provider_failed: ['Our print partner failed an order after it was confirmed (a problem with the address, the print files or the charge).', 'Check the Printful wallet and dashboard. If it can go on, fix it there, then confirm it to send it again; otherwise it is refunded in full after 24 hours.', 'confirm'],
  provider_canceled: ['Our print partner cancelled an order after it was confirmed.', 'Check the Printful wallet and dashboard (was the charge returned?). A cancelled Printful order cannot be sent again: it is refunded in full after 24 hours, or refund it now.', 'show'],
  cost_missing: ['The nightly price read found no price for some of our variants.', 'Check those variant ids against the Printful catalog (catalog.js PF_VARIANT_IDS). The last known costs are kept meanwhile.', 'report'],
  provider_down: ['Our print partner has not answered for 24 hours.', 'Check Printful’s status; the Worker keeps trying.', 'show'],
  provider_reject: ['Our print partner refused part or all of an order (refunded).', 'Check the variant in Printful; it is off until the nightly check.', 'show'],
  render_reject: ['A print file could not be made, so that line was refunded.', 'Check the dog’s recipe and the print page.', 'show'],
  render_held: ['Print files have waited 2 hours or more.', 'Check Browser Run (part 4) and the print page.', 'show'],
  store_failed: ['A print file could not be stored.', 'Look at the print storage in the report.', 'report'],
  wallet: ['Printful could not charge the wallet.', 'Top up the Printful wallet; the Worker tries again every 30 minutes.', 'show'],
  cost: ['Printful’s draft costs more than we planned.', 'Confirm it, or refund it.', 'confirm'],
  auto_refund: ['An order was refunded in full when its hold ran out.', 'Nothing to do; the buyer was emailed.', 'show'],
  variant_off: ['Some variants were turned off (they fail the margin floor alone).', 'Check the printer’s costs.', 'report'],
  basket_floor: ['Some reference baskets are under the margin floor.', 'Check the printer’s costs and the zones.', 'report'],
  storage: ['Print storage is over 4 GB.', 'Old print files are being tidied; past 4.5 GB it is time for Workers Paid.', 'report'],
  report: ['The nightly report.', null, 'report'],
  stuck: ['A step failed with an error; it is tried again every 5 minutes.', 'If it keeps failing, look at the order.', 'show'],
  cancel_late: ['The late part of an order was refunded (the buyer cancelled it, or its new date passed).', 'Cancel those items in the Printful dashboard if you can.', 'show'],
  returned: ['A parcel came back to Printful.', 'Nothing is reshipped (the order is refunded, cancelled or disputed).', 'show'],
  reprint_held: ['A reprint waits (the printer mode is not live).', 'Confirm it once the mode is live.', 'confirm'],
  reprint_stopped: ['A reprint was stopped or paused.', 'Nothing to do unless a dispute ends: then confirm releases it.', 'show'],
  reprint_after_stop: ['A reprint was confirmed at Printful just as its order was refunded or disputed.', 'Cancel it in the Printful dashboard if you can.', 'show'],
  refund_after_confirm: ['An order was refunded in the Stripe dashboard after printing started.', 'Cancel it in the Printful dashboard if you can.', 'show'],
  gift_low: ['The gift code pool is nearly empty.', 'Add codes: tools/merch.sh gift add < codes.txt (one per line, from a file kept outside the repo). Without codes, orders simply come with no gift.', 'gift count'],
  gift_empty: ['The gift code pool is empty: new orders come with no gift.', 'Add codes: tools/merch.sh gift add < codes.txt (one per line, from a file kept outside the repo).', 'gift count']
};
export function ownerBuild(env, orderId, reason, note) {
  const o = OWNER[reason] || ['Something needs a look.', null, orderId ? 'show' : null], id = orderId || null;
  const cmd = o[2] ? 'tools/merch.sh ' + o[2] + (o[2] === 'show' || o[2] === 'confirm' ? (id ? ' ' + id : '') : '') : null;
  const usable = cmd && !((o[2] === 'show' || o[2] === 'confirm') && !id);
  const parts = ['What happened: ' + o[0], 'Order: ' + (id || '-')];
  if (note && String(note) !== reason) parts.push((reason === 'report' ? '' : 'Details: ') + String(note));
  if (o[1]) parts.push('What to do: ' + o[1]);
  if (usable) parts.push('Command: ' + cmd);
  if (id) parts.push('Order page (what the buyer sees): ' + orderLink(siteOf(env), id));
  return { subject: 'Merch: ' + o[0].replace(/[.:]\s.*$|\.$/, '') + ' [' + reason + ']' + (id ? ' ' + id : ''), text: parts.join('\n\n') + '\n' };
}
// the nightly report as readable lines (no buyer data and no gift codes: counts, order ids, amounts)
export function reportText(rep) {
  const r = rep || {}, ids = (a, f) => (Array.isArray(a) && a.length ? a.map(f || ((x) => (typeof x === 'string' ? x : x.id))).join(', ') : 'none');
  const g = r.gift || {}, st = r.storage || {}, lg = r.ledger || {};
  return ['Day (JST): ' + r.day,
    'Orders today: ' + (Array.isArray(r.orders_today) && r.orders_today.length ? r.orders_today.map((x) => x.country + ' ' + x.n + ' (' + usd(x.total) + ')').join(', ') : 'none'),
    'Held: ' + ids(r.held, (x) => x.id + ' (' + x.hold + (x.why ? '/' + x.why : '') + ')'),
    'Draft mode: ' + ids(r.draft_mode), 'Without a wake (should be none): ' + ids(r.stranded, (x) => x.id + ' (' + x.status + ')'),
    'Disputes: ' + ids(r.disputes, (x) => x.id + ' (' + x.dispute + ')'), 'Refunds failed at the bank: ' + ids(r.refund_failed),
    'Dashboard refunds not tied to a line: ' + ids(r.unassigned_refunds, (x) => x.order_id + ' ' + usd(x.amount)),
    'Emails that could not be sent: ' + ids(r.mail_failed, (x) => x.order_id + ' ' + x.kind), 'Reprints waiting: ' + ids(r.reprints_waiting, (x) => x.id + ' (' + x.status + ')'),
    'Margin under the floor: ' + ids(r.margin_low, (x) => x.order_id), 'Variants off: ' + ids(r.variants_off),
    'Gift codes: ' + num(g.left) + ' left, ' + num(g.claimed) + ' given',
    'Print storage: ' + (num(st.bytes) / 1048576).toFixed(1) + ' MB in ' + num(st.shards) + ' shards; ledger writes today ' + num(lg.writes_today) + ' of ' + num(lg.writes_free_a_day),
    'Sales, last 12 months: ' + (Array.isArray(r.sales_12m) && r.sales_12m.length ? r.sales_12m.map((x) => x.country + ' ' + x.n + ' (' + usd(x.net) + ')').join(', ') : 'none')].join('\n');
}
// key: the outbox row's id, which carries the JST day (one mail per order, reason and day; the nightly report never collides with yesterday's)
export async function owner(env, orderId, reason, note, key) {
  const f = fetcher(env.MAIL_FETCH);
  if (!f || !env.RESEND_API_KEY || !env.MERCH_OWNER_TO) return { sent: false, why: 'not_set_up' };
  const m = ownerBuild(env, orderId, reason, note);
  const r = await call(f, 'https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': key || 'mo_owner_' + orderId + '_' + reason },
    body: JSON.stringify({ from: env.MAIL_FROM || 'orders@doodledoggo.app', to: [env.MERCH_OWNER_TO], subject: m.subject, text: m.text }) }, 15000);
  return { sent: !!r.ok, why: r.ok ? null : 'error' };
}
