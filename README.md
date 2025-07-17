# QA Time Tracker

A modern, Firebase-powered time tracking web app built for QA teams.  
Team members can log daily tasks, update their current work status, and keep a consistent work history — while the team lead (admin) has full visibility and control via an admin dashboard.

---

## 🚀 Purpose

This project is designed to help QA teams stay organized and accountable with:

- Daily task logging
- Real-time activity tracking
- Admin-only oversight
- Weekly/monthly report generation

The goal is to provide a **private, secure, and easy-to-use time tracker** tailored specifically for QA workflows — without the clutter of generic time-tracking tools.

---

## 🧑‍💻 Key Features

### For QA Team Members:
- 🔐 Firebase Auth (secure login)
- 📝 Log tasks with title, description, start/end time
- ⏱️ Update current activity ("What I’m doing now")
- 👀 Access only your own data

### For Admin (QA Lead):
- 📊 View all team members' time logs and live statuses
- 📆 Filter logs by user and by week/month
- 📤 Export logs as downloadable CSV files
- 🔒 Admin-only access to all reports and overviews

---

## 🛠️ Tech Stack

- **Frontend:** React or Next.js
- **Backend:** Firebase Authentication & Firestore
- **CSV Export:** `papaparse` or `json2csv`
- **Hosting:** Firebase Hosting or Vercel

---

## 🔒 Security

- Role-based access control (user vs admin)
- Firestore rules enforce privacy — users can only access their own data
- Admin can read all logs and statuses

---

## 📦 Setup (Coming Soon)

Instructions to run the project locally will be added soon.

---

## 📄 License

This project is for internal use by QA teams. Open to extension and customization.