const sharp = require('sharp');
const path = require('path');

async function processAvatar(inputPath, outputPrefix) {
  console.log(`\nProcessing ${outputPrefix}...`);

  // Avatar variant (1024x1024) - for chat header, dashboard cards
  await sharp(inputPath)
    .resize(1024, 1024, { 
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toFile(path.join(__dirname, `../public/avatars/${outputPrefix}-avatar.webp`));

  // Portrait variant (1200x1500) - for dashboard background cards
  await sharp(inputPath)
    .resize(1200, 1500, { 
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toFile(path.join(__dirname, `../public/avatars/${outputPrefix}-portrait.webp`));

  // Hero variant (1920x1080) - for future landing page use
  await sharp(inputPath)
    .resize(1920, 1080, { 
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toFile(path.join(__dirname, `../public/avatars/${outputPrefix}-hero.webp`));

  console.log(`✓ Generated ${outputPrefix}-avatar.webp`);
  console.log(`✓ Generated ${outputPrefix}-portrait.webp`);
  console.log(`✓ Generated ${outputPrefix}-hero.webp`);
}

async function main() {
  try {
    // Process Ate Maria
    await processAvatar(
      path.join(__dirname, '../assets/source/ate-maria-master-v2.png'),
      'ate-maria'
    );

    // Process Kuya Josh
    await processAvatar(
      path.join(__dirname, '../assets/source/kuya-josh-master-v2.png'),
      'kuya-josh'
    );

    console.log('\n✅ All avatars processed successfully!\n');
  } catch (error) {
    console.error('Error processing avatars:', error);
    process.exit(1);
  }
}

main();
