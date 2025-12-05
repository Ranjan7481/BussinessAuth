require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./src/models/Lead');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const leads = await Lead.find({}).limit(50).lean();
  console.log("Total leads fetched:", leads.length);
  leads.forEach(l => {
    console.log({
      _id: l._id?.toString(),
      title: l.title,
      vertexDocId: l.vertexDocId,
      csvFilePath: l.csvFilePath,
      phoneFieldPresent: !!(l.phone),
    });
  });
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
