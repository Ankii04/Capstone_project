# ⚛️ MERN Team Project Management System

A premium, highly secure, and modern project and task management workspace built for teams. The application is completely dockerized, prepared for Kubernetes deployment, and configured with automated GitHub Actions CI/CD pipelines for cloud delivery.

---

## 🚀 1. Project Overview
The **Team Project Management System** allows team members to create projects, assign trackable tasks, toggle state changes, and organize operations under a high-end, responsive dark interface.

### Key Features:
* 🔒 **JWT-Based Authentication**: Secure registration and login workflows with cryptographic token tracking.
* 📂 **Project Workspace**: Custom cards with responsive state monitors and quick deletion drawers.
* 📋 **Dynamic Task Board**: Task allocation showing status badges (Todo, In Progress, Done) and priority flags (Low, Medium, High).
* 🎨 **Cosmic Glassmorphic Interface**: Custom HSL dark theme with input focus glow, floating borders, and responsive desktop/mobile styling.
* 🐳 **Cloud-Ready Containerization**: Standardized deployment configs for Docker, Docker Compose, Kubernetes, and GitHub Actions CI/CD.

---

## 🛠️ 2. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | ReactJS + Vite + React Router | Single-Page Application client-side view layer |
| **Backend** | Node.js + Express | Robust REST API server layer |
| **Database** | MongoDB | Highly flexible Document-oriented NoSQL storage |
| **Docker** | Multi-stage Dockerfiles | Consistent package delivery and small image footprint |
| **Kubernetes** | Minikube + Declarative YAML | Resilient orchestration with multi-replica scaling |
| **CI/CD** | GitHub Actions | Automated build, container push, and multi-stage deployment |
| **Deployment** | Render (Backend) + Vercel (Frontend) | Production-ready cloud web hosting |

---

## 💻 3. How to Run Locally

To boot up the stack on your development machine, ensure you have **Node.js** and **MongoDB** installed and running on port `27017`.

### A. Run Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Start the API server:
   ```bash
   node server.js
   ```
   *The server will boot on `http://localhost:5000`.*

### B. Run Frontend
1. Open a new terminal tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm start
   ```
   *The client will boot instantly on `http://localhost:3000`.*

---

## 🐳 4. How to Run with Docker Compose

Ensure Docker Desktop is installed and running on your host machine.

1. Build and run all services in detached mode from the root directory:
   ```bash
   docker-compose up --build -d
   ```
2. The services will spin up automatically:
   * **Database**: MongoDB running internally on port `27017`.
   * **Backend**: Express Server running on `http://localhost:5000`.
   * **Frontend**: React Nginx Server running on `http://localhost:3000`.
3. To shut down the services:
   ```bash
   docker-compose down
   ```

---

## ☸️ 5. How to Deploy on Kubernetes with Minikube

You can deploy the declarative multi-replica configuration locally using Minikube.

1. **Start Minikube**:
   ```bash
   minikube start
   ```
2. **Apply All Configurations**:
   Apply all YAML manifests inside the `k8s/` folder:
   ```bash
   kubectl apply -f k8s/
   ```
3. **Verify the Deployments**:
   Ensure all deployments and services are running:
   ```bash
   kubectl get all
   ```
4. **Access the Frontend**:
   Expose the frontend service to acquire a local URL:
   ```bash
   minikube service frontend-service
   ```
   *This command will launch your browser and navigate automatically to your active Kubernetes React application.*

---

## 🔒 6. GitHub Secrets Required

For the automated CI/CD pipeline to build, test, and release successfully on push to the `main` branch, configure the following secrets under **Settings > Secrets and variables > Actions** in your GitHub repository:

| Secret Name | Purpose | Example Value |
| :--- | :--- | :--- |
| `DOCKER_USERNAME` | Docker Hub Account Username | `yourdockerusername` |
| `DOCKER_PASSWORD` | Docker Hub Personal Access Token | `dckr_pat_...` |
| `RENDER_DEPLOY_HOOK_URL` | Render Deploy Hook link | `https://api.render.com/deploy/srv-...` |
| `VERCEL_TOKEN` | Vercel personal auth token | `vrcl_token_...` |
| `VERCEL_ORG_ID` | Vercel Account Org ID | `team_...` |
| `VERCEL_PROJECT_ID` | Vercel Project ID | `prj_...` |
