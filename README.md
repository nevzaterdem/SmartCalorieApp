# 🍎 SmartCalorieApp

**AI-Powered Smart Lifestyle and Health Assistant**

SmartCalorieApp is an end-to-end integrated ecosystem designed to help users achieve their healthy living goals using modern technologies. With its mobile application (iOS/Android) and desktop/web interfaces, you can access your data from anywhere and receive personalized diet recommendations powered by **Google Gemini AI**.

---

## ✨ Key Features

### 🧠 AI Support
*   **Smart Diet Planning**: Automatic creation of diet lists tailored to the user's physical attributes and goals.
*   **Visual Analysis (Planned)**: Potential for calorie estimation from food photos.

### 📱 Mobile Experience (React Native)
*   **Fast & Fluid UI**: Modern, responsive design built with NativeWind.
*   **Easy Tracking**: Daily tracking of calories, water intake, and macro-nutrients (Protein, Carbs, Fat).
*   **Mobile Integrations**: Full compatibility with camera and notification services.

### 💻 Web and Desktop (React & Electron)
*   **Large Screen Management**: Detailed charts and reports for long-term progress tracking.
*   **Desktop App**: Native-like performance on desktop via Electron.

### 🔄 Robust Infrastructure
*   **Real-Time Data**: Instant data synchronization across all platforms.
*   **Secure Authentication**: JWT-based secure session management.

---

## 🛠️ Tech Stack

This project is built with the latest technologies, prioritizing scalability and performance.

| Area | Technologies |
|------|--------------|
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL (Recommended) |
| **Frontend** | React, Vite, TailwindCSS, Electron, Recharts, Lucide Icons |
| **Mobile** | React Native, Expo SDK 54, Expo Router, NativeWind |
| **Artificial Intelligence** | Google Gemini AI |
| **Security** | Bcrypt, JWT (JSON Web Tokens) |

---

## 📂 Project Architecture

```bash
SmartCalorieApp/
├── backend/        # RESTful API services and business logic
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API endpoints
│   │   └── services/    # AI and database services
│   └── prisma/          # Database schemas
├── frontend/       # Web and Desktop user interface
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   └── pages/       # Application pages
└── mobile/         # Cross-platform mobile application
    ├── app/             # Expo Router based page structure
    └── components/      # Mobile-compatible UI components
```

---

## 🏁 Installation & Development Guide

Follow these steps to set up the project in your local environment.

### 1. Backend Setup
Before starting the backend service, you need to configure the environment variables.

```bash
cd backend
npm install
```
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smartcalorie"
JWT_SECRET="your_strong_secret_key"
GEMINI_API_KEY="your_google_gemini_api_key"
PORT=3000
```
Then start the service:
```bash
npm run dev
```

### 2. Frontend (Web/Desktop)
To develop the web interface or run it as an Electron desktop app:

```bash
cd frontend
npm install
npm run dev
```

### 3. Mobile Application
To test on iOS/Android simulator or a physical device:

```bash
cd mobile
npm install
npm start
```
*   **Physical Device**: Download the **Expo Go** app on your phone and scan the QR code from the terminal.

---

## 📄 License and Copyrights

⚠️ **LEGAL NOTICE: ALL RIGHTS RESERVED.**

The ownership of this software, its source code, designs, and documentation belongs entirely to **Nevzat Erdem**.

1.  **No Copying**: The code of this project cannot be copied, reproduced, or used in another project without permission.
2.  **No Distribution**: Source codes cannot be shared on public or private platforms without permission.
3.  **No Modification**: Unauthorized modification of the source code or creation of derivative works is prohibited.
4.  **No Commercial Use**: Cannot be used for commercial purposes without written permission.

For any licensing requests, collaboration, or permissions, please contact the developer directly.

**Copyright © 2026 Nevzat Erdem. All Rights Reserved.**
