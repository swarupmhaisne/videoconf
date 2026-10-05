<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a7f64,100:0969da&height=200&section=header&text=Meetora&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Real-Time%20Video%20Conferencing%20App&descAlignY=58&descSize=20" width="100%"/>

<br/>

<!-- Tech badges -->
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=20232A"/>
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white&labelColor=1a1a1a"/>
<img src="https://img.shields.io/badge/Socket.IO-4.7-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
<img src="https://img.shields.io/badge/WebRTC-P2P-FF6B35?style=for-the-badge&logo=webrtc&logoColor=white&labelColor=333"/>
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white&labelColor=1a1a1a"/>

<br/><br/>

<!-- Status badges -->
<img src="https://img.shields.io/badge/Status-Live-1a7f64?style=flat-square"/>
<img src="https://img.shields.io/badge/License-MIT-0969da?style=flat-square"/>
<img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square"/>
<img src="https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square"/>

<br/><br/>

**Meetora** is a full-stack, full-stack real-time video conferencing platform where browsers connect directly peer-to-peer using **WebRTC** — no third-party video SDKs, no Twilio, no Agora. Just raw browser APIs, a Node.js signalling server, and real-time Socket.IO.

<br/>

[🚀 Quick Start](#-getting-started) · [🏗 Architecture](#-architecture) · [📡 API](#-api-reference) · [🔌 Socket Events](#-socketio-events)

</div>

---

## 📸 Demo

<div align="center">

| Landing Page | Meeting Room | In-Meeting Chat |
|:---:|:---:|:---:|
| Clean public landing with guest join | Multi-participant Real-Time Video & Audio + controls | Real-time chat with message history |

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Meeting Features
- 📹 **Real-Time Video & Audio** — Multi-participant live streams with individual camera/mic toggle
- 🖥 **Screen Sharing** — Broadcast your screen to all room participants
- 💬 **In-Meeting Chat** — Real-time messages, **replayed to late joiners** from server memory
- 🔇 **Media Controls** — Toggle camera and mic independently mid-call
- 📋 **Shareable Codes** — Auto-generated `MEET-XXXXXX` codes, one-click copy

</td>
<td width="50%">

### 👤 User & Session Features
- 🔐 **Authentication & Sessions** — bcrypt-hashed passwords, random hex session tokens
- 📅 **Meeting History** — Every session logged to the authenticated user's account
- 🔗 **Instant Links** — Copy full meeting URL to clipboard and share in seconds
- 👥 **Guest Access** — Join any room without an account via direct meeting URL
- 🛡 **Protected Routes** — `withAuth` HOC guards dashboard and history pages

</td>
</tr>
</table>

---

## 🏗 Architecture

> Meetora implements the WebRTC **signalling server pattern** from scratch. The Node.js server **never touches media** — it only relays SDP offers, SDP answers, and ICE candidates so browsers can negotiate a direct peer-to-peer connection.

```
┌─────────────────────┐         ┌──────────────────────────┐         ┌─────────────────────┐
│      Browser A      │         │      Node.js Server       │         │      Browser B      │
│  ─────────────────  │         │  ──────────────────────   │         │  ─────────────────  │
│  React + WebRTC     │◄─ WS ──►│  Socket.IO  (signals)    │◄─ WS ──►│  React + WebRTC     │
│  Socket.IO client   │         │  Express    (REST API)    │         │  Socket.IO client   │
│  Camera / Mic /     │         │  Room state (in-memory)   │         │  Camera / Mic /     │
│  Screen capture     │         │  Chat relay (in-memory)   │         │  Screen capture     │
└─────────────────────┘         │  Auth/History (MongoDB)   │         └─────────────────────┘
          │                     └──────────────────────────┘                     │
          │                                                                       │
          └──────────────────── WebRTC P2P (media streams) ─────────────────────┘
                          Video · Audio · Screen — browser to browser
```

### How a call is established

```
Peer A joins room          Peer B joins room
      │                          │
      ▼                          ▼
 [join-call] ──────────► Server tracks socket IDs
                               │
                               ▼
               [user-joined] broadcast to all peers
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             Peer A creates         Peer B receives
             RTCPeerConnection      RTCPeerConnection
                    │
                    ▼
             SDP offer created
                    │
              [signal] ────────────────► relayed to Peer B
                                              │
                                              ▼
                                       SDP answer created
                                              │
                              [signal] ◄─────  relayed to Peer A
                                    │
                         ICE candidates exchanged
                                    │
                         ◄── Direct P2P media ──►
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Role |
|:---|:---:|:---|
| **React** | 18.2 | UI framework with hooks |
| **React Router** | v6 | Client-side routing (`createBrowserRouter`) |
| **MUI (Material UI)** | v5 | Component library — `IconButton`, `Badge`, `TextField` |
| **WebRTC API** | Native | `RTCPeerConnection`, `getUserMedia`, `getDisplayMedia` |
| **Socket.IO Client** | 4.7 | WebSocket transport for signalling and chat |
| **Axios** | 1.6 | HTTP REST API calls with base URL config |

### Backend
| Technology | Version | Role |
|:---|:---:|:---|
| **Node.js** | ≥18 (ESM) | Runtime with ES module syntax (`import`/`export`) |
| **Express** | 4.18 | HTTP server + REST API routing |
| **Socket.IO** | 4.7 | WebSocket server — room tracking, signal relay, chat |
| **Mongoose** | 8.0 | MongoDB ODM — User and Meeting schemas |
| **bcrypt** | 5.1 | Password hashing (salt rounds = 10) |
| **crypto** | built-in | `randomBytes(20)` for session token generation |

---

## 📁 Project Structure

```
meetora/
│
├── backend/
│   ├── package.json                    ← ESM ("type": "module"), nodemon dev script
│   └── src/
│       ├── app.js                      ← Express setup, CORS, MongoDB connect, server listen
│       │
│       ├── controllers/
│       │   ├── socketManager.js        ← ALL real-time logic:
│       │   │                               connections{} room map (socketId arrays)
│       │   │                               messages{}   chat history per room
│       │   │                               timeOnline{} join timestamp per socket
│       │   │                               Events: join-call · signal · chat-message · disconnect
│       │   │
│       │   └── user.controller.js      ← REST handlers: login · register · getUserHistory · addToHistory
│       │
│       ├── models/
│       │   ├── user.model.js           ← { name, username, password (hashed), token }
│       │   └── meeting.model.js        ← { user_id, meetingCode, date (auto) }
│       │
│       └── routes/
│           └── users.routes.js         ← /register  /login  /get_all_activity  /add_to_activity
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.js                      ← Route map: /  /auth  /home  /:meetingId  /history
        ├── environment.js              ← Exports backend base URL string
        │
        ├── contexts/
        │   └── AuthContext.jsx         ← React context: handleLogin · handleRegister
        │                                  getHistoryOfUser · addToUserHistory
        │
        ├── pages/
        │   ├── landing.jsx             ← Public hero page (guest join + auth CTA)
        │   ├── authentication.jsx      ← Toggle login / register form
        │   ├── home.jsx                ← Protected dashboard: create + join meeting
        │   ├── VideoMeet.jsx           ← ★ Core: WebRTC, Socket.IO, media controls, chat UI
        │   └── history.jsx             ← User's past meeting codes + dates
        │
        └── utils/
            └── withAuth.jsx            ← HOC: checks localStorage token, redirects to /auth
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **MongoDB** URI — [MongoDB Atlas free tier](https://www.mongodb.com/atlas) works perfectly

---

### 1 · Clone

```bash
git clone https://github.com/your-username/meetora.git
cd meetora
```

---

### 2 · Backend setup

```bash
cd backend
npm install
```

Open `backend/src/app.js` and swap in your MongoDB connection string:

```js
// Replace this line:
await mongoose.connect("mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/")
```

```bash
npm run dev     # nodemon — auto-restarts on file changes
# or
npm start       # node — production
```

> ✅ Backend starts at **http://localhost:8000**

---

### 3 · Frontend setup

```bash
cd ../frontend
npm install
```

Open `frontend/src/environment.js` and confirm the backend URL:

```js
export default "http://localhost:8000";
```

```bash
npm start
```

> ✅ Frontend starts at **http://localhost:3000**

---

### 4 · Open the app

1. Go to `http://localhost:3000`
2. Register an account at `/auth`
3. Create a meeting from the Home dashboard — you'll get a `MEET-XXXXXX` code
4. Share the code or link with someone else (or open in a second browser tab)
5. Both parties join → WebRTC negotiation happens automatically → video call starts

---

## 📡 API Reference

**Base URL:** `http://localhost:8000/api/v1/users`

| Method | Endpoint | Body / Params | Response | Description |
|:---:|:---|:---|:---|:---|
| `POST` | `/register` | `{ name, username, password }` | `201 { message }` | Creates account; password hashed with bcrypt (10 rounds) |
| `POST` | `/login` | `{ username, password }` | `200 { token }` | Returns a random 20-byte hex token on success |
| `GET` | `/get_all_activity` | `?token=<token>` | `200 [Meeting]` | All meeting records for the token's owner |
| `POST` | `/add_to_activity` | `{ token, meeting_code }` | `201 { message }` | Saves a meeting code to the user's history |

---

## 🔌 Socket.IO Events

The signalling server keeps **two in-memory stores**:
- `connections` — `{ [roomPath]: [socketId, ...] }` — who is in each room
- `messages` — `{ [roomPath]: [{sender, data, socket-id-sender}] }` — chat history per room

| Event | Direction | Payload | What happens |
|:---|:---:|:---|:---|
| `join-call` | Client → Server | `path` (room ID) | Socket added to `connections[path]`; `user-joined` emitted to **all** peers in room; full chat history replayed to new joiner |
| `user-joined` | Server → Client | `socketId, connections[]` | Receiving peer creates `RTCPeerConnection` and starts the SDP offer flow |
| `signal` | Client ↔ Client (via server) | `toId, message` | Server blindly forwards SDP offers, SDP answers, and ICE candidates between the two socket IDs |
| `chat-message` | Client → Server → Room | `data, sender` | Server stores message in `messages[room]` and broadcasts to every socket in the room |
| `user-left` | Server → Client | `socketId` | Fired on `disconnect`; receiving peers close and clean up that peer connection |

---

## 🔄 App Flow — Step by Step

```
User arrives at /
      │
      ├─ Click "Login" ──► /auth ──► POST /login ──► token in localStorage ──► /home
      │
      └─ Click "Join as Guest" ──► /aljk23 (any meeting path, no auth required)

At /home (protected by withAuth HOC):
      │
      ├─ "CREATE MEETING" ──► generates MEET-XXXXXX ──► POSTs to /add_to_activity
      │                       ──► shows code + copy link UI
      │
      └─ Enter code + "JOIN" ──► POSTs to /add_to_activity ──► navigate to /:meetingCode

At /:meetingCode (VideoMeet.jsx):
      │
      1. Browser prompts camera + mic permission (getUserMedia)
      2. User enters display name → clicks "Join"
      3. Socket.IO connects → emits join-call with room path
      4. Server responds user-joined with list of existing peers
      5. For each existing peer → createOffer → send [signal]
      6. Remote peer receives signal → createAnswer → send [signal] back
      7. ICE candidates exchanged via [signal] events
      8. RTCPeerConnection established → media flows P2P
      9. Chat panel opens via [chat-message] events (history replayed on join)
```

---

## ⚙️ Environment Variables

> The app currently uses hardcoded values. Before deploying to production, extract these:

**`backend/.env`**
```env
PORT=8000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/meetora
```

**`frontend/.env`**
```env
REACT_APP_SERVER_URL=http://localhost:8000
```

Update the references:
```js
// backend/src/app.js
app.set("port", process.env.PORT || 8000)
await mongoose.connect(process.env.MONGO_URI)

// frontend/src/environment.js
export default process.env.REACT_APP_SERVER_URL;
```

> ⚠️ Add both `.env` files to `.gitignore` before pushing to GitHub.

---

## 🗺 Roadmap / Possible Improvements

- [ ] Move room state to Redis for multi-server deployments
- [ ] Add TURN server config for NAT traversal (currently uses Google STUN only)
- [ ] JWT-based auth instead of random hex tokens
- [ ] Room capacity limits and waiting room / lobby logic
- [ ] Recording support via `MediaRecorder` API
- [ ] Deployment config — Docker + `docker-compose` for both services

---

## 🧠 Key Technical Decisions

**Why not use a video SDK (Twilio, Agora, Daily)?**  
This project intentionally uses raw WebRTC APIs to demonstrate understanding of the underlying peer connection model — offer/answer negotiation, ICE candidate gathering, and the role of a signalling server.

**Why Socket.IO over raw WebSockets?**  
Socket.IO's room abstraction, automatic reconnection, and the ability to emit to specific socket IDs (`io.to(socketId).emit(...)`) made the signalling relay much cleaner to implement without extra state management.

**Why in-memory for room/chat state?**  
Simple and zero-dependency for a single-server setup. The tradeoff is that state is lost on server restart — a Redis adapter would fix this for production.

---

## 📄 License

MIT License (https://github.com/your-username)

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0969da,100:1a7f64&height=100&section=footer" width="100%"/>

**If you found this useful, a ⭐ on GitHub is appreciated!**

</div>
 