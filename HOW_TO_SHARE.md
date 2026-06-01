# 📦 How to Share This Project

Your Docker setup is **working perfectly!** Here's how to send it to your friend:

## Step 1: Stop Docker
Press `Ctrl+C` in the terminal where docker-compose is running.

## Step 2: Prepare the Folder
1. **Delete these folders** to reduce size (Docker will recreate them):
   - `client/node_modules`
   - `server/node_modules`

2. **Keep these important files**:
   - `server/.env` ⚠️ **CRITICAL** - Contains your database credentials
   - `docker-compose.yml`
   - `DOCKER_INSTRUCTIONS.md`
   - All `Dockerfile` files

## Step 3: Create the Zip
Right-click the `Hostels` folder → Send to → Compressed (zipped) folder

## Step 4: Send to Your Friend
1. Send the zip file
2. Tell them to:
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Unzip the folder
   - Open terminal in the folder
   - Run: `docker-compose up --build`

## What They'll Get
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- Exact same setup as your system!

---

**Note**: The `.env` file contains sensitive data (database passwords, API keys). Send it securely or ask your friend to create their own with their credentials.
