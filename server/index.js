// Server entry point – loads env, connects DB, starts listening
require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { startCronJob } = require('./src/jobs/alertJob');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  startCronJob();
  app.listen(PORT, () => {
    console.log(`MediCabinet server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
