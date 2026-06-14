````markdown
# 🚀 Virtual Classroom V2 - Developer Setup Guide

This guide contains all the commands required to run the Virtual Classroom microservice architecture, manage the databases, and inspect real-time data.

**⚠️ Security Note:** Ensure your `.env` files are added to your `.gitignore`. Never commit passwords, database URLs, or Client Secrets to version control.

---

## 🛠️ 1. Start the Infrastructure (Docker)

Before running the code, you must start the database layer. This single command spins up PostgreSQL, MongoDB, Redis, Keycloak, and MinIO in the background.

```bash
# Start all databases in detached mode
docker compose up -d postgres mongo redis keycloak minio
````

Wait about **10–15 seconds** for PostgreSQL and Keycloak to fully initialize.

---

## 🗄️ 2. Database Schema & Seeding (Postgres)

Once the databases are running, sync your Prisma schema to create your isolated application tables, and seed the initial Admin user.

```bash
# Navigate to the backend folder
cd backend

# Sync the Prisma Schema to Postgres (creates the 'app' schema tables safely)
npx prisma db push

# Seed the Admin user
npm run prisma:seed
```

---

## 🔐 3. Keycloak Authentication Setup (Critical)

Because Keycloak handles all security and identity, you must configure the Realm before the frontend and backend can communicate.

### Access Keycloak

Go to: http://localhost:8080/admin
Log in with your system admin credentials (defined in your root `.env`).

### Create Realm

* Click the top-left dropdown (currently **Master**)
* Click **Create Realm**
* Name it exactly: `virtual-classroom`

---

### Frontend Client (Fixes CORS Errors)

* Go to **Clients → Create client**
* **Client ID:** `virtual-classroom-frontend`
* **Valid Redirect URIs:**

  ```
  http://localhost:3000/*
  ```
* **Web Origins (CRITICAL):**

  ```
  http://localhost:3000
  ```

---

### Backend Client (Allows Backend to Provision Users)

* Go to **Clients → Create client**
* **Client ID:** `virtual-classroom-backend`
* Turn ON:

  * Client Authentication
  * Service Accounts Roles
* Save

Then:

* Go to **Credentials tab**
* Copy the **Client Secret**
* Paste it into your `backend/.env`

---

### Backend Permissions (Fixes 401 & 403 Errors)

* Inside backend client:

  * Go to **Service Accounts Roles**
  * Click **Assign Role**
  * Change filter to **Filter by clients**
  * Assign:

    * `manage-users`
    * `view-realm`
    * `manage-realm`

---

### Application Roles

* Go to **Realm Roles**
* Create:

  * `ADMIN`
  * `TEACHER`
  * `STUDENT`

---

### Create the Admin Account

* Go to **Users → Add User**

  * Email: `<YOUR_ADMIN_EMAIL>`

Then:

* Go to **Role Mapping → Assign ADMIN**
* Go to **Credentials**

  * Set password
  * TURN OFF **Temporary**
  * Save

---

### 💡 Troubleshooting 409 Conflict Errors

If the backend crashes while creating a user, it leaves behind a **"Ghost User"** in Keycloak.

* This causes: `409 (User Exists)`
* Fix:

  * Delete the user manually in Keycloak UI
  * Retry provisioning

---

## 💻 4. Start the Application

Open **two terminals**.

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

App runs at:
👉 http://localhost:3000

---

## 🔍 5. How to Inspect Your Databases

---

### 🐘 PostgreSQL (Users, Classrooms, Assignments)

Use Prisma GUI:

```bash
npx prisma studio
```

Opens at:
👉 http://localhost:5555

---

### 🍃 MongoDB (Chat Messages & NoSQL Data)

#### GUI Method (MongoDB Compass)

* Host: `localhost:27017`
* Username/Password: From `.env`
* Auth Database: `admin` ⚠️ (CRITICAL)

---

#### CLI Method

```bash
# Enter Mongo shell inside Docker
docker exec -it vc_mongo mongosh -u <YOUR_MONGO_USER> -p <YOUR_PASSWORD> --authenticationDatabase admin
```

```js
show dbs
use virtualclassroom
show collections
db.messages.find().pretty()
```

---

### ⚡ Redis (Real-time Presence & Sockets)

#### GUI Method (RedisInsight)

* Host: `localhost:6379`
* Password: From `.env`

---

#### CLI Method

```bash
# Enter Redis CLI inside Docker
docker exec -it vc_redis redis-cli -a <YOUR_PASSWORD>
```

```bash
KEYS *
GET "your:key:here"
```

---

### 📦 MinIO (File Storage / Object Buckets)

* URL: http://localhost:9001
* Credentials:

  * `MINIO_ROOT_USER`
  * `MINIO_ROOT_PASSWORD` (from `.env`)

Use this to view:

* Uploaded files
* Profile pictures
* Assignment PDFs

---

## ✅ You're All Set!

Your full microservice-based Virtual Classroom is now up and running 🚀

```
```