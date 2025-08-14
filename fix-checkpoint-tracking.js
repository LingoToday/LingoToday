// This script simulates clearing checkpoint notification tracking
// Run this in the browser console to reset the tracking

// Clear checkpoint notification tracking
localStorage.removeItem('lastCheckpointNotificationDate');
localStorage.removeItem('lastShownCheckpointId');

console.log('✅ Checkpoint notification tracking cleared!');
console.log('You should no longer see repeated "Basic Greetings Review" notifications.');
console.log('The next checkpoint notification will only appear once per day.');