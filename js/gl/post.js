/*
  المعالجة اللاحقة: رسم المشهد إلى هدف HDR (MSAA) ثم تألّق (bloom) بسلسلة تصغير/تكبير مزدوجة،
  ثم تركيب نهائي: ACES + تدرّج لوني + فينييت + حبيبات فيلم + تعتيم الدخول.
*/
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main(){ vUv = position.xy*.5+.5; gl_Position = vec4(position.xy,0.,1.); }';

const DOWN = `
varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uFirst; uniform float uThr; uniform float uKnee;
vec3 prefilter(vec3 c){ float l = max(c.r, max(c.g, c.b)); float s = clamp((l - uThr + uKnee) / (2.*uKnee + 1e-4), 0., 1.); s = s*s*uKnee; float w = max(s, l - uThr) / max(l, 1e-4); return c * w; }
void main(){
  vec3 a = texture2D(tSrc, vUv + uTexel*vec2(-1.,-1.)).rgb, b = texture2D(tSrc, vUv + uTexel*vec2(1.,-1.)).rgb;
  vec3 c = texture2D(tSrc, vUv + uTexel*vec2(-1.,1.)).rgb,  d = texture2D(tSrc, vUv + uTexel*vec2(1.,1.)).rgb;
  vec3 o;
  if (uFirst > .5) {
    a = min(a, vec3(40.)); b = min(b, vec3(40.)); c = min(c, vec3(40.)); d = min(d, vec3(40.));
    float wa = 1./(1.+dot(a, vec3(.2126,.7152,.0722))), wb = 1./(1.+dot(b, vec3(.2126,.7152,.0722))), wc = 1./(1.+dot(c, vec3(.2126,.7152,.0722))), wd = 1./(1.+dot(d, vec3(.2126,.7152,.0722)));
    o = (prefilter(a)*wa + prefilter(b)*wb + prefilter(c)*wc + prefilter(d)*wd) / (wa+wb+wc+wd);
  } else o = (a+b+c+d)*.25;
  gl_FragColor = vec4(o, 1.);
}`;
const UP = `
varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uK;
void main(){
  vec3 s = texture2D(tSrc, vUv + uTexel*vec2(-1.,0.)).rgb*2. + texture2D(tSrc, vUv + uTexel*vec2(1.,0.)).rgb*2. + texture2D(tSrc, vUv + uTexel*vec2(0.,-1.)).rgb*2. + texture2D(tSrc, vUv + uTexel*vec2(0.,1.)).rgb*2.
        + texture2D(tSrc, vUv + uTexel*vec2(-1.,-1.)).rgb + texture2D(tSrc, vUv + uTexel*vec2(1.,-1.)).rgb + texture2D(tSrc, vUv + uTexel*vec2(-1.,1.)).rgb + texture2D(tSrc, vUv + uTexel*vec2(1.,1.)).rgb;
  gl_FragColor = vec4(s/12.*uK, 1.);
}`;
const COMP = `
varying vec2 vUv; uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uBloom; uniform float uExposure; uniform float uVig; uniform float uGrain; uniform float uTime; uniform float uFade; uniform vec3 uTint; uniform float uSat; uniform vec2 uRes; uniform float uContrast;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec3 toSrgb(vec3 c){ return mix(c*12.92, 1.055*pow(max(c,0.), vec3(1./2.4)) - .055, step(.0031308, c)); }
void main(){
  vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
  c *= uExposure * uTint;
  c = aces(c);
  float l = dot(c, vec3(.2126,.7152,.0722)); c = mix(vec3(l), c, uSat);
  c = (c - .5) * uContrast + .5;
  vec2 q = vUv - .5; q.x *= uRes.x/uRes.y;
  float v = 1. - uVig * smoothstep(.25, 1.0, length(q));
  c *= v;
  c = toSrgb(clamp(c, 0., 1.));
  float g = hash(gl_FragCoord.xy + fract(uTime)*91.7) - .5;
  c += g * uGrain + (hash(gl_FragCoord.xy*1.37) - .5)/255.;
  c *= uFade;
  gl_FragColor = vec4(c, 1.);
}`;

export class Post {
  constructor(renderer, mobile) {
    this.r = renderer; this.mobile = !!mobile;
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); this.quad.frustumCulled = false; this.scene.add(this.quad);
    this.down = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DOWN, depthTest: false, depthWrite: false, uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 }, uThr: { value: 1.0 }, uKnee: { value: 0.5 } } });
    this.up = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: UP, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uK: { value: 1 } } });
    this.comp = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: COMP, depthTest: false, depthWrite: false,
      uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: 0.5 }, uExposure: { value: 1 }, uVig: { value: 0.32 }, uGrain: { value: 0.028 }, uTime: { value: 0 }, uFade: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1.05 }, uRes: { value: new THREE.Vector2(1, 1) }, uContrast: { value: 1.03 } }
    });
    this.levels = mobile ? 4 : 5;
    this.rts = []; this.sceneRT = null; this.w = 0; this.h = 0;
  }
  resize(w, h, dpr) {
    const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
    this.W = W; this.H = H;
    if (this.sceneRT) this.sceneRT.dispose();
    const hf = this.r.extensions.has('EXT_color_buffer_float') || this.r.extensions.has('EXT_color_buffer_half_float');
    this.hfType = hf ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, { type: this.hfType, samples: this.mobile ? 2 : 4, depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.sceneRT.texture.colorSpace = THREE.LinearSRGBColorSpace;
    for (const t of this.rts) t.dispose();
    this.rts = [];
    let bw = W >> 1, bh = H >> 1;
    for (let i = 0; i < this.levels; i++) {
      this.rts.push(new THREE.WebGLRenderTarget(Math.max(2, bw), Math.max(2, bh), { type: this.hfType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }));
      bw >>= 1; bh >>= 1;
    }
    this.comp.uniforms.uRes.value.set(W, H);
  }
  bloom() {
    const r = this.r, R = this.rts;
    this.quad.material = this.down;
    let src = this.sceneRT.texture, sw = this.W, sh = this.H;
    for (let i = 0; i < R.length; i++) {
      const u = this.down.uniforms; u.tSrc.value = src; u.uTexel.value.set(1 / sw, 1 / sh); u.uFirst.value = i === 0 ? 1 : 0;
      r.setRenderTarget(R[i]); r.render(this.scene, this.cam);
      src = R[i].texture; sw = R[i].width; sh = R[i].height;
    }
    this.quad.material = this.up;
    for (let i = R.length - 2; i >= 0; i--) {
      const u = this.up.uniforms; u.tSrc.value = R[i + 1].texture; u.uTexel.value.set(1 / R[i + 1].width, 1 / R[i + 1].height);
      r.setRenderTarget(R[i]); r.autoClear = false; r.render(this.scene, this.cam); r.autoClear = true;
    }
  }
  composite(time, o = {}) {
    const r = this.r, u = this.comp.uniforms;
    u.tScene.value = this.sceneRT.texture; u.tBloom.value = this.rts[0].texture; u.uTime.value = time;
    if (o.bloom !== undefined) u.uBloom.value = o.bloom;
    if (o.exposure !== undefined) u.uExposure.value = o.exposure;
    if (o.fade !== undefined) u.uFade.value = o.fade;
    if (o.tint) u.uTint.value.set(o.tint[0], o.tint[1], o.tint[2]);
    this.quad.material = this.comp;
    r.setRenderTarget(null); r.render(this.scene, this.cam);
  }
}
