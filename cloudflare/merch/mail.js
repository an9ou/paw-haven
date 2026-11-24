// The email seam (Resend). Texts are placeholders: part 6 writes the real ones. Talks only through env.MAIL_FETCH; without it (or without
// RESEND_API_KEY) nothing is sent and the answer says so. The buyer's address is passed in by the caller, read from the Stripe session at send
// time: it is never stored here.
import { fetcher, call } from './util.js';

export const TEXTS = {
  thanks: ['Thank you for your order', 'Thank you! We’ll start printing soon. You can cancel within 1 hour of paying, from your order page.'],
  address: ['We need your address', 'We couldn’t send to this address. Please check it on your order page.'],
  ship: ['On its way', 'A parcel from your order is on its way.'],
  cancelled: ['Cancelled', 'Your order is cancelled. Your refund is on its way.'],
  refunded: ['Refunded', 'We’ve refunded part of your order.'],
  reject: ['Sorry, we couldn’t print one thing', 'Sorry, we couldn’t print one thing in your order. We’ve refunded it. The rest is on its way.'],
  late: ['Taking longer than we said', 'Your order is taking longer than we said. You can wait, or cancel the late part for a full refund, from your order page.'],
  reprint: ['A new one is on its way', 'A new one is on its way.']
};

export async function send(env, to, kind, orderId, key, extra) {
  const f = fetcher(env.MAIL_FETCH);
  if (!f || !env.RESEND_API_KEY || !to) return { sent: false, why: !to ? 'no_address' : 'not_set_up' };
  const t = TEXTS[kind] || [kind, extra || ''];
  const link = (env.MERCH_SITE || 'https://doodledoggo.app') + '/merch/order/' + orderId;
  const r = await call(f, 'https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ from: env.MAIL_FROM || 'orders@doodledoggo.app', reply_to: 'contact@doodledoggo.app', to: [to], subject: t[0], text: t[1] + (extra && TEXTS[kind] ? '\n\n' + extra : '') + '\n\n' + link }) }, 15000);
  return { sent: !!r.ok, status: r.status };
}
// one owner email (MERCH_OWNER_TO): no buyer data in it, only the order id, the reason and a short note
export async function owner(env, orderId, reason, note) {
  const f = fetcher(env.MAIL_FETCH);
  if (!f || !env.RESEND_API_KEY || !env.MERCH_OWNER_TO) return { sent: false, why: 'not_set_up' };
  const r = await call(f, 'https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'mo_owner_' + orderId + '_' + reason },
    body: JSON.stringify({ from: env.MAIL_FROM || 'orders@doodledoggo.app', to: [env.MERCH_OWNER_TO], subject: 'Merch: ' + reason + ' ' + (orderId || ''), text: String(note || reason) }) }, 15000);
  return { sent: !!r.ok };
}
