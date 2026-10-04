/*
  توليد الخامات على كرت الشاشة (GPU): خشب، جص، حجر الترافرتين، أقمشة، جلد، رخام، صوف.
  كل خامة قناة واحدة (R) تُحوَّل لونياً بخريطة تدرّج داخل الشيدر، فيتغيّر اللون فوراً بلا إعادة توليد.
  أزواج (map, bump). الضرب دورية (tileable) بترددات صحيحة.
*/
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = position.xy*.5+.5; gl_Position = vec4(position.xy,0.,1.); }';

const COMMON = `
precision highp float;
varying vec2 vUv;
uniform float uSeed;
uniform float uMode; // 0 = albedo, 1 = bump
const float PI = 3.14159265;
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vn(vec2 p, vec2 P){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=h21(mod(i,P)), b=h21(mod(i+vec2(1.,0.),P)), c=h21(mod(i+vec2(0.,1.),P)), d=h21(mod(i+vec2(1.,1.),P));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm(vec2 p, vec2 P, int oct){ float s=0., a=.5; for(int i=0;i<6;i++){ if(i>=oct) break; s+=a*vn(p,P); p*=2.; P*=2.; a*=.5; } return s; }
vec2 worley(vec2 p, vec2 P){ vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=h22(mod(i+g,P)+uSeed); vec2 r=g+o-f; float d=dot(r,r); if(d<d1){ d2=d1; d1=d; } else if(d<d2){ d2=d; } }
  return sqrt(vec2(d1,d2)); }
`;

const FRAG = {
  /* خشب: u على طول الألياف، v عبرها. uFig = شدة تعرّج الألياف */
  wood: `
uniform float uFig;
void main(){
  vec2 uv = vUv + vec2(uSeed*.173, uSeed*.311);
  float u=uv.x, v=uv.y;
  float w1 = fbm(vec2(u*2., v*8.), vec2(2.,8.), 4);
  float w2 = fbm(vec2(u*1., v*3.), vec2(1.,3.), 3);
  float rings = v*7. + (w1-.5)*(2.2+uFig*3.5) + (w2-.5)*(1.4+uFig*2.5);
  float f = fract(rings);
  float late = smoothstep(.0,.92,f); late *= late;
  float edge = smoothstep(.93,1.,f);
  float fine = fbm(vec2(u*3., v*200.), vec2(3.,200.), 3);
  float por = smoothstep(.70,.82, vn(vec2(u*150., v*64.), vec2(150.,64.)));
  float fleck = smoothstep(.62,.9, vn(vec2(u*4., v*40.), vec2(4.,40.)));
  float a = .50 + .30*late - .20*edge + .26*(fine-.5) - .26*por + .08*fleck;
  float b = .5 + .25*(fine-.5) - .38*por + .12*late;
  float o = uMode < .5 ? a : b;
  gl_FragColor = vec4(vec3(clamp(o,0.,1.)),1.);
}`,
  /* جص كلسي (lime wash): سحب سحب + أثر المالج */
  plaster: `
void main(){
  vec2 uv = vUv + uSeed*.137;
  float n = fbm(uv*3., vec2(3.), 5);
  float m = fbm(uv*vec2(7.,2.)+4., vec2(7.,2.), 4);
  float t = fbm(vec2(uv.x*2.+uv.y*5., uv.y*3.-uv.x*4.), vec2(2.,3.), 3);
  float fine = fbm(uv*90., vec2(90.), 2);
  float a = .55 + (n-.5)*.9 + (m-.5)*.35 + (t-.5)*.25;
  float b = .5 + (fine-.5)*.5 + (m-.5)*.5 + (n-.5)*.3;
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:b,0.,1.)),1.);
}`,
  /* ترافرتين: ببلاط 2×2 مع فواصل وبقع وعروق أفقية */
  travertine: `
void main(){
  vec2 g = vUv*2.;
  vec2 id = floor(g), l = fract(g);
  float tid = h21(id+uSeed);
  vec2 q = l + vec2(tid*13.7, tid*7.1);
  float edge = min(min(l.x,1.-l.x), min(l.y,1.-l.y));
  float grout = 1. - smoothstep(.0035,.0075, edge);
  float warp = fbm(q*vec2(2.,3.), vec2(64.), 4);
  float bands = sin((q.y*14. + warp*4.)*PI)*.5+.5;
  float cloud = fbm(q*2.5+3., vec2(64.), 5);
  float pit = smoothstep(.76,.88, fbm(vec2(q.x*24., q.y*80.), vec2(512.), 3)*1.45);
  float pit2 = smoothstep(.80,.9, vn(vec2(q.x*70., q.y*190.), vec2(1024.)));
  float a = .62 + (cloud-.5)*.5 + (bands-.5)*.14 + (tid-.5)*.12 - pit*.30 - pit2*.12;
  float b = .8 - pit*.55 - pit2*.3 + (cloud-.5)*.1;
  a = mix(a, .06, grout); b = mix(b, 0., grout);
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:b,0.,1.)),1.);
}`,
  /* بوكليه: حلقات صغيرة */
  boucle: `
void main(){
  vec2 uv = vUv + uSeed*.211;
  vec2 w1 = worley(uv*34., vec2(34.));
  vec2 w2 = worley(uv*57.+11., vec2(57.));
  float l1 = 1. - smoothstep(.0,.62,w1.x), l2 = 1. - smoothstep(.0,.55,w2.x);
  float ring = smoothstep(.18,.42,w1.y-w1.x);
  float n = fbm(uv*18., vec2(18.), 3);
  float h = clamp(l1*.65 + l2*.45 + ring*.2 + (n-.5)*.35, 0., 1.);
  float a = .30 + .65*h;
  gl_FragColor = vec4(vec3(uMode<.5?a:h), 1.);
}`,
  /* قطيفة */
  velvet: `
void main(){
  vec2 uv = vUv + uSeed*.17;
  float n = fbm(uv*220., vec2(220.), 3);
  float m = fbm(uv*9., vec2(9.), 4);
  float a = .72 + (n-.5)*.22 + (m-.5)*.34;
  float b = .5 + (n-.5)*.45;
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:b,0.,1.)),1.);
}`,
  /* كتّان: نسيج متشابك وعُقد */
  linen: `
void main(){
  vec2 uv = vUv + uSeed*.09;
  vec2 t = uv*72.;
  vec2 ti = floor(t), tf = fract(t);
  float over = mod(ti.x+ti.y, 2.);
  float slubU = vn(vec2(ti.x*1.7, uv.y*7.), vec2(72.*1.7, 7.));
  float slubV = vn(vec2(ti.y*1.7, uv.x*7.), vec2(72.*1.7, 7.));
  float thH = sin(tf.y*PI), thV = sin(tf.x*PI);
  float hgt = over<.5 ? thH*(.7+.5*slubU) : thV*(.7+.5*slubV);
  float tone = over<.5 ? slubU : slubV;
  float n = fbm(uv*12., vec2(12.), 3);
  float a = .42 + .38*hgt + (tone-.5)*.22 + (n-.5)*.16;
  float b = hgt;
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:b,0.,1.)),1.);
}`,
  /* جلد: حبيبات ناعمة (بدون تجاعيد) */
  leather: `
void main(){
  vec2 uv = vUv + uSeed*.31;
  vec2 w = worley(uv*62., vec2(62.));
  float cell = smoothstep(.0,.2, w.y-w.x);
  float pebble = 1. - smoothstep(.0,1.0,w.x);
  float wr = fbm(uv*vec2(4.,3.), vec2(4.,3.), 4);
  float a = .66 + (cell-.5)*.16 + (pebble-.5)*.12 + (wr-.5)*.18;
  float b = cell*.75 + pebble*.25;
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:b,0.,1.)),1.);
}`,
  /* صوف السجاد */
  wool: `
void main(){
  vec2 uv = vUv + uSeed*.23;
  float n = fbm(uv*vec2(160.,160.), vec2(160.), 4);
  float c = vn(uv*vec2(40.,40.), vec2(40.));
  float m = fbm(uv*6., vec2(6.), 4);
  float a = .55 + (n-.5)*.7 + (c-.5)*.25 + (m-.5)*.3;
  float b = .5 + (n-.5)*.9 + (c-.5)*.3;
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:b,0.,1.)),1.);
}`,
  /* رخام: عروق مشوّهة. R=1 قاعدة، R=0 عرق */
  marble: `
void main(){
  vec2 p = vUv + uSeed*.07;
  float w  = fbm(p*3., vec2(3.), 5);
  float w2 = fbm(p*6.+7., vec2(6.), 4);
  float x1 = p.x*2. + p.y*1. + (w-.5)*1.7;
  float x2 = p.x*1. - p.y*3. + (w2-.5)*2.2;
  float v1 = pow(1. - abs(sin(x1*PI)), 22.);
  float v2 = pow(1. - abs(sin(x2*PI)), 38.);
  float v3 = pow(1. - abs(sin((p.x*5.+p.y*4.+(w2-.5)*3.)*PI)), 60.)*.7;
  float cloud = fbm(p*8.+3., vec2(8.), 4);
  float vein = clamp(v1*.8 + v2*.9 + v3 + (w-.5)*.12, 0., 1.);
  float a = 1. - vein*.92 - (cloud-.5)*.1;
  gl_FragColor = vec4(vec3(clamp(uMode<.5?a:.5,0.,1.)),1.);
}`
};

export class TexGen {
  constructor(renderer, scale = 1) {
    this.r = renderer; this.scale = scale; this.cache = new Map();
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); this.quad.frustumCulled = false; this.scene.add(this.quad);
    this.mats = {};
  }
  _mat(kind) {
    if (this.mats[kind]) return this.mats[kind];
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: COMMON + FRAG[kind], depthTest: false, depthWrite: false,
      uniforms: { uSeed: { value: 0 }, uMode: { value: 0 }, uFig: { value: 0 } }
    });
    return (this.mats[kind] = m);
  }
  /* يرجع {map, bump}. size: [w,h] بالبكسل (يُضرب بعامل الجودة). */
  make(kind, size = [1024, 1024], opts = {}) {
    const key = kind + '|' + size.join('x') + '|' + (opts.seed || 0) + '|' + (opts.fig || 0) + '|' + (opts.bump === false ? 0 : 1);
    if (this.cache.has(key)) return this.cache.get(key);
    const w = Math.max(64, Math.round(size[0] * this.scale)), h = Math.max(64, Math.round(size[1] * this.scale));
    const mat = this._mat(kind); this.quad.material = mat;
    mat.uniforms.uSeed.value = opts.seed || 0; mat.uniforms.uFig.value = opts.fig || 0;
    const out = {};
    const prev = this.r.getRenderTarget();
    for (const mode of opts.bump === false ? [0] : [0, 1]) {
      const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
      rt.texture.colorSpace = THREE.NoColorSpace;
      rt.texture.anisotropy = Math.min(8, this.r.capabilities.getMaxAnisotropy());
      mat.uniforms.uMode.value = mode;
      this.r.setRenderTarget(rt); this.r.render(this.scene, this.cam);
      out[mode ? 'bump' : 'map'] = rt.texture;
    }
    this.r.setRenderTarget(prev);
    this.cache.set(key, out);
    return out;
  }
}
