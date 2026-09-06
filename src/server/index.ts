import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Central Enterprise Backend API Server running on port ${PORT}`);
  console.log(`📡 Base API Endpoint: http://localhost:${PORT}/api/v1`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
});
