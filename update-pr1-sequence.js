const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const pr1SeqDir = path.join(publicDir, 'pr1_seq');

if (!fs.existsSync(pr1SeqDir)) {
  fs.mkdirSync(pr1SeqDir, { recursive: true });
}

async function syncSequence() {
  console.log('Syncing and optimizing pr 1 sequence to /public/pr1_seq as WebP...');
  const srcPr1 = path.join(rootDir, 'pr 1');

  if (fs.existsSync(srcPr1)) {
    const files = fs.readdirSync(srcPr1).filter(f => f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
    files.sort();

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const srcPath = path.join(srcPr1, file);
      const pad = String(index).padStart(3, '0');
      const outWebp = path.join(pr1SeqDir, `frame_${pad}.webp`);

      await sharp(srcPath)
        .webp({ quality: 75, effort: 4 })
        .toFile(outWebp);
    }
    console.log(`Successfully synced and optimized ${files.length} frames to /public/pr1_seq.`);
  } else {
    console.error('Source directory pr 1 not found!');
  }
}

syncSequence();
