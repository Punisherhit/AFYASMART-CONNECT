// generateSecret.js
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log('\n🔥🔥🔥 COPY THIS JWT SECRET 🔥🔥🔥');
console.log(secret);
console.log('🔥🔥🔥 PASTE IT IN YOUR .env FILE 🔥🔥🔥\n');