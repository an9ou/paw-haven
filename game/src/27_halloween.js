/* ======================= v2.6 HALLOWEEN lane (tag hw): Halloween 2026, the Pumpkin Patch Pop-up. See V26.md sections 1 and 7 =======================
   The HALLOWEEN lane owns this file (and css/30_halloween.css). The coordinator's stub only holds hwTag, used by the Feed and Play trays, the Wardrobe,
   the yard decor list and the Journal. Dates and the shop gate (HW_ED, HW_WIN, jstISO, hwShopOpen) live in 00_core.js. */

// the "2026" tag for an edition item (any of FOOD, TOYS, CLOTHES, HM_DECOR with `ed`), else '' so old items render exactly as before
function hwTag(name) {
  const it = FOOD.find((x) => x.n === name) || TOYS.find((x) => x.n === name) || CLOTHES.find((x) => x.n === name) || HM_DECOR[name];
  return it && it.ed ? `<span class="hw-tag">${it.ed}</span>` : '';
}
