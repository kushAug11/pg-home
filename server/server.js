const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');

// Start Server conditionally after DB connection
const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Seed Admin (Required for In-Memory DB)
  const seedAdmin = require('./src/utils/seedAdmin');
  await seedAdmin();

  // Start Scheduler
  const { initRentReminders } = require('./src/services/scheduler.service');
  initRentReminders();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Initialize Socket.io
  const { initSocket } = require('./src/services/socket.service');
  initSocket(server);
};

startServer();
