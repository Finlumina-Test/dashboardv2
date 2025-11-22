const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = path.join(__dirname, 'vox-grid-exports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exportVoxGrid() {
  console.log('🚀 Starting Puppeteer export...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport to ensure consistent rendering
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2 // High DPI for crisp images
  });

  // Read the HTML file
  const htmlPath = path.join(__dirname, 'vox-grid.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Load the HTML
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0'
  });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(1000); // Extra time for all styles to apply

  console.log('✓ Page loaded with all fonts and styles\n');

  // Get the grid element
  const gridElement = await page.$('#grid');

  if (!gridElement) {
    console.error('❌ Grid element not found!');
    await browser.close();
    return;
  }

  // 1. Export full grid at 2160x2160 (high quality)
  console.log('📸 Capturing full grid (2160×2160)...');
  const fullGridPath = path.join(outputDir, 'vox-full-grid.png');
  await gridElement.screenshot({
    path: fullGridPath,
    type: 'png',
    omitBackground: false
  });
  console.log(`   ✓ Saved: ${fullGridPath}\n`);

  // 2. Export each cell at 1080x1080
  console.log('📸 Capturing individual cells (1080×1080 each)...\n');

  const cellSize = 360; // Original cell size in the 1080x1080 grid

  // Get the full grid screenshot as buffer
  const fullGridBuffer = await gridElement.screenshot({
    type: 'png',
    encoding: 'binary',
    omitBackground: false
  });

  // Use sharp or canvas to split the image
  const sharp = require('sharp');
  const gridImage = sharp(fullGridBuffer);
  const metadata = await gridImage.metadata();

  const actualCellWidth = Math.floor(metadata.width / 3);
  const actualCellHeight = Math.floor(metadata.height / 3);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cellNum = row * 3 + col + 1;
      const cellPath = path.join(outputDir, `vox-post-${cellNum}.png`);

      await sharp(fullGridBuffer)
        .extract({
          left: col * actualCellWidth,
          top: row * actualCellHeight,
          width: actualCellWidth,
          height: actualCellHeight
        })
        .resize(1080, 1080, {
          kernel: 'lanczos3',
          fit: 'fill'
        })
        .png({ quality: 100 })
        .toFile(cellPath);

      console.log(`   ✓ Cell ${cellNum} saved: ${cellPath}`);
    }
  }

  await browser.close();

  console.log('\n✅ All exports complete!');
  console.log(`📁 Files saved to: ${outputDir}\n`);
  console.log('📱 Instagram upload order (bottom-right to top-left):');
  console.log('   9 → 8 → 7 → 6 → 5 → 4 → 3 → 2 → 1\n');
}

exportVoxGrid().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
