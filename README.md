# ⚡ AEGIS — Advanced Exam Guardrail Integrity System

> A production-ready exam integrity platform with browser-based proctoring, real-time violation detection, and an enterprise-grade auditor dashboard.

---

## 🏗 System Architecture

```
AEGIS/
├── sentinel-extension/     # Chrome Extension (Manifest v3)
├── backend/                # Node.js + Express + MongoDB + Socket.io
├── auditor-dashboard/      # Next.js + TailwindCSS Dashboard
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (running locally on port 27017)
- Google Chrome (for extension)

### 1. Clone / Extract

```bash
unzip AEGIS.zip
cd AEGIS
```

### 2. Install All Dependencies

```bash
npm install          # installs root concurrently
npm run install:all  # installs backend + dashboard deps
```

### 3. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod --dbpath /data/db
```

### 4. Seed Demo Data

```bash
npm run seed
```

This creates:
- **3 admin accounts** (super admin, proctor, auditor)
- **10 demo students** (S101–S110) with varied trust scores
- **Demo exam session** (EXAM-CS501)
- **Realistic violation records**

### 5. Run Everything

```bash
npm run dev
```

Or run separately:

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Dashboard
npm run dev:dashboard
```

---

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:5000 |
| Auditor Dashboard | http://localhost:3000 |
| Health Check | http://localhost:5000/health |

---

## 🔐 Demo Credentials

### Admin Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@aegis.local | admin123 |
| Proctor | proctor@aegis.local | proctor123 |
| Auditor | auditor@aegis.local | auditor123 |

### Demo Students

| Student ID | Name | Trust Score |
|------------|------|-------------|
| S101 | Aditya Kumar | ~98 (Trusted) |
| S104 | Sneha Pillai | ~55 (Suspicious) |
| S105 | Kiran Rao | ~25 (High Risk) |
| S108 | Divya Krishnan | ~0 (High Risk) |

---

## 🔌 Loading the Chrome Extension

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `AEGIS/sentinel-extension/` folder
5. The AEGIS Sentinel extension will appear in your toolbar

### Starting a Monitor Session

1. Click the AEGIS extension icon in Chrome toolbar
2. Enter a **Student ID** (e.g., `S101`) and **Exam ID** (e.g., `EXAM-CS501`)
3. Click **▶ Start Monitoring**
4. The extension begins monitoring:
   - Keyboard shortcuts
   - Tab switching
   - Clipboard activity
   - Camera (face detection)
   - Microphone (voice detection)
   - DevTools detection
   - Fullscreen enforcement

---

## 📡 API Reference

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@aegis.local", "password": "admin123" }
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "name": "Dr. Priya Sharma", "role": "SUPER_ADMIN" }
}
```

---

### Submit Violation

```http
POST /api/violations
X-AEGIS-Extension: sentinel-v1
Content-Type: application/json

{
  "studentId": "S101",
  "examId": "EXAM-CS501",
  "violation": "TAB_SWITCH",
  "duration": 8,
  "timestamp": "2026-03-13T10:21:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "penalty": 5,
  "trustScore": 95,
  "riskLevel": "TRUSTED"
}
```

---

### Get All Students

```http
GET /api/students
Authorization: Bearer <token>
```

---

### Get Student Detail

```http
GET /api/student/S101
Authorization: Bearer <token>
```

---

### Get Student Violations

```http
GET /api/violations/S101
Authorization: Bearer <token>
```

---

### Get System Stats

```http
GET /api/stats
Authorization: Bearer <token>
```

---

## 🎯 Violation Types & Penalties

| Violation | Penalty |
|-----------|---------|
| MULTIPLE_FACES | -20 pts |
| DEVTOOLS_OPEN | -15 pts |
| CAMERA_DISABLED | -15 pts |
| PAGE_UNLOAD | -15 pts |
| BACKGROUND_CONVERSATION | -12 pts |
| PRINT_SCREEN | -10 pts |
| NAVIGATION_CHANGE | -10 pts |
| NO_FACE | -10 pts |
| COPY_ATTEMPT | -8 pts |
| PASTE_ATTEMPT | -8 pts |
| MICROPHONE_DISABLED | -8 pts |
| VOICE_DETECTED | -5 pts |
| TAB_SWITCH | -5 pts |
| FULLSCREEN_EXIT | -5 pts |
| KEYBOARD_SHORTCUT | -5 pts |
| CUT_ATTEMPT | -5 pts |
| CAMERA_OBSTRUCTED | -10 pts |
| WINDOW_BLUR | -3 pts |
| IDLE_DETECTED | -3 pts |
| TAB_HIDDEN | -3 pts |
| RIGHT_CLICK | -2 pts |

## 📊 Trust Score & Risk Levels

| Score | Risk Level |
|-------|-----------|
| 90–100 | ✅ TRUSTED |
| 70–89 | ⚠️ SUSPICIOUS |
| 0–69 | 🔴 HIGH RISK |

---

## 🧪 Testing Violations Manually

You can simulate violations via curl:

```bash
# Tab Switch
curl -X POST http://localhost:5000/api/violations \
  -H "Content-Type: application/json" \
  -H "X-AEGIS-Extension: sentinel-v1" \
  -d '{"studentId":"S101","examId":"EXAM-CS501","violation":"TAB_SWITCH","duration":5}'

# Copy Attempt
curl -X POST http://localhost:5000/api/violations \
  -H "Content-Type: application/json" \
  -H "X-AEGIS-Extension: sentinel-v1" \
  -d '{"studentId":"S101","examId":"EXAM-CS501","violation":"COPY_ATTEMPT"}'

# DevTools
curl -X POST http://localhost:5000/api/violations \
  -H "Content-Type: application/json" \
  -H "X-AEGIS-Extension: sentinel-v1" \
  -d '{"studentId":"S101","examId":"EXAM-CS501","violation":"DEVTOOLS_OPEN"}'

# Multiple Faces
curl -X POST http://localhost:5000/api/violations \
  -H "Content-Type: application/json" \
  -H "X-AEGIS-Extension: sentinel-v1" \
  -d '{"studentId":"S101","examId":"EXAM-CS501","violation":"MULTIPLE_FACES"}'
```

Watch the dashboard update in real-time via Socket.io!

---

## 🛠 Technology Stack

### Extension (sentinel-extension/)
- Chrome Extension Manifest v3
- WebRTC for camera access
- Web Audio API for microphone monitoring
- Canvas API for face detection heuristics

### Backend (backend/)
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time streaming)
- JWT Authentication
- bcryptjs (password hashing)

### Dashboard (auditor-dashboard/)
- Next.js 14 (App Router)
- React + TypeScript
- TailwindCSS
- Framer Motion (animations)
- Recharts (data visualization)
- Socket.io-client (real-time)
- jsPDF + jspdf-autotable (PDF export)

---

## 📁 File Structure

```
AEGIS/
├── package.json                    # Root runner
├── README.md
│
├── sentinel-extension/
│   ├── manifest.json
│   ├── background.js               # Service worker
│   ├── content/
│   │   └── sentinel.js             # Main content script
│   ├── camera/
│   │   └── faceMonitor.js          # WebRTC face detection
│   ├── audio/
│   │   └── voiceMonitor.js         # Web Audio API
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   ├── utils/
│   │   └── eventLogger.js
│   └── icons/
│
├── backend/
│   ├── server.js
│   ├── .env
│   ├── config/db.js
│   ├── models/
│   │   ├── Student.js
│   │   ├── Admin.js
│   │   ├── Violation.js
│   │   └── ExamSession.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── violationController.js
│   │   └── studentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── violations.js
│   │   └── students.js
│   ├── services/
│   │   └── trustScoreEngine.js
│   ├── socket/
│   │   └── socketServer.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── seed/
│       └── seedData.js
│
└── auditor-dashboard/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── login/page.tsx
    │   ├── dashboard/page.tsx
    │   └── students/[id]/page.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   ├── AnalyticsCards.tsx
    │   ├── StudentTable.tsx
    │   ├── TrustScoreGauge.tsx
    │   ├── ViolationTimeline.tsx
    │   └── HeatmapChart.tsx
    ├── services/
    │   └── api.ts
    └── styles/
        └── globals.css
```

---

## 🔧 Configuration

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aegis
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Extension (background.js)

Change `BACKEND_URL` to your backend server URL if not running locally:
```js
const BACKEND_URL = 'http://localhost:5000'; // Line 4
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | #0B0F19 |
| Card | #121826 |
| Accent | #4F9CF9 |
| Success | #22C55E |
| Warning | #FACC15 |
| Danger | #EF4444 |
| Muted | #64748B |

---

## 📄 PDF Report Export

From any student detail page, click **"Export PDF"** to generate a credibility report containing:

- Student information
- Trust score and risk level
- Complete violation log
- Severity breakdown
- Timestamp and exam metadata

---

## ⚠️ Important Notes

1. **Camera & Microphone**: The extension requests camera and microphone permissions. Students must grant access for full monitoring.

2. **HTTPS in Production**: WebRTC requires HTTPS in production environments. Use a reverse proxy (nginx) with SSL.

3. **Face Detection**: Uses lightweight canvas-based skin-tone heuristics. For production, integrate a proper ML face detection library (e.g., face-api.js).

4. **Extension Icons**: Placeholder PNG icons are generated automatically. Replace with properly designed 16×16, 48×48, and 128×128 icons for production.

---

## 📜 License

AEGIS is intended for educational and institutional exam integrity purposes.

---

*Built with ⚡ by the AEGIS Team*
