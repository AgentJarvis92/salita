const sharp = require('sharp');
const path = require('path');

async function processPortraits() {
  const sourceDir = path.join(__dirname, '..', 'assets', 'source');
  const outputDir = path.join(__dirname, '..', 'public', 'avatars');

  // Ate Maria v3
  await sharp(path.join(sourceDir, 'ate-maria-master-v3.png'))
    .resize(1200, 1500, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(path.join(outputDir, 'ate-maria-portrait.webp'));

  // Kuya Josh v3
  await sharp(path.join(sourceDir, 'kuya-josh-master-v3.png'))
    .resize(1200, 1500, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(path.join(outputDir, 'kuya-josh-portrait.webp'));

  console.log('✅ V3 Portraits processed successfully');
}

processPortraits().catch(console.error);
