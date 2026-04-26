# UniTrack Student Academic Management System

UniTrack is a full-stack student academic management system designed to help students track their semesters, subjects, tasks, and study sessions in a clean and organized dashboard.

## 🚀 Getting Started Locally

To run the project locally, you will need two separate terminal windows for the frontend and backend. 

### Backend (Node.js & Express)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will be running at:* **http://localhost:3000**

### Frontend (Angular 17)

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Start the Angular development server:
   ```bash
   npm start
   ```
   *The frontend will be running at:* **http://localhost:4200**

## 🔧 Troubleshooting

- **Database Connection Issues:** Ensure your Neon PostgreSQL database URI in `backend/.env` is valid and accessible.
- **Buttons Unclickable/UI Issues:** A known issue where the Angular default splash screen blocked interactions has been resolved. You should be able to seamlessly navigate the dashboard after logging in.

## 🛠️ Built With

- **Frontend:** Angular 17
- **Backend:** Node.js, Express, Prisma (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens)
- **AI Integration:** Groq SDK
- **File Storage:** Cloudinary