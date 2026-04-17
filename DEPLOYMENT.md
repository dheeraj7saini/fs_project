# Deployment Guide

## Architecture

- Frontend: Vercel
- Backend: Render
- Database: MySQL

## 1. Deploy the backend to Render

Create a new Web Service from this repo and point the root directory to `backend`.

Recommended values:

- Runtime: `Java`
- Build command: `mvn clean package -DskipTests`
- Start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`

Set these environment variables in Render:

- `DB_URL=jdbc:mysql://<host>:3306/foodapp`
- `DB_USERNAME=<your-db-user>`
- `DB_PASSWORD=<your-db-password>`
- `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`

After deploy, note the backend URL, for example:

- `https://quickbite-backend.onrender.com`

## 2. Deploy the frontend to Vercel

Import the same repo into Vercel and set the root directory to `Frontend`.

Framework settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in Vercel:

- `VITE_API_BASE_URL=https://<your-render-backend-domain>`

## 3. Update backend CORS

After Vercel gives you a production domain, update Render:

- `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`

If you use both preview and production domains, add both separated by commas:

- `CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main-your-team.vercel.app`

## 4. Redeploy both services

- Redeploy Render after setting environment variables
- Redeploy Vercel after setting `VITE_API_BASE_URL`

## 5. Test the deployed app

Check:

- frontend loads shop data
- customer login works
- vendor login works
- placing orders works
- vendor dashboard can update orders and add menu items
