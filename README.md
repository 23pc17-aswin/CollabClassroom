# 🚀 Virtual Classroom V2

A high-performance, real-time collaborative learning platform designed for modern computer science education. This platform features live multiplayer code editing, real-time direct messaging, role-based access control, and a fully containerized microservices infrastructure.

---

## 🔐 1. Identity & Access Management (IAM)

Security and identity are baked into the core of the platform, utilizing enterprise-grade patterns to ensure data privacy and strict access control.

* **OAuth2 / OIDC Provider (Keycloak):** * All authentication is offloaded to a dedicated Keycloak server running in Docker. Keycloak handles password hashing, session management, and JWT (JSON Web Token) generation.
* **Just-In-Time (JIT) Provisioning:** * When a user logs in for the first time, the Node.js backend intercepts the JWT, verifies the cryptographic signature, and seamlessly provisions/syncs their Keycloak ID with the primary PostgreSQL database.
* **Role-Based Access Control (RBAC):**
  * **API Protection:** Custom middleware (`checkRole`) strictly guards backend routes based on three tiers: `ADMIN`, `TEACHER`, and `STUDENT`.
  * **UI Protection:** The React frontend dynamically hides/shows administrative panels, sharing controls, and grading features based on the verified user role.
* **Real-Time Identity Injection:**
  * **WebSockets:** Socket.io connections require a valid Keycloak token during the initial HTTP handshake before upgrading to a continuous connection.
  * **Yjs Awareness:** User identities, roles, and assigned colors are securely injected into the Yjs CRDT engine, generating verified nametags for live cursors in the code editor.

---

## 💻 2. Web & Application Architecture

The application layer is split between a React/Vite frontend and an Express/Node.js backend, heavily optimized for real-time, low-latency communication.

### Real-Time Collaboration Engine
* **Multiplexed WebSockets (The Traffic Cop):** The Node.js server intercepts raw HTTP `upgrade` requests, stripping default listeners to manually route traffic. `/collaboration` traffic is sent to a headless Yjs server, while `/socket.io` traffic goes to the chat engine.
* **Live Code Editor:** Integrates Monaco Editor with `y-monaco` and `y-websocket`, allowing multiple students and teachers to type simultaneously with zero-conflict resolution (CRDTs).
* **In-Browser Execution Sandbox:** Includes a native JavaScript execution environment that safely intercepts `console.log` commands to run code directly in the browser, outputting to a custom interactive terminal panel.

### Private Direct Messaging (DMs)
* **Global Real-Time Chat:** Utilizes Socket.io to route private messages (`dm:send`, `dm:message`) instantly between connected clients, bypassing the need for page reloads.
* **Cross-Database Aggregation:** Generates a "Recent Chats" sidebar by running complex MongoDB aggregation pipelines to find the latest messages, and joining that data with user profiles stored in PostgreSQL.
* **Smart Notifications:** Integrates `react-hot-toast` to provide cross-app notifications when a user receives a DM while navigating other parts of the dashboard.

### API & Data Fetching
* **RESTful Standards:** Clean, modularized Express routers (`/api/v2/...`) for handling classrooms, assignments, and user profiles.
* **React Query / Axios:** Frontend data fetching is highly optimized, using interceptors to automatically attach Bearer tokens to every outgoing request.

---

## ☁️ 3. Cloud & Infrastructure

The platform is designed to be cloud-native, highly available, and easily deployable using container orchestration.

* **Containerization (Docker Compose):** * The entire infrastructure stack is codified in a `docker-compose.yml` file, allowing one-click deployment of all databases, auth servers, and object storage.
* **Polyglot Persistence (Multi-Database Strategy):**
  * **PostgreSQL (via Prisma ORM):** The highly relational source of truth for Users, Classrooms, Assignments, and Grades.
  * **MongoDB (via Mongoose):** Document-based storage optimized for high-velocity, unstructured data like Chat History and System Notifications.
* **Horizontal Scaling (Redis):** * A Redis container acts as a Pub/Sub adapter for Socket.io. This ensures that if the backend is scaled to multiple Node.js instances, a message sent to a socket on Server A is instantly broadcasted to a user connected to Server B.
* **Object Storage (MinIO):**
  * An S3-compatible MinIO container is deployed for handling assignment attachments, profile pictures, and file submissions, fully decoupled from the application servers.

---

## 🛠️ Tech Stack Summary

* **Frontend:** React, Vite, Tailwind CSS, Monaco Editor, Zustand, React Router, Socket.io-client.
* **Backend:** Node.js, Express, Socket.io, Yjs/y-websocket, Prisma, Mongoose.
* **Infrastructure:** Docker, Keycloak, PostgreSQL, MongoDB, Redis, MinIO.