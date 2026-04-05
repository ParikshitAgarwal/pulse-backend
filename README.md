# Pulse Backend

## Clone & Install

```bash
git clone https://github.com/ParikshitAgarwal/pulse-backend.git
cd pulse-backend
npm install
```
## Environment Variables
Create a .env file in the root directory and add:

```bash
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/videodb
JWT_SECRET=your_super_secret_key_min_32_chars
NODE_ENV=development
MAX_FILE_SIZE=104857600
ALLOWED_ORIGIN=http://localhost:5173
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
```

## Run Backend
Development
```bash
npm run dev
```
Production
```bash
npm start
```

Server starts on http://localhost:5000
