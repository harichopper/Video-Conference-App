<div align="center">

# 🎥 Video Conference App

*A modern, feature-rich video conferencing application for seamless remote collaboration*

[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg?style=for-the-badge)](https://github.com/yourusername/video-conference-app)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16.0+-339933.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.6+-010101.svg?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-47A248.svg?style=for-the-badge&logo=mongodb)](https://mongodb.com/)

[🚀 Live Demo](#) | [📖 Documentation](#) | [🐛 Report Bug](#) | [💡 Request Feature](#)

![Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Video+Conference+App+Demo)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎯 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [⚙️ Configuration](#️-configuration)
- [📱 Usage Guide](#-usage-guide)
- [🛠️ Development](#️-development)
- [🎨 Customization](#-customization)
- [🔐 Security](#-security)
- [📊 Performance](#-performance)
- [🤝 Contributing](#-contributing)
- [🐛 Troubleshooting](#-troubleshooting)
- [📝 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 **Core Features**
- 🎥 **Real-time Video Conferencing** - HD peer-to-peer video calls
- 🎤 **Audio Controls** - Smart mute/unmute with visual indicators
- 🖥️ **Screen Sharing** - Share your screen with participants
- 💬 **Real-time Chat** - Public and private messaging
- 🏠 **Meeting Management** - Create, join, and control meetings
- 🔄 **Auto-reconnection** - Automatic connection recovery

</td>
<td width="50%">

### 🎨 **UI/UX Features**
- 🌙 **Dark/Light Themes** - Beautiful adaptive themes
- 📱 **Responsive Design** - Works on all devices
- ✨ **Smooth Animations** - Powered by Framer Motion
- 🎨 **Modern Components** - Tailwind CSS styling
- 🔔 **Smart Notifications** - SweetAlert2 alerts
- 📊 **Real-time Status** - Live connection indicators

</td>
</tr>
<tr>
<td width="50%">

### 👑 **Host Controls**
- 👥 **Participant Management** - View and control participants
- 🎤 **Remote Audio Control** - Mute/unmute participants
- 📹 **Remote Video Control** - Enable/disable participant videos
- 🔚 **Meeting Control** - End meetings for everyone
- 💌 **Private Messaging** - Direct participant communication
- 📋 **Meeting Info** - Real-time meeting statistics

</td>
<td width="50%">

### 🔐 **Authentication & Profile**
- 🔑 **Secure Authentication** - JWT-based login/signup
- 👤 **Profile Management** - Customizable user profiles
- 🖼️ **Avatar System** - Auto-generated profile avatars
- 📱 **Session Management** - Persistent login sessions
- 🏷️ **User Status** - Online/offline indicators
- 📊 **Meeting History** - Track attended meetings

</td>
</tr>
</table>

---

## 🎯 Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

### WebRTC & Real-time
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 🚀 Quick Start

### Prerequisites

> **Note:** Ensure you have the following installed on your system:

```bash
Node.js >= 16.0.0
npm >= 8.0.0 or yarn >= 1.22.0
MongoDB >= 4.4.0
Git >= 2.25.0
```

### 🏃‍♂️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/video-conference-app.git
   cd video-conference-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in the backend directory:
   ```bash
   cd ../backend
   cp .env.example .env  # Copy example file
   ```
   
   Update the `.env` file:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/videoconference
   
   # Server
   PORT=5000
   
   # JWT Secret (Generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Environment
   NODE_ENV=development
   
   # CORS
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start the Application**
   
   **Option A: Run both services separately**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```
   
   **Option B: Run with concurrently (if configured)**
   ```bash
   npm run dev  # From root directory
   ```

6. **Open your browser**
   ```
   🌐 Frontend: http://localhost:5173
   🔧 Backend API: http://localhost:5000
   ```

---

## 📁 Project Structure

```
📦 video-conference-app/
├── 📂 backend/                    # Node.js Backend
│   ├── 📂 models/                 # Database Models
│   │   ├── 📄 User.js            # User schema & methods
│   │   ├── 📄 Meeting.js         # Meeting schema & methods
│   │   └── 📄 Chat.js            # Chat message schema
│   ├── 📂 routes/                 # API Routes
│   │   ├── 📄 authRoutes.js      # Authentication endpoints
│   │   └── 📄 meetingRoutes.js   # Meeting management
│   ├── 📂 socket/                 # Real-time Communication
│   │   └── 📄 socketHandler.js   # WebRTC signaling & events
│   ├── 📂 middleware/             # Express Middleware
│   │   └── 📄 authMiddleware.js  # JWT authentication
│   ├── 📂 utils/                  # Utility Functions
│   │   ├── 📄 database.js        # DB connection helpers
│   │   └── 📄 validators.js      # Input validation
│   ├── 📄 server.js              # Express server setup
│   ├── 📄 package.json           # Backend dependencies
│   └── 📄 .env                   # Environment variables
├── 📂 frontend/                   # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/         # Reusable Components
│   │   │   ├── 📂 ui/            # Base UI components
│   │   │   ├── 📄 VideoTile.jsx  # Video participant tile
│   │   │   └── 📄 AuthModal.jsx  # Authentication modal
│   │   ├── 📂 pages/             # Page Components
│   │   │   ├── 📄 HomePage.jsx   # Landing page
│   │   │   ├── 📄 MeetingRoom.jsx # Video conference UI
│   │   │   └── 📄 AuthPage.jsx   # Login/signup page
│   │   ├── 📂 utils/             # Utility Functions
│   │   │   ├── 📄 constants.js   # App constants
│   │   │   └── 📄 MockSocket.js  # Development helpers
│   │   ├── 📂 hooks/             # Custom React Hooks
│   │   ├── 📂 styles/            # Global Styles
│   │   ├── 📄 App.jsx            # Main app component
│   │   └── 📄 main.jsx           # App entry point
│   ├── 📄 package.json           # Frontend dependencies
│   ├── 📄 vite.config.js         # Vite configuration
│   └── 📄 tailwind.config.js     # Tailwind CSS config
├── 📄 README.md                  # Project documentation
├── 📄 .gitignore                 # Git ignore rules
└── 📄 package.json               # Root package file
```

---

## ⚙️ Configuration

### 🔧 WebRTC Configuration

**Frontend** (`frontend/src/utils/constants.js`):
```javascript
export const pcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export const mediaConstraints = {
  video: { 
    width: { max: 1280 }, 
    height: { max: 720 },
    frameRate: { max: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
};
```

### 🗃️ Database Configuration

**Backend** (`.env`):
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/videoconference

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/videoconference

# Connection Options
DB_MAX_POOL_SIZE=10
DB_TIMEOUT=30000
```

### 🎨 Theme Configuration

**Frontend** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      }
    }
  }
}
```

---

## 📱 Usage Guide

### 👥 For Meeting Hosts

<details>
<summary><b>🎯 Creating a Meeting</b></summary>

1. **Sign up or log in** to your account
2. Click **"New Meeting"** on the homepage
3. **Copy the meeting ID** that appears
4. **Share the meeting ID** with participants
5. **Start your video conference!**

**Pro Tips:**
- 💡 Meeting IDs are automatically generated and secure
- 📋 Use the copy button for easy sharing
- 👑 As host, you have special controls over participants

</details>

<details>
<summary><b>⚡ Host Controls</b></summary>

| Control | Action | Description |
|---------|--------|-------------|
| 🎤 | **Mute Participant** | Click participant's mic icon |
| 📹 | **Control Video** | Click participant's camera icon |
| 💬 | **Private Message** | Click participant's message icon |
| 🔄 | **Reconnect** | Click refresh icon if connection fails |
| 🔚 | **End Meeting** | Click "End Meeting" to close for everyone |

</details>

### 👤 For Participants

<details>
<summary><b>🚪 Joining a Meeting</b></summary>

1. **Get the meeting ID** from the host
2. **Enter the meeting ID** in the join field
3. **Enter your name** (how others will see you)
4. **Click "Join Meeting"**
5. **Allow camera and microphone** permissions
6. **Enjoy the meeting!**

**Requirements:**
- 🌐 Modern web browser (Chrome, Firefox, Safari, Edge)
- 🎥 Working camera and microphone
- 🔗 Stable internet connection (minimum 1 Mbps)

</details>

### 🎮 During a Meeting

<details>
<summary><b>🎛️ Meeting Controls</b></summary>

| Button | Function | Shortcut |
|--------|----------|----------|
| 🎤 | **Mute/Unmute** | `Space` |
| 📹 | **Camera On/Off** | `Ctrl+E` |
| 🖥️ | **Screen Share** | `Ctrl+S` |
| 💬 | **Toggle Chat** | `Ctrl+M` |
| 📞 | **Leave Meeting** | `Ctrl+L` |

</details>

<details>
<summary><b>💬 Chat Features</b></summary>

- **Public Messages:** Visible to everyone in the meeting
- **Private Messages:** Send direct messages to specific participants
- **Message History:** Scroll up to see previous messages
- **Unread Indicator:** Red badge shows new messages when chat is closed
- **Emoji Support:** Use emojis in your messages 😊

</details>

---

## 🛠️ Development

### 🏃‍♂️ Running in Development

```bash
# Install dependencies for both frontend and backend
npm run install:all

# Start both services in development mode
npm run dev

# Or start them separately
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only

# Run tests
npm run test          # All tests
npm run test:backend  # Backend tests only
npm run test:frontend # Frontend tests only
```

### 🏗️ Building for Production

```bash
# Build frontend for production
cd frontend
npm run build

# The built files will be in frontend/dist/

# Start production server
cd ../backend
npm start
```

### 🐳 Docker Support

<details>
<summary><b>Docker Configuration</b></summary>

**Dockerfile (Backend)**:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/videoconference
    depends_on:
      - mongo
  
  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

**Run with Docker**:
```bash
docker-compose up -d
```

</details>

---

## 🎨 Customization

### 🎨 Themes

<details>
<summary><b>Creating Custom Themes</b></summary>

1. **Add theme colors** in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'custom-primary': '#your-color',
      'custom-secondary': '#your-color'
    }
  }
}
```

2. **Update theme toggle** in components
3. **Add theme to localStorage** persistence

</details>

### 🧩 Adding New Features

<details>
<summary><b>Feature Development Guide</b></summary>

1. **Backend API** (`backend/routes/`)
2. **Database Model** (`backend/models/`)
3. **Frontend Component** (`frontend/src/components/`)
4. **Socket Events** (`backend/socket/socketHandler.js`)
5. **Update README** with new feature documentation

</details>

---

## 🔐 Security

### 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configured for specific origins
- **Rate Limiting** - Prevent abuse and attacks
- **Secure Headers** - Security-focused HTTP headers

### 🔒 Best Practices

<details>
<summary><b>Security Recommendations</b></summary>

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, random JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use MongoDB authentication
   - Enable SSL/TLS connections
   - Regular backups

3. **WebRTC Security**
   - Use STUN/TURN servers for NAT traversal
   - Implement proper user permissions
   - Monitor connection quality

</details>

---

## 📊 Performance

### ⚡ Optimization Features

- **Lazy Loading** - Components loaded on demand
- **Memoization** - React.memo for expensive components
- **WebRTC Optimization** - Adaptive bitrate and quality
- **Database Indexing** - Optimized MongoDB queries
- **Caching** - Browser and server-side caching

### 📈 Performance Monitoring

<details>
<summary><b>Monitoring Tools</b></summary>

```javascript
// WebRTC Stats
const getConnectionStats = async (peerConnection) => {
  const stats = await peerConnection.getStats();
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
      console.log(`Bytes received: ${report.bytesReceived}`);
      console.log(`Packets lost: ${report.packetsLost}`);
    }
  });
};
```

</details>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🌟 How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### 📝 Contribution Guidelines

<details>
<summary><b>Code Standards</b></summary>

- Use **ESLint** and **Prettier** for code formatting
- Write **meaningful commit messages**
- Add **tests** for new features
- Update **documentation** for any API changes
- Follow **React best practices**

</details>

---

## 🐛 Troubleshooting

### 🔧 Common Issues

<details>
<summary><b>🎥 Video/Audio Issues</b></summary>

**Problem:** Camera or microphone not working
- **Solution:** Check browser permissions
- **Check:** `chrome://settings/content/camera`
- **Alternative:** Try different browser

**Problem:** Poor video quality
- **Solution:** Check internet connection
- **Tip:** Lower video resolution in settings

</details>

<details>
<summary><b>🔌 Connection Issues</b></summary>

**Problem:** Cannot connect to meeting
- **Check:** Internet connection
- **Check:** Firewall settings
- **Try:** Different network (mobile hotspot)

**Problem:** Frequent disconnections
- **Solution:** Check network stability
- **Solution:** Use ethernet instead of WiFi

</details>

<details>
<summary><b>🖥️ Browser Compatibility</b></summary>

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Good support |
| Safari | ✅ Limited | Some features may not work |
| Edge | ✅ Full | Chromium-based |
| IE | ❌ None | Not supported |

</details>

### 🆘 Getting Help

- 📖 Check our [FAQ](FAQ.md)
- 🐛 [Report bugs](https://github.com/yourusername/video-conference-app/issues)
- 💬 [Join our Discord](https://discord.gg/yourserver)
- 📧 Email us at [support@yourapp.com](mailto:support@yourapp.com)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Video Conference App

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

### 🚀 Built With

- [**WebRTC**](https://webrtc.org/) - Real-time communication
- [**Socket.io**](https://socket.io/) - Real-time bidirectional communication
- [**React**](https://reactjs.org/) - Frontend framework
- [**Node.js**](https://nodejs.org/) - Backend runtime
- [**MongoDB**](https://mongodb.com/) - Database
- [**Tailwind CSS**](https://tailwindcss.com/) - CSS framework
- [**Framer Motion**](https://www.framer.com/motion/) - Animation library
- [**DiceBear**](https://dicebear.com/) - Avatar generation

### 💡 Inspiration

- Google Meet interface design
- Zoom's participant management
- Discord's voice chat features
- Slack's user experience patterns

### 🎯 Special Thanks

- **The WebRTC Community** for excellent documentation
- **Socket.io Team** for real-time communication tools
- **Tailwind CSS** for the amazing design system
- **React Team** for the fantastic framework

---

<div align="center">

### 🌟 **Made with ❤️ by [Your Name]**

**If this project helped you, please consider giving it a ⭐!**

[⬆️ Back to Top](#-video-conference-app)

---

**📞 Connect with us:**
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/yourprofile)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/yourhandle)

</div>#   V i d e o - C o n f e r e n c e - A p p  
 