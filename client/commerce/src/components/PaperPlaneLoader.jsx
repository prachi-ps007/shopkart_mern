import React, { useEffect, useMemo, useRef, useState } from 'react';

/*
  Loom & Jade — PaperPlaneLoader (3D)
  A checked sheet of paper drops in square by square, is folded step by step into
  a paper aeroplane in real 3D, closes and opens its wings, and flies away.
  One cycle takes CYCLE seconds and loops until the parent removes the loader.

  Props:
    onCycleEnd  () => void   called at the end of every cycle (after the plane has flown).
                             The parent decides whether to keep looping or reveal the page.
    label       string       caption under the animation

  How the 3D works (no libraries):
    - Every square of the sheet is tracked through every fold, so the check pattern
      follows the paper as it folds.
    - A flap swings about its crease line in 3D (rotation about the crease axis).
    - After the last fold the two halves hinge about the centre line to form the wings.
    - Points go through a small camera (roll, yaw, tilt) + perspective, faces are lit
      with one directional light, and drawn far-to-near as SVG polygons.
*/

const CYCLE = 4.6; // seconds per loop

/* ---- paper colours ---- */
const PAPER_LIGHT = '#FFF4D6';
const PAPER_GOLD = '#F2C94C';
const BACK_LIGHT = '#E8B23A';
const BACK_GOLD = '#C98A14';
const INK = '#4A3308';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const SWATCH = {
    front: [hex(PAPER_LIGHT), hex(PAPER_GOLD)],
    back: [hex(BACK_LIGHT), hex(BACK_GOLD)],
};

/* ---- sheet, centred on the origin: COLS x ROWS squares.
   Change COLS to make the paper wider/narrower; the fold lines are derived from it. ---- */
const TILE = 14;
const COLS = 9; // shorter, more delta-shaped plane (was 12)
const ROWS = 6;
const X0 = -(COLS * TILE) / 2;
const X1 = -X0;
const Y0 = -(ROWS * TILE) / 2;
const Y1 = -Y0;
const HALF = Y1;
const RUN = HALF * (1 + Math.SQRT2); // run of a 22.5° crease that reaches the nose
const NOSE = [X1, 0];
const RECT = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];

/* Classic paper-plane folds, nose to the right. `side` is the half-plane that gets folded over. */
const FOLDS = [
    { a: [X1 - HALF, Y0], b: NOSE, side: -1 }, // top corner to centre
    { a: [X1 - HALF, Y1], b: NOSE, side: 1 }, // bottom corner to centre
    { a: [X1 - RUN, Y0], b: NOSE, side: -1 }, // top slant to centre line
    { a: [X1 - RUN, Y1], b: NOSE, side: 1 }, // bottom slant to centre line
];

/* timeline (seconds) */
const TILES_DONE = 0.9;
const FOLD_START = [0.95, 1.35, 1.75, 2.15];
const FOLD_DUR = 0.36;
const CREASE_LEAD = 0.2;
const BEND = [2.6, 3.2]; // wings close, then open into a V
const BEND_CLOSED = 1.25; // radians
const BEND_OPEN = 0.8; // final wing angle: deeper V, sharp keel (was 0.42)
const FLIGHT = [3.3, 4.3];

const LAYER_GAP = 1.4; // paper "thickness" between stacked layers
const FOCAL = 520; // perspective strength (bigger = flatter)

/* ---------- small maths helpers ---------- */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const smooth = (t) => t * t * (3 - 2 * t);

const dist = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

/* keep the part of `poly` where sign * dist >= 0 (Sutherland–Hodgman, one half-plane) */
function clip(poly, a, b, sign) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const q = poly[(i + 1) % poly.length];
        const dp = sign * dist(a, b, p);
        const dq = sign * dist(a, b, q);
        if (dp >= 0) out.push(p);
        if ((dp > 0 && dq < 0) || (dp < 0 && dq > 0)) {
            const t = dp / (dp - dq);
            out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
        }
    }
    return out;
}

function reflect(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    const fx = a[0] + t * dx;
    const fy = a[1] + t * dy;
    return [2 * fx - p[0], 2 * fy - p[1]];
}

function signedArea(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const q = poly[(i + 1) % poly.length];
        s += p[0] * q[1] - q[0] * p[1];
    }
    return s / 2;
}
const area = (poly) => Math.abs(signedArea(poly));

/* 2D affine maps [m11, m12, m21, m22, tx, ty]: track where each square of paper currently sits */
const IDENT = [1, 0, 0, 1, 0, 0];
const applyM = (M, x, y) => [M[0] * x + M[1] * y + M[4], M[2] * x + M[3] * y + M[5]];

function reflection(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const q11 = 2 * ux * ux - 1;
    const q12 = 2 * ux * uy;
    const q22 = 2 * uy * uy - 1;
    return [q11, q12, q12, q22, a[0] - (q11 * a[0] + q12 * a[1]), a[1] - (q12 * a[0] + q22 * a[1])];
}

function compose(R, M) {
    return [
        R[0] * M[0] + R[1] * M[2],
        R[0] * M[1] + R[1] * M[3],
        R[2] * M[0] + R[3] * M[2],
        R[2] * M[1] + R[3] * M[3],
        R[0] * M[4] + R[1] * M[5] + R[4],
        R[2] * M[4] + R[3] * M[5] + R[5],
    ];
}

/* Pre-compute every fold. Layers carry: pts (flat outline), M (paper -> flat position), z (stack height). */
function buildFolds() {
    let layers = [{ pts: RECT, M: IDENT, z: 0 }];
    const states = [layers];
    const stages = [];

    FOLDS.forEach(({ a, b, side }) => {
        const stay = [];
        const flaps = [];
        layers.forEach((l) => {
            const s = clip(l.pts, a, b, -side);
            const f = clip(l.pts, a, b, side);
            if (s.length >= 3 && area(s) > 0.5) stay.push({ pts: s, M: l.M, z: l.z });
            if (f.length >= 3 && area(f) > 0.5) {
                flaps.push({ from: f, to: f.map((p) => reflect(p, a, b)), M: l.M, zFrom: l.z });
            }
        });

        // Flaps land on top of everything that stays, and folding reverses their stacking order.
        const top = stay.reduce((m, l) => Math.max(m, l.z), 0);
        const R = reflection(a, b);
        flaps.sort((p, q) => p.zFrom - q.zFrom);
        flaps.forEach((fl, idx) => {
            fl.zTo = top + LAYER_GAP * (flaps.length - idx);
            fl.Mto = compose(R, fl.M);
        });

        stages.push({ stay, flaps, a, b });
        layers = [...stay, ...flaps.map((fl) => ({ pts: fl.to, M: fl.Mto, z: fl.zTo }))];
        states.push(layers);
    });

    return { states, stages };
}

/* Cut a layer into its checked squares (each square clipped to the layer's outline). */
function tileFragments(pts, M) {
    const sgn = signedArea(pts) < 0 ? -1 : 1;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    pts.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });

    const out = [];
    for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
            const x0 = X0 + i * TILE;
            const y0 = Y0 + j * TILE;
            const x1 = x0 + TILE;
            const y1 = y0 + TILE;
            let q = [applyM(M, x0, y0), applyM(M, x1, y0), applyM(M, x1, y1), applyM(M, x0, y1)];

            const qMinX = Math.min(q[0][0], q[1][0], q[2][0], q[3][0]);
            const qMaxX = Math.max(q[0][0], q[1][0], q[2][0], q[3][0]);
            const qMinY = Math.min(q[0][1], q[1][1], q[2][1], q[3][1]);
            const qMaxY = Math.max(q[0][1], q[1][1], q[2][1], q[3][1]);
            if (qMaxX < minX || qMinX > maxX || qMaxY < minY || qMinY > maxY) continue;

            for (let k = 0; k < pts.length && q.length >= 3; k++) {
                q = clip(q, pts[k], pts[(k + 1) % pts.length], sgn);
            }
            if (q.length >= 3 && area(q) > 0.05) out.push({ poly: q, tone: (i + j) % 2 });
        }
    }
    return out;
}

const frags = (obj, pts, M) => {
    if (!obj.frags) obj.frags = tileFragments(pts, M);
    return obj.frags;
};

/* ---------- building the 3D scene for time t ---------- */

/* a flat layer of paper at its stack height */
const flatLayer = (l) => ({
    polys: frags(l, l.pts, l.M).map((fr) => ({
        tone: fr.tone,
        v: fr.poly.map(([x, y]) => [x, y, l.z]),
    })),
});

/* a point on a flap swinging about its crease: rotation about the crease axis, lifted toward the viewer */
function lift(x, y, fp, z0) {
    const dx = x - fp.ax;
    const dy = y - fp.ay;
    const s = dx * fp.ux + dy * fp.uy;
    const d = -dx * fp.uy + dy * fp.ux;
    const c = Math.cos(fp.theta);
    const sn = Math.sin(fp.theta);
    return [fp.ax + s * fp.ux - d * c * fp.uy, fp.ay + s * fp.uy + d * c * fp.ux, z0 + Math.abs(d) * sn];
}

/* squares dropping onto the table one by one */
function buildLayer(t) {
    const polys = [];
    for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
            const p = clamp01((t - (0.04 + (i + j) * 0.04)) / 0.22);
            if (p <= 0) continue;
            const h = (TILE / 2) * easeOutBack(p);
            const z = (1 - p) * (1 - p) * 26;
            const cx = X0 + i * TILE + TILE / 2;
            const cy = Y0 + j * TILE + TILE / 2;
            polys.push({
                tone: (i + j) % 2,
                v: [[cx - h, cy - h, z], [cx + h, cy - h, z], [cx + h, cy + h, z], [cx - h, cy + h, z]],
            });
        }
    }
    return { polys };
}

function sceneLayers(t, geo) {
    if (t < TILES_DONE) return [buildLayer(t)];
    const { states, stages } = geo;

    for (let k = FOLDS.length - 1; k >= 0; k--) {
        if (t < FOLD_START[k]) continue;
        const f = clamp01((t - FOLD_START[k]) / FOLD_DUR);
        if (f >= 1) return states[k + 1].map(flatLayer);

        const e = easeInOut(f);
        const { stay, flaps, a, b } = stages[k];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const fp = {
            ax: a[0],
            ay: a[1],
            ux: (b[0] - a[0]) / L,
            uy: (b[1] - a[1]) / L,
            theta: e * Math.PI,
        };
        return [
            ...stay.map(flatLayer),
            ...flaps.map((fl) => ({
                polys: frags(fl, fl.from, fl.M).map((fr) => ({
                    tone: fr.tone,
                    v: fr.poly.map(([x, y]) => lift(x, y, fp, lerp(fl.zFrom, fl.zTo, e))),
                })),
            })),
        ];
    }
    return states[0].map(flatLayer);
}

/* wing angle: fold shut along the centre line, then open into a V */
function bendAt(t) {
    const [b0, b1] = BEND;
    if (t < b0) return 0;
    const m = (b0 + b1) / 2;
    if (t < m) return lerp(0, BEND_CLOSED, easeInOut(clamp01((t - b0) / (m - b0))));
    return lerp(BEND_CLOSED, BEND_OPEN, easeInOut(clamp01((t - m) / (b1 - m))));
}

/* ---------- camera ---------- */
function cameraAt(t) {
    let tilt = lerp(0.42, 0.9, smooth(clamp01((t - 0.4) / 2.2))); // steeper view shows the V and keel
    let yaw = lerp(-0.1, -0.52, smooth(clamp01((t - 0.9) / 1.7)));
    let roll = 0;

    if (t >= FLIGHT[0]) {
        const p = clamp01((t - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0]));
        tilt = lerp(0.9, 0.45, smooth(p));
        yaw = lerp(-0.52, 0.6, smooth(p)); // the nose swings away from the viewer
        roll = 0.5 * Math.sin(p * Math.PI * 1.6); // banks as it flies
    }
    return { tilt, yaw, roll };
}

function makeCamera({ tilt, yaw, roll }) {
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    return ([x, y, z]) => {
        const y1 = y * cr - z * sr; // roll about the plane's own long axis
        const z1 = y * sr + z * cr;
        const x2 = x * cy + z1 * sy; // yaw about the vertical
        const z2 = -x * sy + z1 * cy;
        return [x2, y1 * ct - z2 * st, y1 * st + z2 * ct]; // tilt toward the viewer
    };
}

const proj = (cam, p) => {
    const [x, y, z] = cam(p);
    const k = FOCAL / (FOCAL - z);
    return [x * k, y * k];
};

/* ---------- lighting + painter's algorithm ---------- */
const LIGHT = (() => {
    const v = [-0.35, -0.55, 0.75];
    const l = Math.hypot(v[0], v[1], v[2]);
    return v.map((c) => c / l);
})();

function faceNormal(c) {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let i = 0; i < c.length; i++) {
        const p = c[i];
        const q = c[(i + 1) % c.length];
        nx += (p[1] - q[1]) * (p[2] + q[2]);
        ny += (p[2] - q[2]) * (p[0] + q[0]);
        nz += (p[0] - q[0]) * (p[1] + q[1]);
    }
    const l = Math.hypot(nx, ny, nz) || 1;
    return [nx / l, ny / l, nz / l];
}

function renderPolys(layers, cam, phi) {
    const cs = Math.cos(phi);
    const sn = Math.sin(phi);
    const groups = [];

    layers.forEach((layer) => {
        let n = 0;
        let mY = 0;
        let mZ = 0;
        let mD = 0;
        const polys = [];

        layer.polys.forEach((pg) => {
            const c = pg.v.map(([x, y, z]) => {
                mY += y;
                mZ += z;
                n++;
                // wings hinge about the centre line (y = 0) and rise into a V
                return cam([x, y * cs, z + Math.abs(y) * sn]);
            });
            c.forEach((p) => {
                mD += p[2];
            });

            const pr = c.map(([x, y, z]) => {
                const k = FOCAL / (FOCAL - z);
                return [x * k, y * k];
            });

            const back = signedArea(pr) < 0; // seeing the reverse of the paper
            const nrm = faceNormal(c);
            const dot = Math.abs(nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2]);
            const shade = Math.min(1.08, Math.max(0.4, 0.4 + 0.7 * dot)); // stronger light/dark contrast
            const [r, g, b] = SWATCH[back ? 'back' : 'front'][pg.tone];
            polys.push({
                pts: pr,
                fill: `rgb(${Math.min(255, Math.round(r * shade))},${Math.min(255, Math.round(g * shade))},${Math.min(255, Math.round(b * shade))})`,
            });
        });

        if (polys.length) groups.push({ polys, side: mY / n < 0 ? -1 : 1, z: mZ / n, depth: mD / n });
    });

    // Stacked layers: sort by height. Once the wings are bent, the far wing is drawn first.
    const acc = { '-1': [0, 0], '1': [0, 0] };
    groups.forEach((g) => {
        acc[g.side][0] += g.depth;
        acc[g.side][1] += 1;
    });
    const sideDepth = (s) => (acc[s][1] ? acc[s][0] / acc[s][1] : 0);
    groups.sort((A, B) =>
        phi > 0.02 && A.side !== B.side ? sideDepth(A.side) - sideDepth(B.side) : A.z - B.z
    );

    return groups.flatMap((g) => g.polys);
}

/* flight path in the 240 x 160 viewBox: a small dip, then a climb out of frame (quadratic Bezier) */
const HOME = [120, 80];
const CTRL = [176, 126];
const END = [300, -40];

function bezier(u) {
    const m = 1 - u;
    return [
        m * m * HOME[0] + 2 * m * u * CTRL[0] + u * u * END[0],
        m * m * HOME[1] + 2 * m * u * CTRL[1] + u * u * END[1],
    ];
}

function tangent(u) {
    return [
        2 * (1 - u) * (CTRL[0] - HOME[0]) + 2 * u * (END[0] - CTRL[0]),
        2 * (1 - u) * (CTRL[1] - HOME[1]) + 2 * u * (END[1] - CTRL[1]),
    ];
}

const pointsAttr = (pts) => pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

/* ---------- one frame of the animation, as a pure function of time ---------- */
export function PaperPlaneScene({ t, geometry }) {
    const cam = makeCamera(cameraAt(t));
    const phi = bendAt(t);

    /* flight (2D path + heading; the 3D turn/bank comes from the camera) */
    let px = HOME[0];
    let py = HOME[1];
    let angle = 0;
    let scale = 1;
    let opacity = 1;
    let trail = null;

    if (t >= FLIGHT[0]) {
        const p = clamp01((t - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0]));
        const u = Math.pow(p, 1.5);
        [px, py] = bezier(u);
        const [tx, ty] = tangent(u);
        angle = (Math.atan2(ty, tx) * 180) / Math.PI * smooth(clamp01(u / 0.25));
        scale = 1 - 0.45 * p;
        opacity = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;

        const steps = 26;
        const d = Array.from({ length: steps + 1 }, (_, i) => {
            const [x, y] = bezier((i / steps) * u);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
        trail = { d, opacity: 0.9 * (1 - clamp01((p - 0.85) / 0.15)) };
    }

    const polys = renderPolys(sceneLayers(t, geometry), cam, phi);

    /* soft ground shadow under the paper; fades as the plane takes off */
    const [sx, sy] = proj(cam, [0, 0, -30]);
    const shadowOpacity = 0.4 * (1 - clamp01((t - FLIGHT[0]) / 0.25));
    const shadowRx = 50 * (0.5 + 0.5 * Math.cos(phi)); // narrower to match the shorter body

    return (
        <svg viewBox="0 0 240 160" className="w-full max-w-[24rem] aspect-[3/2] overflow-visible" aria-hidden="true">
            <defs>
                <filter id="ppl-blur" x="-30%" y="-150%" width="160%" height="400%">
                    <feGaussianBlur stdDeviation="3.5" />
                </filter>
            </defs>

            {trail && (
                <path
                    d={trail.d}
                    fill="none"
                    stroke={PAPER_GOLD}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="1 6"
                    opacity={trail.opacity}
                />
            )}

            <g transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(3)})`} opacity={opacity}>
                {shadowOpacity > 0 && (
                    <ellipse
                        cx={sx}
                        cy={sy}
                        rx={shadowRx}
                        ry={10}
                        fill="#000"
                        opacity={shadowOpacity}
                        filter="url(#ppl-blur)"
                    />
                )}

                {polys.map((p, i) => (
                    <polygon
                        key={i}
                        points={pointsAttr(p.pts)}
                        fill={p.fill}
                        stroke={INK}
                        strokeWidth="0.7"
                        strokeOpacity="0.85"
                        strokeLinejoin="round"
                    />
                ))}

                {/* dashed crease line, flashed just before each fold */}
                {FOLDS.map((f, k) => {
                    const start = FOLD_START[k];
                    if (t < start - CREASE_LEAD || t >= start) return null;
                    const o = clamp01((t - (start - CREASE_LEAD)) / (CREASE_LEAD * 0.6));
                    const z = geometry.states[k].reduce((m, l) => Math.max(m, l.z), 0) + 1.2;
                    const [x1, y1] = proj(cam, [f.a[0], f.a[1], z]);
                    const [x2, y2] = proj(cam, [f.b[0], f.b[1], z]);
                    return (
                        <line
                            key={k}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#8B1028"
                            strokeWidth="1.6"
                            strokeDasharray="3 3"
                            opacity={o}
                        />
                    );
                })}
            </g>
        </svg>
    );
}

function usePrefersReducedMotion() {
    const [reduced] = useState(
        () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
    return reduced;
}

export function PaperPlaneLoader({ onCycleEnd, label = 'Loading wishlist…' }) {
    const geometry = useMemo(buildFolds, []);
    const reduced = usePrefersReducedMotion();
    const [t, setT] = useState(0);
    const endRef = useRef(onCycleEnd);
    endRef.current = onCycleEnd;

    useEffect(() => {
        // Reduced motion: no animation, just tell the parent a "cycle" passed.
        if (reduced) {
            const id = setInterval(() => endRef.current?.(), 600);
            return () => clearInterval(id);
        }

        let raf;
        let lastCycle = 0;
        const start = performance.now();

        const tick = (now) => {
            const elapsed = (now - start) / 1000;
            const cycle = Math.floor(elapsed / CYCLE);
            if (cycle > lastCycle) {
                lastCycle = cycle;
                endRef.current?.(); // the plane has flown — parent may reveal the page
            }
            setT(elapsed - cycle * CYCLE);
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [reduced]);

    return (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-16">
            {/* reduced motion shows the finished plane as a still */}
            <PaperPlaneScene t={reduced ? FLIGHT[0] - 0.05 : t} geometry={geometry} />
            <p className="mt-6 font-['Cinzel'] text-xs font-bold tracking-[0.35em] text-[#F2C94C]">
                {label.toUpperCase()}
            </p>
        </div>
    );
}

export default PaperPlaneLoader;