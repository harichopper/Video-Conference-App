# 🎥 Video Conference App

A modern, feature-rich video conferencing application built with React.js (frontend) and Node.js (backend). Experience seamless video calls with real-time chat, screen sharing, and advanced host controls.

![Video Conference App](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Node.js-16.0+-339933.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-4.6+-010101.svg)

## ✨ Features

### 🎯 Core Features
- **Real-time Video Conferencing** - High-quality peer-to-peer video calls
- **Audio Controls** - Mute/unmute functionality with visual indicators
- **Screen Sharing** - Share your screen with other participants
- **Text Chat** - Real-time messaging with private message support
- **Meeting Management** - Create, join, and manage meetings easily

### 🎨 UI/UX Features
- **Dark/Light Theme** - Toggle between beautiful dark and light themes
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Animated Interface** - Smooth animations using Framer Motion
- **Modern UI Components** - Built with Tailwind CSS and custom components

### 👑 Host Controls
- **Participant Management** - View all meeting participants
- **Audio/Video Control** - Mute/unmute participants remotely
- **Meeting Control** - End meetings for all participants
- **Private Messaging** - Send private messages to specific participants

### 🔐 Authentication & Profile
- **User Authentication** - Secure login/signup system
- **Profile Management** - Customizable user profiles with avatars
- **Session Management** - Persistent login sessions
- **Avatar Generation** - Auto-generated avatars based on gender preferences

## 🚀 Getting Started

### Prerequisites
- Node.js (v16.0 or higher)
- npm or yarn package manager
- MongoDB (for user data storage)
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/video-conference-app.git
   cd video-conference-app
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/videoconference
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   ```

5. **Start the Application**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
video-conference-app/
├── backend/
│   ├── models/
│   │   ├── User.js              # User data model
│   │   ├── Meeting.js           # Meeting data model
│   │   └── Chat.js              # Chat message model
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   └── meetingRoutes.js     # Meeting management endpoints
│   ├── socket/
│   │   └── socketHandler.js     # WebRTC signaling & real-time events
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT authentication middleware
│   ├── server.js                # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI components
│   │   │   ├── VideoTile.jsx     # Video participant component
│   │   │   └── AuthModal.jsx     # Authentication modal
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Landing page with meeting controls
│   │   │   ├── MeetingRoom.jsx   # Main video conference interface
│   │   │   └── AuthPage.jsx      # Login/signup page
│   │   ├── utils/
│   │   │   ├── constants.js      # WebRTC configuration
│   │   │   └── MockSocket.js     # Development socket simulation
│   │   ├── App.jsx               # Main application component
│   │   └── main.jsx              # Application entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **React.js** - Modern JavaScript framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Socket.io Client** - Real-time communication
- **SweetAlert2** - Beautiful alert dialogs
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### WebRTC
- **RTCPeerConnection** - Peer-to-peer communication
- **MediaStream API** - Audio/video capture
- **Screen Capture API** - Screen sharing functionality

## 📱 Usage Guide

### Creating a Meeting
1. Sign up or log in to your account
2. Click "New Meeting" on the homepage
3. Share the generated meeting ID with participants
4. Start your video conference!

### Joining a Meeting
1. Enter the meeting ID provided by the host
2. Enter your name
3. Click "Join Meeting"
4. Allow camera and microphone permissions

### During a Meeting
- **Mute/Unmute**: Click the microphone button
- **Video On/Off**: Click the camera button
- **Screen Share**: Click the screen share button
- **Chat**: Click the message button to open chat
- **Leave**: Click the phone button to leave the meeting

### Host Controls
- **Mute Participants**: Click on participant's microphone icon
- **Control Video**: Click on participant's camera icon
- **Private Message**: Click on participant's message icon
- **End Meeting**: Click "End Meeting" to close for everyone

## 🎨 Themes

The application supports both dark and light themes:

- **Dark Theme**: Modern dark interface with purple/indigo gradients
- **Light Theme**: Clean light interface with blue/purple gradients
- **Theme Persistence**: Your theme preference is saved locally

Toggle themes using the sun/moon icon in the top-right corner.

## 🔧 Configuration

### WebRTC Configuration
Located in `frontend/src/utils/constants.js`:
```javascript
export const pcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

### Backend Configuration
Environment variables in `.env`:
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens

## 🚧 Development

### Running in Development Mode
```bash
# Backend with auto-reload
cd backend && npm run dev

# Frontend with hot reload
cd frontend && npm run dev
```

### Building for Production
```bash
# Build frontend
cd frontend && npm run build

# Start production server
cd backend && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Screen sharing currently shows a demo canvas (replace with actual screen capture)
- Private messages need recipient selection UI improvements
- Mobile responsive design needs further optimization

## 🔮 Future Enhancements

- [ ] Recording functionality
- [ ] File sharing capabilities
- [ ] Virtual backgrounds
- [ ] Meeting scheduling
- [ ] Breakout rooms
- [ ] Mobile app development
- [ ] End-to-end encryption
- [ ] Integration with calendar apps

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/video-conference-app/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- [WebRTC](https://webrtc.org/) for real-time communication
- [Socket.io](https://socket.io/) for signaling server
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [DiceBear](https://dicebear.com/) for avatar generation

---

**Made with ❤️ by [Your Name]**

*Star ⭐ this repository if you found it helpful!*#   V i d e o - C o n f e r e n c e - A p p  
 #   V i d e o - C o n f e r e n c e - A p p  
 