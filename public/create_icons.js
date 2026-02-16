const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Light background (white)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Dark background with rounded corners effect
  ctx.fillStyle = '#007AFF';
  const roundedSize = Math.round(size * 0.15);
  ctx.fillRect(roundedSize, roundedSize, size - 2 * roundedSize, size - 2 * roundedSize);

  // Add text: "S" for Salita
  ctx.font = `bold ${Math.round(size * 0.5)}px -apple-system, BlinkMacSystemFont, 'Segoe UI'`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2);

  // Add flag emoji indicator (subtle)
  ctx.font = `${Math.round(size * 0.3)}px system-ui`;
  ctx.fillStyle = '#FF0000';
  ctx.fillText('🇵🇭', Math.round(size * 0.75), Math.round(size * 0.25));

  return canvas.toBuffer('image/png');
}

try {
  // Create 192x192 icon
  const icon192 = createIcon(192);
  fs.writeFileSync('icon-192.png', icon192);
  console.log('✓ Created icon-192.png');

  // Create 512x512 icon
  const icon512 = createIcon(512);
  fs.writeFileSync('icon-512.png', icon512);
  console.log('✓ Created icon-512.png');

  // Create apple-touch-icon (180x180)
  const appleIcon = createIcon(180);
  fs.writeFileSync('apple-touch-icon.png', appleIcon);
  console.log('✓ Created apple-touch-icon.png');
} catch (error) {
  console.error('Error creating icons:', error.message);
  process.exit(1);
}
