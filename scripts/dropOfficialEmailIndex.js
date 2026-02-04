/**
 * One-time script to drop the orphaned officialEmail_1 index from schools.
 * Run: node scripts/dropOfficialEmailIndex.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      await mongoose.connection.db.collection('schools').dropIndex('officialEmail_1');
      console.log('Dropped index officialEmail_1');
    } catch (e) {
      if (e.code === 27 || e.message?.includes('index not found')) {
        console.log('Index officialEmail_1 does not exist (already dropped)');
      } else {
        throw e;
      }
    }
  })
  .catch((e) => {
    console.error('Failed:', e.message);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
    process.exit(0);
  });
