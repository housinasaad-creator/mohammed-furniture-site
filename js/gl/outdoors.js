/*
  ما وراء النوافذ: قبّة سماء (شمس/قمر/نجوم/غيوم/تلال) تلحق الكاميرا، أرض بعيدة،
  أعمدة ضوء حجمية تمرّ من النوافذ المقوّسة وتتغيّر مع زاوية الشمس، وذرّات غبار ترقص داخلها.
*/
import * as THREE from 'three';
import { archShape } from './geo.js';

const NOISE = `
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
`;

const SKY_V = 'varying vec3 vDir; void main(){ vDir = position; vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w*.9999; }';
const SKY_F = NOISE + `
varying vec3 vDir; uniform vec3 uTop, uHor, uSunDir, uMoonDir, uSunCol; uniform float uNight, uTime;
void main(){
  vec3 d = normalize(vDir); float e = d.y;
  float k = pow(clamp(e*1.15 + .03, 0., 1.), .5);
  vec3 col = mix(uHor, uTop, k);
  float sd = max(dot(d, uSunDir), 0.);
  float day = 1. - uNight;
  col += uSunCol * (pow(sd, 5.)*.22 + pow(sd, 48.)*.7 + smoothstep(.99955,.99985,sd)*26.) * day;
  col = mix(col, uHor*1.08, exp(-max(e,0.)*7.5)*.5);
  if (e > .0) {
    vec2 cp = d.xz/(e+.16)*.62 + vec2(uTime*.006, 0.);
    float c = fbm(cp*1.4); float c2 = fbm(cp*3.1+7.);
    c = smoothstep(.48,.86, c*.8+c2*.3);
    vec3 cc = mix(uHor*1.15, vec3(1.), .55) * (.55 + .6*day) + uSunCol*pow(sd,3.)*.55*day;
    cc = mix(cc, uTop*1.6, uNight*.85);
    col = mix(col, cc, c*smoothstep(.0,.22,e)*(.55 - .25*uNight));
  }
  if (uNight > .01) {
    vec3 q = d*210.; vec3 id = floor(q); float h = h31(id);
    float s = step(.9965, h) * smoothstep(.0, .35, e);
    vec3 f = fract(q)-.5; s *= smoothstep(.5,.0,length(f))*(.55 + .45*sin(uTime*1.7 + h*60.));
    col += vec3(.85,.9,1.) * s * 1.6 * uNight;
    float md = dot(d, uMoonDir);
    col += vec3(.7,.8,1.) * pow(max(md,0.), 80.) * .35 * uNight;
    col = mix(col, vec3(.93,.95,1.)*1.9, smoothstep(.99935,.99955,md)*uNight*step(0.,e+.05));
  }
  float a = atan(d.x, -d.z);
  float hh = .012 + .05*fbm(vec2(a*2.2+1.7, 0.)) + .028*fbm(vec2(a*7.+3., 2.));
  float hill = smoothstep(hh, hh-.0045, e) * step(-.02, e);
  vec3 hc = mix(uHor, uTop*.25 + vec3(.05,.07,.05), .72 - .25*day) * (.55 + .35*day);
  hc = mix(hc, uHor, smoothstep(.0,.06,e)*.0);
  col = mix(col, hc, hill);
  gl_FragColor = vec4(col, 1.);
}`;

const GROUND_V = 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }';
const GROUND_F = NOISE + `
varying vec3 vW; uniform vec3 uHor, uTop, uSunCol; uniform float uNight, uTime, uSunUp;
void main(){
  vec3 cp = cameraPosition; float dist = length(vW.xz - cp.xz);
  float n = fbm(vW.xz*.045) , m = fbm(vW.xz*.2+4.);
  vec3 base = mix(vec3(.22,.25,.13), vec3(.38,.33,.2), n);
  base = mix(base, vec3(.16,.2,.1), smoothstep(.55,.8,m)*.5);
  float lum = mix(.1, 1., 1.-uNight);
  vec3 col = base*lum*(.5 + .5*uSunUp);
  float fog = 1. - exp(-dist*.011);
  col = mix(col, uHor*.95, fog);
  gl_FragColor = vec4(col, 1.);
}`;

const BEAM_V = `
varying vec3 vW; varying float vS; varying vec3 vN; uniform vec3 uShear; uniform vec3 uOrigin; uniform float uLen;
void main(){
  float s = position.z; vS = s;
  vec3 p = vec3(position.x + s*uShear.x, position.y + s*uShear.y, s) + uOrigin;
  vW = p; vN = normalMatrix*normal;
  gl_Position = projectionMatrix*viewMatrix*vec4(p,1.);
}`;
const BEAM_F = NOISE + `
varying vec3 vW; varying float vS; varying vec3 vN; uniform vec3 uCol; uniform float uI, uTime, uLen; uniform vec3 uShear;
void main(){
  float fade = 1. - smoothstep(.0, uLen, vS);
  float near = smoothstep(.0, .5, vS);
  float floorF = smoothstep(.0, .35, vW.y);
  float streak = .65 + .7*vn(vec2(vW.x*3.1 + vW.z*.8, vS*.6 - uTime*.05)) ;
  float top = smoothstep(7., 3.5, vW.y);
  float a = uI * fade * near * floorF * streak * top;
  gl_FragColor = vec4(uCol*a, a);
}`;

const DUST_V = `
attribute vec4 aSeed; attribute float aWin;
uniform vec3 uShear[12]; uniform vec3 uOrigin[12]; uniform vec2 uSize[12]; uniform float uTime, uPx, uLen;
varying float vA;
void main(){
  int wi = int(aWin);
  vec3 sh = uShear[wi], org = uOrigin[wi]; vec2 sz = uSize[wi];
  float s = fract(aSeed.x + uTime*.012*(.5+aSeed.w))*uLen;
  float x = (aSeed.y-.5)*sz.x*.94 + sin(uTime*.35+aSeed.z*40.)*.18;
  float y = aSeed.z*sz.y + cos(uTime*.3+aSeed.y*30.)*.2;
  vec3 p = vec3(x + s*sh.x, y + s*sh.y, s) + org;
  vec4 mv = viewMatrix*vec4(p,1.);
  gl_Position = projectionMatrix*mv;
  float tw = .55 + .45*sin(uTime*(.8+aSeed.w*2.)+aSeed.x*90.);
  vA = tw * smoothstep(.0,.6,s) * (1.-smoothstep(uLen*.6,uLen,s)) * smoothstep(.0,.5,p.y);
  gl_PointSize = uPx*(2.2+aSeed.w*3.2)*(10./max(1.,-mv.z));
}`;
const DUST_F = 'varying float vA; uniform vec3 uCol; uniform float uI; void main(){ vec2 c = gl_PointCoord-.5; float d = smoothstep(.5,.0,length(c)); gl_FragColor = vec4(uCol, d*d*vA*uI); }';

export class Outdoors {
  constructor(world) {
    this.w = world; const scene = world.scene;
    const U = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uMoonDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 }, uTime: { value: 0 } };
    world.skyUniforms = U;
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(250, 48, 24), new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; scene.add(this.sky);
    this.gU = { uHor: U.uHor, uTop: U.uTop, uSunCol: U.uSunCol, uNight: U.uNight, uTime: U.uTime, uSunUp: { value: 1 } };
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 400).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: GROUND_V, fragmentShader: GROUND_F, uniforms: this.gU }));
    this.ground.position.set(0, -0.04, -3.5 - 200); scene.add(this.ground);
    this.beams = []; this.windows = [];
    world.reflHide.push(); // السماء تنعكس في الأرضية
  }
  /* نافذة مقوّسة: مركز القاعدة (x,y=0,z) وعرضها وارتفاعها */
  addWindow(x, z, w, hs) { this.windows.push({ x, z, w, hs }); }
  buildBeams(len = 15) {
    const n = this.windows.length; this.len = len;
    this.beamMats = [];
    for (const wd of this.windows) {
      const g = new THREE.ExtrudeGeometry(archShape(wd.w, wd.hs), { depth: len, bevelEnabled: false, curveSegments: 18 });
      const m = new THREE.ShaderMaterial({
        vertexShader: BEAM_V, fragmentShader: BEAM_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uShear: { value: new THREE.Vector3() }, uOrigin: { value: new THREE.Vector3(wd.x, 0, wd.z) }, uLen: { value: len }, uCol: { value: new THREE.Color() }, uI: { value: 0 }, uTime: { value: 0 } }
      });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
      this.w.scene.add(mesh); this.beams.push(mesh); this.beamMats.push(m);
    }
    // غبار
    const N = this.w.mobile ? 140 : 420, geo = new THREE.BufferGeometry();
    const seed = new Float32Array(N * 4), win = new Float32Array(N), pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random(); win[i] = i % n; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); geo.setAttribute('aWin', new THREE.BufferAttribute(win, 1));
    const arr = (k) => Array.from({ length: 12 }, () => k());
    this.dustU = { uShear: { value: arr(() => new THREE.Vector3()) }, uOrigin: { value: arr(() => new THREE.Vector3()) }, uSize: { value: arr(() => new THREE.Vector2(1, 1)) }, uTime: { value: 0 }, uPx: { value: 1 }, uLen: { value: len }, uCol: { value: new THREE.Color() }, uI: { value: 0 } };
    this.windows.forEach((wd, i) => { this.dustU.uOrigin.value[i].set(wd.x, 0, wd.z); this.dustU.uSize.value[i].set(wd.w, wd.hs + wd.w / 2); });
    this.dust = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: DUST_V, fragmentShader: DUST_F, uniforms: this.dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.dust.frustumCulled = false; this.dust.renderOrder = 7; this.w.scene.add(this.dust);
  }
  update(dt, time) {
    const w = this.w, T = w.tod, cam = w.camera;
    this.sky.position.copy(cam.position);
    this.sky.material.uniforms.uTime.value = time;
    this.gU.uSunUp.value = T.sunUp;
    if (!this.beams.length) return;
    // اتجاه الضوء (من الشمس أو القمر) → قصّ الأعمدة
    const ld = w.lightDir, tz = Math.max(0.06, -ld.z);
    const sx = -(-ld.x) / tz * -1; // travel = -ld → dx/dz = (-ld.x)/(-ld.z)
    const shx = (-ld.x) / tz, shy = (-ld.y) / tz;
    const day = T.sunUp * Math.min(1, T.si / 3.2), nightI = (1 - T.sunUp) * 0.22 * (T.moonDir.y > 0 ? 1 : 0);
    const I = day * 0.1 + nightI * 0.1, col = day > 0.05 ? T.sunCol : new THREE.Color('#9db4ff');
    void sx;
    for (let i = 0; i < this.beams.length; i++) {
      const u = this.beamMats[i].uniforms;
      u.uShear.value.set(shx, shy, 0); u.uCol.value.copy(col); u.uI.value = I; u.uTime.value = time;
      this.dustU.uShear.value[i].set(shx, shy, 0);
    }
    this.dustU.uTime.value = time; this.dustU.uCol.value.copy(col); this.dustU.uI.value = (day + nightI * 1.4) * 1.6;
    this.dustU.uPx.value = w.quality.dpr * (w.h / 900);
  }
}
