/*
  بيانات المواد والأنماط (مشتركة بين المشهد والواجهة). الألوان تدرّج (داكن → فاتح) فوق خامة رمادية.
*/
export const WOODS = [
  { id: 'walnut', en: 'American Walnut', ar: 'جوز أمريكي', tr: 'Amerikan cevizi', c0: '#1b120b', c1: '#6a4b35', rough: 0.42, fig: 0.7, sw: '#4a2a17' },
  { id: 'oak', en: 'Natural Oak', ar: 'سنديان طبيعي', tr: 'Doğal meşe', c0: '#a8763f', c1: '#e8c590', rough: 0.5, fig: 0.2, sw: '#cf9f66' },
  { id: 'smoked', en: 'Smoked Oak', ar: 'سنديان مدخّن', tr: 'Füme meşe', c0: '#2f1c10', c1: '#7b5232', rough: 0.45, fig: 0.35, sw: '#5a3a24' },
  { id: 'ebony', en: 'Black Ash', ar: 'زان أسود', tr: 'Siyah dişbudak', c0: '#070707', c1: '#34302b', rough: 0.4, fig: 0.15, sw: '#1c1a18' }
];

export const FABRICS = [
  { id: 'ivory', kind: 'boucle', en: 'Ivory Bouclé', ar: 'بوكليه عاجي', tr: 'Fildişi bukle', c0: '#a99781', c1: '#fffaf0', rough: 0.96, sheen: 0.45, sw: '#efe6d4', bump: 2.4 },
  { id: 'sand', kind: 'linen', en: 'Sand Linen', ar: 'كتّان رملي', tr: 'Kum keten', c0: '#8f7c61', c1: '#e8d9bd', rough: 0.95, sheen: 0.3, sw: '#cdbb9a', bump: 1.6 },
  { id: 'emerald', kind: 'velvet', en: 'Emerald Velvet', ar: 'قطيفة زمردية', tr: 'Zümrüt kadife', c0: '#05291d', c1: '#24895f', rough: 0.85, sheen: 1.0, sheenC: '#7fe0b4', sw: '#14573f', bump: 0.4 },
  { id: 'rust', kind: 'velvet', en: 'Terracotta Velvet', ar: 'قطيفة طينية', tr: 'Kiremit kadife', c0: '#4b1a0c', c1: '#c0623a', rough: 0.85, sheen: 1.0, sheenC: '#ffb08a', sw: '#9a4528', bump: 0.4 },
  { id: 'cognac', kind: 'leather', en: 'Cognac Leather', ar: 'جلد كونياك', tr: 'Konyak deri', c0: '#3a1a0a', c1: '#b06a30', rough: 0.52, sheen: 0.2, cc: 0.12, sw: '#8a4a22', bump: 1.2 },
  { id: 'char', kind: 'boucle', en: 'Charcoal Bouclé', ar: 'بوكليه فحمي', tr: 'Antrasit bukle', c0: '#17171a', c1: '#5d5d63', rough: 0.96, sheen: 0.5, sw: '#38383d', bump: 2.4 }
];

export const STONES = [
  { id: 'carrara', en: 'Carrara Marble', ar: 'رخام كرارا', tr: 'Carrara mermer', c0: '#80838a', c1: '#f4f2ee', sw: '#e9e6e0' },
  { id: 'nero', en: 'Nero Marquina', ar: 'رخام أسود', tr: 'Nero Marquina', c0: '#e7dcc0', c1: '#121212', sw: '#1a1a1a' },
  { id: 'verde', en: 'Verde Alpi', ar: 'رخام أخضر', tr: 'Verde Alpi', c0: '#d4ddd2', c1: '#244636', sw: '#2f5a45' },
  { id: 'travertine', en: 'Travertine', ar: 'ترافرتين', tr: 'Traverten', c0: '#b09878', c1: '#eadcc3', sw: '#dccaa8' }
];

export const METALS = {
  brass: { c: '#cba24f', rough: 0.24 },
  black: { c: '#161514', rough: 0.45 },
  steel: { c: '#c9ccd0', rough: 0.18 }
};

/* الأنماط: ألوان الجدران لكل منطقة (مدخل/صالون/سفرة/نوم) + الأرضية + القماش الافتراضي */
export const STYLES = [
  {
    id: 'sand', en: 'Sand', ar: 'رمل', tr: 'Kum', accent: '#c29a52', metal: 'brass',
    walls: ['#b4a894', '#e2d4ba', '#c28d70', '#8d9d94'], floor: ['#8f7a5a', '#dccdb0'], rug: ['#8a755a', '#e9dcc3'], curtain: ['#a99a82', '#efe5d2'],
    defaults: { sofa: { fabric: 'ivory', wood: 'walnut' }, chair: { fabric: 'sand', wood: 'walnut' }, coffee: { stone: 'carrara' }, table: { wood: 'walnut', top: 'wood' }, dchair: { fabric: 'sand', wood: 'walnut' }, bed: { fabric: 'ivory', wood: 'walnut' } }
  },
  {
    id: 'oasis', en: 'Oasis', ar: 'واحة', tr: 'Vaha', accent: '#8fb08a', metal: 'brass',
    walls: ['#7d8a6e', '#a3b08f', '#6f8466', '#4f6852'], floor: ['#9d9677', '#e3dcc0'], rug: ['#6d7a5e', '#d4d9bd'], curtain: ['#8d9a7d', '#e6ead8'],
    defaults: { sofa: { fabric: 'emerald', wood: 'oak' }, chair: { fabric: 'ivory', wood: 'oak' }, coffee: { stone: 'verde' }, table: { wood: 'oak', top: 'wood' }, dchair: { fabric: 'emerald', wood: 'oak' }, bed: { fabric: 'sand', wood: 'oak' } }
  },
  {
    id: 'noir', en: 'Noir', ar: 'ليل', tr: 'Gece', accent: '#e0b35e', metal: 'brass',
    walls: ['#232220', '#2d2a27', '#2a2220', '#1d2123'], floor: ['#1e1d1b', '#4d4943'], rug: ['#2a2724', '#5a544c'], curtain: ['#2b2926', '#58534b'],
    defaults: { sofa: { fabric: 'cognac', wood: 'ebony' }, chair: { fabric: 'char', wood: 'ebony' }, coffee: { stone: 'nero' }, table: { wood: 'ebony', top: 'stone', stone: 'nero' }, dchair: { fabric: 'cognac', wood: 'ebony' }, bed: { fabric: 'char', wood: 'ebony' } }
  },
  {
    id: 'rose', en: 'Clay Rosé', ar: 'وردي طيني', tr: 'Kil pembesi', accent: '#d38a6d', metal: 'brass',
    walls: ['#b9948a', '#d9b3a1', '#c58d78', '#946560'], floor: ['#b39a84', '#f0e0cf'], rug: ['#a6786c', '#ecd2c4'], curtain: ['#c9a597', '#f4e3d8'],
    defaults: { sofa: { fabric: 'rust', wood: 'smoked' }, chair: { fabric: 'ivory', wood: 'smoked' }, coffee: { stone: 'travertine' }, table: { wood: 'smoked', top: 'wood' }, dchair: { fabric: 'rust', wood: 'smoked' }, bed: { fabric: 'rust', wood: 'smoked' } }
  }
];

export const byId = (arr, id) => arr.find((x) => x.id === id) || arr[0];
