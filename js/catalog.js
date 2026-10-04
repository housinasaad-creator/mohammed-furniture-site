/*
  كتالوج المنتجات: تعريف الخيارات وقواعد السعر (مشتركة بين الواجهة والسلة). علامة وهمية: الأسعار للتجربة.
*/
import { WOODS, FABRICS, STONES } from './gl/data.js';

export const ORDER = ['sofa', 'chair', 'coffee', 'table', 'dchair', 'bed'];

/* مجموعات الخيارات لكل منتج. where: 'opts' (يغيّر الهندسة) أو 'sel' (يغيّر المادة) */
export const OPTIONS = {
  sofa: [
    { key: 'seats', where: 'opts', type: 'chips', values: [2, 3, 4], fmt: 'seats' },
    { key: 'fabric', where: 'sel', type: 'swatch', list: FABRICS },
    { key: 'wood', where: 'sel', type: 'swatch', list: WOODS, label: 'legs' }
  ],
  chair: [
    { key: 'fabric', where: 'sel', type: 'swatch', list: FABRICS },
    { key: 'wood', where: 'sel', type: 'swatch', list: WOODS, label: 'legs' }
  ],
  coffee: [
    { key: 'size', where: 'opts', type: 'chips', values: [1, 2], fmt: 'orbe' },
    { key: 'stone', where: 'sel', type: 'swatch', list: STONES, label: 'top' },
    { key: 'wood', where: 'sel', type: 'swatch', list: WOODS, label: 'base' }
  ],
  table: [
    { key: 'length', where: 'opts', type: 'chips', values: [1.8, 2.2, 2.6], fmt: 'len' },
    { key: 'top', where: 'opts', type: 'chips', values: ['wood', 'stone'], fmt: 'top' },
    { key: 'stone', where: 'sel', type: 'swatch', list: STONES, label: 'marble', showIf: (p) => p.opts.top === 'stone' },
    { key: 'wood', where: 'sel', type: 'swatch', list: WOODS, label: 'wood' }
  ],
  dchair: [
    { key: 'fabric', where: 'sel', type: 'swatch', list: FABRICS },
    { key: 'wood', where: 'sel', type: 'swatch', list: WOODS, label: 'frame' }
  ],
  bed: [
    { key: 'size', where: 'opts', type: 'chips', values: [1.6, 1.8, 2.0], fmt: 'bed' },
    { key: 'fabric', where: 'sel', type: 'swatch', list: FABRICS, label: 'headboard' },
    { key: 'wood', where: 'sel', type: 'swatch', list: WOODS, label: 'frame' }
  ]
};

const FAB_D = { ivory: 0, sand: 0, char: 0, emerald: 160, rust: 160, cognac: 640 };
const WOOD_D = { walnut: 120, oak: 0, smoked: 60, ebony: 90 };
const STONE_D = { carrara: 0, nero: 140, verde: 220, travertine: 60 };

/* السعر للقطعة الواحدة بحسب الإعداد الحالي */
export function unitPrice(id, p) {
  const o = p.opts, s = p.sel;
  let v = 0;
  switch (id) {
    case 'sofa': v = { 2: 1990, 3: 2490, 4: 2990 }[o.seats] + FAB_D[s.fabric] + WOOD_D[s.wood] * 0.4; break;
    case 'chair': v = 1190 + FAB_D[s.fabric] * 0.6 + WOOD_D[s.wood] * 0.3; break;
    case 'coffee': v = (o.size === 2 ? 990 : 790) + STONE_D[s.stone] + WOOD_D[s.wood] * 0.5; break;
    case 'table': v = { 1.8: 2490, 2.2: 2890, 2.6: 3390 }[o.length] + WOOD_D[s.wood] * 1.4 + (o.top === 'stone' ? 900 + STONE_D[s.stone] * 2 : 0); break;
    case 'dchair': v = 390 + FAB_D[s.fabric] * 0.35 + WOOD_D[s.wood] * 0.4; break;
    case 'bed': v = { 1.6: 2490, 1.8: 2890, 2.0: 3290 }[o.size] + FAB_D[s.fabric] * 1.2 + WOOD_D[s.wood] * 1.0; break;
    default: v = 0;
  }
  return Math.round(v / 10) * 10;
}

/* وصف الإعداد (للسلة) */
export function configLabel(id, p, lang) {
  const o = p.opts, s = p.sel, pick = (arr, k) => { const it = arr.find((x) => x.id === k) || arr[0]; return it[lang] || it.en; };
  const parts = [];
  if (id === 'sofa') parts.push(lang === 'ar' ? `${o.seats} مقاعد` : `${o.seats} seats`);
  if (id === 'coffee') parts.push(o.size === 2 ? (lang === 'ar' ? 'قطر ١١٠' : 'Ø 110') : (lang === 'ar' ? 'قطر ٩٠' : 'Ø 90'));
  if (id === 'table') parts.push(`${o.length} m`);
  if (id === 'bed') parts.push(`${Math.round(o.size * 100)} × 200`);
  if (s.fabric) parts.push(pick(FABRICS, s.fabric));
  if (id === 'table' && o.top === 'stone') parts.push(pick(STONES, s.stone));
  if (id === 'coffee') parts.push(pick(STONES, s.stone));
  if (s.wood) parts.push(pick(WOODS, s.wood));
  return parts.join(' · ');
}
