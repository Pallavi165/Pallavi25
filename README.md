# ✦ EvenTiamo — College Event Management System

![EvenTiamo Banner](images/hero.jpg)

**EvenTiamo** is a modern, web-based College Event Management System designed to centralize and elevate campus festival organization, student registrations, instant digital QR pass ticketing, and gate check-in workflows.

---

## ✨ Key Features & Capabilities

### 🎓 Student Experience
- **Live Event Discovery**: Browse campus festivals, music concerts, cultural galas, and fashion showcases with real-time seat capacity bars and category filtering.
- **Instant Digital QR Passes**: Immediate visual e-ticket generation upon registration with unique Ticket ID (e.g. `ET-FUS-7821`).
- **1-Click Calendar Export**: Add events directly to Google Calendar or download `.ics` calendar passes for Apple Calendar & Outlook.
- **Interactive Lineup & Timelines**: Full schedule breakdown, countdown clocks, directions to venues, and event FAQ accordions.
- **Lightbox Gallery**: High-resolution campus life photo gallery with modal zoom viewer.

### 🔐 Organizer & Admin Intelligence Console
- **Session-Authenticated Dashboard**: Secure login via Admin PIN (`9999`) with session persistence.
- **Live Attendance KPI Cards**: Real-time counts for Total Registrations, Verified Check-Ins, Turnout Rate %, and Active Events.
- **Interactive Visual Analytics**:
  - Doughnut Chart: Checked-In vs Pending ratio.
  - Bar Chart: Event-wise registration turnout comparison.
- **Event Creator**: Dynamically create new campus events and competitions.
- **Attendee Directory**: Real-time search by name, email, department, or ticket ID with multi-status filters.
- **Digital Certificate of Participation**: Instant generation and printing of verified participation certificates for attendees.
- **One-Click CSV Export**: Download the full attendee directory with timestamps and check-in statuses.

### 🎫 Gate Check-In QR Scanner
- **Fast Camera Scanner**: Mobile-optimized viewfinder supporting camera flipping (Rear/Front).
- **Audio Feedback**: Synthesized Web Audio chimes for successful check-ins and warning buzzes for duplicate/invalid passes.
- **Attendee Verification Card**: Instant display of attendee name, student ID/department, event name, and check-in time.
- **Manual Fallback**: Quick ticket lookup for attendees without camera access.
- **Live Check-In Stream**: Real-time feed of scanned attendees during entry rush.

---

## 🏛️ System Architecture

EvenTiamo operates on a resilient **Hybrid 3-Tier Architecture**:

1. **Presentation Layer**: HTML5, CSS3 (Obsidian Gold Glassmorphism Design System), JavaScript ES6+.
2. **Business Logic & State Layer**: 
   - `EvenTiamoStore` client-side offline/demo synchronization with `localStorage`.
   - Web Audio API for gate audio feedback.
   - SVG/Canvas QR Code & Certificate Generator engines.
3. **Backend & Cloud Layer**:
   - Google Apps Script webhooks for spreadsheet sync and email dispatch.

---

## 🚀 Quick Start & Local Usage

1. Open `index.html` in any modern web browser, or launch a local web server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node.js
   npx serve .
   ```
2. Navigate to `http://localhost:8000`.

### 🔑 Default Credentials
- **Admin Dashboard**: `admin.html`
- **Default Admin PIN**: `9999`

---

## 📁 Project Structure

```
EvenTiamo/
├── index.html         # Main Landing Page (Hero, Event Grid, Features, Gallery)
├── fusion.html        # Fusion 2K24 Event Details & Registration
├── ethnic.html        # Ethnic Utsav Cultural Gala Details & Registration
├── glam.html          # Glam Icon Fashion Show Details & Registration
├── admin.html         # Organizer Admin Dashboard & Analytics
├── checkin.html       # Mobile Gate QR Scanner Portal
├── style.css          # Master Obsidian Gold & Glassmorphic CSS Design System
├── script.js          # Unified Frontend Logic, Ticketing & Store Engine
├── admin.js           # Admin Dashboard Controller & Chart.js Visualizer
├── images/            # Extracted Event Assets & Photography
│   ├── hero.jpg
│   ├── fusion.jpg
│   ├── ethnic.jpg
│   ├── glam.jpg
│   ├── dj.jpg
│   └── ...
└── README.md          # Project Documentation
```

---

## 🛡️ License & Credits
Developed for academic institutions and campus life empowerment.  
© 2025 EvenTiamo. All rights reserved.
