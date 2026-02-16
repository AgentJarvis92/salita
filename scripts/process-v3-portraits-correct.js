const sharp = require('sharp');
const path = require('path');

async function processPortraits() {
  const sourceDir = path.join(__dirname, '..', 'assets', 'source');
  const outputDir = path.join(__dirname, '..', 'public', 'avatars');

  // Ate Maria v3 - Keep original landscape ratio
  await sharp(path.join(sourceDir, 'ate-maria-master-v3.png'))
    .resize(1536, 768, { fit: 'cover', position: 'center' })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, 'ate-maria-portrait.webp'));

  // Kuya Josh v3 - Keep original landscape ratio
  await sharp(path.join(sourceDir, 'kuya-josh-master-v3.png'))
    .resize(1536, 768, { fit: 'cover', position: 'center' })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, 'kuya-josh-portrait.webp'));

  console.log('✅ V3 Portraits processed correctly (landscape)');
}

processPortraits().catch(console.error);
