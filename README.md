# 🚀 Hackov8 - Complete Hackathon Management Platform

Production-ready hackathon platform built with **FastAPI**, **React**, and **MongoDB**.

## ✨ Key Features

- 🔐 **Dual Authentication**: Email/Password + Google OAuth
- 👥 **Multi-Role System**: Admin, Organizer, Judge, Participant
- 🏢 **Company Profiles**: Organizations can host hackathons
- 📊 **Complete Dashboards**: Role-specific interfaces
- 🎯 **Custom Judging**: Flexible rubrics and scoring
- 👥 **Team Management**: Invite codes and collaboration
- 📈 **Analytics**: Stats, leaderboards, CSV exports
- 🎨 **Modern UI**: Purple & black theme, glass-morphism
- 🔔 **Notifications**: In-app notification system
- 📱 **Responsive**: Works on all devices

## 🛠️ Tech Stack

**Backend:** FastAPI 0.110.1, Motor (MongoDB), PyJWT, Bcrypt
**Frontend:** React 19, Tailwind CSS, Shadcn/UI, Axios
**Database:** MongoDB 7.0

## 🚀 Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend
cd frontend && yarn install && yarn start
```

## 📊 User Roles

- **Participants**: Register, join teams, submit projects
- **Organizers**: Create hackathons, manage events
- **Judges**: Score submissions with rubrics
- **Admin**: Platform management, analytics, exports

## 🔌 API Highlights

- `/api/auth/*` - Authentication endpoints
- `/api/hackathons/*` - Hackathon CRUD
- `/api/teams/*` - Team management
- `/api/submissions/*` - Project submissions
- `/api/admin/*` - Admin operations

## 📝 License

MIT License

**Live Demo:** https://preview-hackov8.emergentagent.com
