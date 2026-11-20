import fs from 'fs';
import path from 'path';

async function downloadAsset(url, destPath) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    console.log(`Downloaded ${url} -> ${destPath} (${buffer.length} bytes)`);
  } catch (err) {
    console.error(`Failed to download ${url}:`, err.message);
  }
}

async function run() {
  await downloadAsset('https://axess.zone/brand/header-logo.png', 'frontend/public/brand/header-logo.png');
  await downloadAsset('https://axess.zone/brand/login-icon.png', 'frontend/public/brand/login-icon.png');
  await downloadAsset('https://axess.zone/Line-1.svg', 'frontend/public/Line-1.svg');
  await downloadAsset('https://axess.zone/Line-2.svg', 'frontend/public/Line-2.svg');
}

run();
