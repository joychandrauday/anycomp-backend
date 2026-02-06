// backend/src/server.ts
import 'reflect-metadata';
import dotenv from 'dotenv';
import App from './app';

dotenv.config();

const app = new App();
const expressApp = app.getInstance();

// IMPORTANT: Export for Vercel
export default expressApp;

// Only call listen if NOT running on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  expressApp.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  });
}