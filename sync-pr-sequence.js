const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FRAME_COUNT = 240;

// Watermark bounds in 1280x720 source frames (star spans 1136..1183, 576..623)
const WM_LEFT = 1130;
const WM_TOP = 570;
const WM_WIDTH = 60;
const WM_HEIGHT = 60;

function resolveSourceFrame(prDir, idx) {
  const pad = String(idx).padStart(3, '0');
  const candidates = [
    path.join(prDir, `frame_${pad}.png`),
    path.join(prDir, `frame_${idx}.png`),
    path.join(prDir, `frame_${pad}_delay-0.041s.png`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

/**
 * Extracts and dilates (2px) the exact binary mask of the bottom-right corner
 * watermark from black end-frame 239 so all MP4 compression halo pixels are covered.
 */
async function extractDilatedWatermarkMask(prDir) {
  const refPath = resolveSourceFrame(prDir, FRAME_COUNT - 1);
  if (!refPath) return null;

  const { data, info } = await sharp(refPath)
    .extract({ left: WM_LEFT, top: WM_TOP, width: WM_WIDTH, height: WM_HEIGHT })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rawMask = new Uint8Array(WM_WIDTH * WM_HEIGHT);
  for (let i = 0; i < WM_WIDTH * WM_HEIGHT; i++) {
    const s = i * info.channels;
    const lum = (data[s] + data[s + 1] + data[s + 2]) / 3;
    if (lum > 5) rawMask[i] = 1;
  }

  // Dilate by 2 pixels inside patch bounds (keeping outer 1px border unmasked as Dirichlet boundary)
  const dilated = new Uint8Array(WM_WIDTH * WM_HEIGHT);
  const maskedIndices = [];
  for (let y = 2; y < WM_HEIGHT - 2; y++) {
    for (let x = 2; x < WM_WIDTH - 2; x++) {
      let hit = false;
      for (let dy = -2; dy <= 2 && !hit; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (rawMask[(y + dy) * WM_WIDTH + (x + dx)]) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        const idx = y * WM_WIDTH + x;
        dilated[idx] = 1;
        maskedIndices.push(idx);
      }
    }
  }

  return { mask: dilated, maskedIndices };
}

/**
 * Heals masked corner pixels via inverse-distance boundary initialization
 * followed by Laplace harmonic smoothing (Dirichlet boundary conditions).
 */
function healWatermarkMask(rawBuffer, width, channels, wm) {
  const { mask, maskedIndices } = wm;
  const grid = new Float32Array(WM_WIDTH * WM_HEIGHT * 3);

  for (let y = 0; y < WM_HEIGHT; y++) {
    const rowStart = (WM_TOP + y) * width + WM_LEFT;
    for (let x = 0; x < WM_WIDTH; x++) {
      const mIdx = y * WM_WIDTH + x;
      const pIdx = (rowStart + x) * channels;
      grid[mIdx * 3] = rawBuffer[pIdx];
      grid[mIdx * 3 + 1] = rawBuffer[pIdx + 1];
      grid[mIdx * 3 + 2] = rawBuffer[pIdx + 2];
    }
  }

  // Seed masked pixels from inverse-distance weighted clean 4-way boundaries
  for (const mIdx of maskedIndices) {
    const x = mIdx % WM_WIDTH;
    const y = Math.floor(mIdx / WM_WIDTH);

    let lx = x;
    while (lx > 0 && mask[y * WM_WIDTH + lx]) lx--;
    let rx = x;
    while (rx < WM_WIDTH - 1 && mask[y * WM_WIDTH + rx]) rx++;
    let ty = y;
    while (ty > 0 && mask[ty * WM_WIDTH + x]) ty--;
    let by = y;
    while (by < WM_HEIGHT - 1 && mask[by * WM_WIDTH + x]) by++;

    const samples = [
      { idx: (y * WM_WIDTH + lx) * 3, w: 1 / Math.max(1, x - lx) },
      { idx: (y * WM_WIDTH + rx) * 3, w: 1 / Math.max(1, rx - x) },
      { idx: (ty * WM_WIDTH + x) * 3, w: 1 / Math.max(1, y - ty) },
      { idx: (by * WM_WIDTH + x) * 3, w: 1 / Math.max(1, by - y) },
    ];
    let wSum = 0;
    let r = 0, g = 0, b = 0;
    for (const s of samples) {
      r += grid[s.idx] * s.w;
      g += grid[s.idx + 1] * s.w;
      b += grid[s.idx + 2] * s.w;
      wSum += s.w;
    }
    grid[mIdx * 3] = r / wSum;
    grid[mIdx * 3 + 1] = g / wSum;
    grid[mIdx * 3 + 2] = b / wSum;
  }

  // Smooth membrane over masked interior via Gauss-Seidel harmonic relaxation
  for (let iter = 0; iter < 16; iter++) {
    for (const mIdx of maskedIndices) {
      const up = (mIdx - WM_WIDTH) * 3;
      const down = (mIdx + WM_WIDTH) * 3;
      const left = (mIdx - 1) * 3;
      const right = (mIdx + 1) * 3;
      const dst = mIdx * 3;
      grid[dst] = 0.25 * (grid[up] + grid[down] + grid[left] + grid[right]);
      grid[dst + 1] = 0.25 * (grid[up + 1] + grid[down + 1] + grid[left + 1] + grid[right + 1]);
      grid[dst + 2] = 0.25 * (grid[up + 2] + grid[down + 2] + grid[left + 2] + grid[right + 2]);
    }
  }

  for (const mIdx of maskedIndices) {
    const x = mIdx % WM_WIDTH;
    const y = Math.floor(mIdx / WM_WIDTH);
    const pIdx = ((WM_TOP + y) * width + (WM_LEFT + x)) * channels;
    rawBuffer[pIdx] = Math.round(grid[mIdx * 3]);
    rawBuffer[pIdx + 1] = Math.round(grid[mIdx * 3 + 1]);
    rawBuffer[pIdx + 2] = Math.round(grid[mIdx * 3 + 2]);
  }
}

async function syncAllPrFrames() {
  const rootDir = __dirname;
  const prDir = path.join(rootDir, 'pr');
  const desktopDir = path.join(rootDir, 'public', 'pr_seq');
  const mobileDir = path.join(rootDir, 'public', 'pr_seq_mobile');

  if (!fs.existsSync(prDir)) {
    throw new Error(`Source directory not found: ${prDir}`);
  }

  fs.mkdirSync(desktopDir, { recursive: true });
  fs.mkdirSync(mobileDir, { recursive: true });

  const wm = await extractDilatedWatermarkMask(prDir);

  console.log(
    `Converting & healing ${FRAME_COUNT} frames from ${prDir} -> public/pr_seq (1280x720) & public/pr_seq_mobile (720x405)...`
  );
  const startTime = Date.now();

  const indices = Array.from({ length: FRAME_COUNT }, (_, i) => i);
  const concurrency = 8;
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < indices.length) {
      const idx = cursor++;
      const pad = String(idx).padStart(3, '0');
      const src = resolveSourceFrame(prDir, idx);
      if (!src) {
        throw new Error(`Missing source frame ${idx} in ${prDir}`);
      }

      const desktopDst = path.join(desktopDir, `frame_${pad}.webp`);
      const mobileDst = path.join(mobileDir, `frame_${pad}.webp`);

      const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
      if (wm && info.width >= WM_LEFT + WM_WIDTH && info.height >= WM_TOP + WM_HEIGHT) {
        healWatermarkMask(data, info.width, info.channels, wm);
      }

      const cleanedRaw = {
        raw: { width: info.width, height: info.height, channels: info.channels },
      };

      await Promise.all([
        sharp(data, cleanedRaw)
          .webp({ quality: 80, effort: 3 })
          .toFile(desktopDst),
        sharp(data, cleanedRaw)
          .resize(720, 405, { fit: 'cover' })
          .webp({ quality: 75, effort: 4 })
          .toFile(mobileDst),
      ]);

      completed++;
      if (completed % 30 === 0 || completed === FRAME_COUNT) {
        console.log(`Progress: ${completed}/${FRAME_COUNT} frames converted...`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Conversion completed in ${duration}s! Saved clean desktop and mobile WebP sequences.`);
}

syncAllPrFrames().catch((err) => {
  console.error(err);
  process.exit(1);
});
