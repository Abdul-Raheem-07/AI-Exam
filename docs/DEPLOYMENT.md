# AI Exam Checking System - Deployment Guide

This guide will walk you through deploying the AI Exam Checking System.

## Prerequisites

Ensure you have accounts for the following services:
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Database)
- [Cloudinary](https://cloudinary.com/) (Image Storage)
- [Google AI Studio](https://aistudio.google.com/) (Gemini API Key)
- [Render](https://render.com/) (Backend Hosting)
- [Vercel](https://vercel.com/) (Frontend Hosting)

---

## 1. Database Setup (MongoDB Atlas)
1. Create a new cluster on MongoDB Atlas.
2. In Network Access, whitelist `0.0.0.0/0` (Allow access from anywhere).
3. In Database Access, create a database user and copy the password.
4. Click "Connect", select "Connect your application", and copy the connection string (`MONGO_URI`).

## 2. Backend Deployment (Render)
1. Create a new "Web Service" on Render.
2. Connect your GitHub repository.
3. Set the Root Directory to `server`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add the following Environment Variables in Render:
   - `PORT` = `10000`
   - `MONGO_URI` = `<Your MongoDB connection string>`
   - `JWT_SECRET` = `<Any strong random string>`
   - `CLOUDINARY_CLOUD_NAME` = `<Your Cloudinary Cloud Name>`
   - `CLOUDINARY_API_KEY` = `<Your Cloudinary API Key>`
   - `CLOUDINARY_API_SECRET` = `<Your Cloudinary API Secret>`
   - `GEMINI_API_KEY` = `<Your Gemini API Key>`
7. Deploy the service and copy the provided Render URL (e.g., `https://ai-exam-backend.onrender.com`).

## 3. Frontend Deployment (Vercel)
1. In the `client` folder, open `src/context/AuthContext.jsx` and update the `axios.defaults.baseURL` to your Render backend URL:
   ```javascript
   axios.defaults.baseURL = 'https://ai-exam-backend.onrender.com/api';
   ```
   *(Note: For a better setup, you should use environment variables in Vite like `import.meta.env.VITE_API_URL`, but this works for direct edits).*
2. Push your code to GitHub.
3. Create a new project on Vercel and import your repository.
4. Set the Framework Preset to **Vite**.
5. Set the Root Directory to `client`.
6. Click **Deploy**.

## 4. Testing Edge Cases
Your system includes features designed to handle real-world scenarios:
- **Blurry Images/Empty Pages:** The Gemini prompt asks it to output confidence. If the image is blurry, confidence will drop, which alerts the teacher in the UI.
- **Malicious Uploads:** Multer restricts uploads to standard image formats and limits the file size to 10MB per file.
- **Render Free Tier Sleep:** The frontend includes a `WakeUpOverlay` that automatically detects when Render is starting up (which takes ~50s) and displays a friendly loading screen to the user instead of timing out.
