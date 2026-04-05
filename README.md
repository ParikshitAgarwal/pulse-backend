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

## MongoDB Atlas Setup

1.	Go to mongodb.com/atlas and create a free M0 cluster
2.	Create a database user with read/write permissions
3.	Go to Network Access > Add IP Address > Allow from Anywhere (0.0.0.0/0)
4.	Copy the connection string and set it as MONGO_URI in .env


## Vercel Blob Storage Setup

1.	Go to vercel.com and create or open your project
2.	Navigate to Storage tab > Create > Blob Store
3.	Name the store "your-videos-blob" and create it
4.	Copy BLOB_READ_WRITE_TOKEN from Settings and add to .env

