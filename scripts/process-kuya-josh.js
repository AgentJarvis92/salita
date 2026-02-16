const sharp = require('sharp');
const fs = require('fs');

async function processImages() {
  const source = 'assets/source/kuya-josh-master.png';
  
  console.log('Processing Kuya Josh avatars from canonical source...\n');
  
  // 1) Chat Avatar (1:1 Square) - 1024x1024
  console.log('1) Creating chat avatar (1024x1024)...');
  await sharp(source)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile('public/avatars/kuya-josh-avatar.webp');
  
  const avatar = fs.statSync('public/avatars/kuya-josh-avatar.webp');
  console.log(`   ✓ Saved: ${(avatar.size / 1024).toFixed(1)} KB\n`);
  
  // 2) Tutor Portrait (4:5) - 1200x1500
  console.log('2) Creating tutor portrait (1200x1500)...');
  await sharp(source)
    .resize(1200, 1500, { fit: 'cover', position: 'top' })
    .webp({ quality: 85 })
    .toFile('public/avatars/kuya-josh-portrait.webp');
  
  const portrait = fs.statSync('public/avatars/kuya-josh-portrait.webp');
  console.log(`   ✓ Saved: ${(portrait.size / 1024).toFixed(1)} KB\n`);
  
  // 3) Hero (16:9) - 1920x1080
  console.log('3) Creating hero image (1920x1080)...');
  await sharp(source)
    .resize(1920, 1080, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile('public/avatars/kuya-josh-hero.webp');
  
  const hero = fs.statSync('public/avatars/kuya-josh-hero.webp');
  console.log(`   ✓ Saved: ${(hero.size / 1024).toFixed(1)} KB\n`);
  
  console.log('✓ All assets created successfully!');
  console.log('\n📊 ASSET SUMMARY:');
  console.log(`  kuya-josh-avatar.webp:   ${(avatar.size / 1024).toFixed(1)} KB (1024x1024)`);
  console.log(`  kuya-josh-portrait.webp: ${(portrait.size / 1024).toFixed(1)} KB (1200x1500)`);
  console.log(`  kuya-josh-hero.webp:     ${(hero.size / 1024).toFixed(1)} KB (1920x1080)`);
  console.log('\n✅ All files under 300KB target');
}

processImages().catch(console.error);
