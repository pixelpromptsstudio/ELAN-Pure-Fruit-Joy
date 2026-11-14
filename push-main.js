const { execSync } = require('child_process');

console.log('Configuring buffer and pushing main branch to https://github.com/pixelpromptsstudio/ELAN-Pure-Fruit-Joy.git...');
try {
  execSync('git config http.postBuffer 524288000', { stdio: 'inherit' });
  execSync('git push origin main --force', { stdio: 'inherit' });
  console.log('SUCCESS: Pushed main branch!');
} catch (err) {
  console.error('Push failed:', err.message);
  process.exit(1);
}
