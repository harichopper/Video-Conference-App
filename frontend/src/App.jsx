import { useState, useEffect, useRef } from 'react';
import HomePage from './pages/HomePage.jsx';
import MeetingRoom from './pages/MeetingRoom.jsx';
import AuthPage from './pages/AuthPage';
import { io } from 'socket.io-client';
import { pcConfig } from './utils/constants.js';
import config from './config/config.js'; // Add this import
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.css';

export default function VideoConferencingApp() {
  const [currentPage, setCurrentPage] = useState(() => {
    const token = localStorage.getItem('token');
    const savedMeetingId = localStorage.getItem('meetingId');
    
    // Always start with home page if there's any token (even if expired)
    // The HomePage will handle token validation
    if (token && savedMeetingId) return 'meeting';
    if (token) return 'home';
    return 'auth';
  });
  const [meetingId, setMeetingId] = useState(() => localStorage.getItem('meetingId') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isOwner, setIsOwner] = useState(() => localStorage.getItem('isOwner') === 'true');
  // Generate NEW userId on every app load (don't persist across sessions)
  const [userId, setUserId] = useState(() => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const socketRef = useRef(null);
  const peerConnections = useRef({});
  const localVideoRef = useRef(null);

  // Initialize local media
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 15 },
        audio: true
      });
      console.log('Media stream initialized:', stream.getTracks());
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');

      const drawFrame = () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Demo Video', canvas.width / 2, canvas.height / 2);
      };
      drawFrame();

      const stream = canvas.captureStream(30);
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const dest = audioContext.createMediaStreamDestination();
      oscillator.connect(dest);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.start();

      stream.addTrack(dest.stream.getAudioTracks()[0]);
      setLocalStream(stream);
      return stream;
    }
  };

  // Create peer connection
  const createPeerConnection = (userId) => {
    try {
      // Clean up existing connection
      if (peerConnections.current[userId]) {
        console.log(`Closing existing peer connection to ${userId}`);
        const oldPc = peerConnections.current[userId];
        oldPc.onicecandidate = null;
        oldPc.ontrack = null;
        oldPc.oniceconnectionstatechange = null;
        oldPc.close();
        delete peerConnections.current[userId];
      }
      
      console.log(`Creating new peer connection to ${userId}`);
      const peerConnection = new RTCPeerConnection(pcConfig);
      
      // Enhanced connection state monitoring
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${userId}: ${peerConnection.iceConnectionState}`);
        
        if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
          console.log(`✅ Successfully connected to ${userId}`);
        } else if (peerConnection.iceConnectionState === 'failed') {
          console.log(`❌ Connection failed to ${userId} - attempting reconnection`);
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.emit('request-reconnect', {
                to: userId,
                from: socketRef.current.id
              });
            }
          }, 2000);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state for ${userId}: ${peerConnection.connectionState}`);
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log(`🧊 Sending ICE candidate to ${userId}`);
          socketRef.current.emit('ice-candidate', { 
            to: userId, 
            candidate: event.candidate 
          });
        } else if (!event.candidate) {
          console.log(`🧊 ICE gathering complete for ${userId}`);
        }
      };

      // Enhanced ontrack handler with immediate stream processing
      peerConnection.ontrack = (event) => {
        console.log(`🎥 Received remote stream from ${userId}:`, event.streams[0]);
        
        const stream = event.streams[0];
        if (stream && stream.getTracks().length > 0) {
          console.log(`🎵🎥 Stream tracks for ${userId}:`, stream.getTracks().map(t => `${t.kind}:${t.readyState}:${t.enabled}`));
          
          // Set remote stream immediately and only once per stream
          setRemoteStreams(prev => {
            // Skip if this is the same stream
            if (prev[userId] && prev[userId].id === stream.id) {
              console.log(`⏭️ Skipping duplicate stream for ${userId}`);
              return prev;
            }
            
            console.log(`📺 Setting remote stream for ${userId}`);
            const updated = {
              ...prev,
              [userId]: stream
            };
            console.log(`📊 Updated remote streams:`, Object.keys(updated));
            return updated;
          });
          
          // Update participant state only if needed
          setParticipants(prev => {
            const existing = prev.find(p => p.id === userId);
            if (existing) {
              console.log(`✅ Participant ${userId} stream now available`);
              return prev;
            }
            
            console.log(`➕ Adding new participant ${userId} from ontrack event`);
            return [...prev, {
              id: userId,
              name: 'Participant',
              isMuted: false,
              isVideoOff: false,
              isScreenSharing: false,
              joinTime: Date.now()
            }];
          });
        } else {
          console.warn(`⚠️ Received empty or invalid stream from ${userId}`);
        }
      };

      // Store the connection
      peerConnections.current[userId] = peerConnection;
      
      console.log(`✅ Peer connection created for ${userId}`);
      return peerConnection;
    } catch (err) {
      console.error(`❌ Error creating peer connection for ${userId}:`, err);
      return null;
    }
  };

  // Initialize socket connection and handle meeting logic
  useEffect(() => {
    if (currentPage === 'meeting') {
      // Ensure media is initialized before setting up connections
      const setupMedia = async () => {
        const stream = await initializeMedia();
        
        // Store the stream reference for use in peer connections
        const currentLocalStream = stream;
        
        // IMPORTANT: Clean up any existing socket connection first
        if (socketRef.current) {
          console.log('Cleaning up existing socket connection');
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        // Clear existing peer connections
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        
        // Reset participants and remote streams
        setParticipants([]);
        setRemoteStreams({});
        setMessages([]);
        
        // Use config for socket URL
        socketRef.current = io(config.SOCKET_URL, {
          transports: ['websocket'],
          timeout: 20000,
          forceNew: true,
          autoConnect: true
        });
        
        socketRef.current.on('connect', () => {
          console.log('✅ Connected to signaling server with ID:', socketRef.current.id);
          if (meetingId && username) {
            console.log(`🔗 Joining room "${meetingId}" with socketId: ${socketRef.current.id}, username: ${username}`);
            socketRef.current.emit('join-room', meetingId, socketRef.current.id, username);
          }
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
        });

        // Handle user joining event
        socketRef.current.on('user-joined', (joinedUserId, userName) => {
          if (!joinedUserId) {
            console.warn('⚠️ Received user-joined with empty userId');
            return;
          }
          
          // Ignore self-connection
          if (joinedUserId === socketRef.current.id) {
            console.log(`🚫 Ignoring self-connection to ${joinedUserId}`);
            return;
          }
          
          console.log(`🔥 User joined: ${userName} (${joinedUserId})`);
          
          setParticipants(prev => {
            // Prevent duplicates
            const existing = prev.find(p => p.id === joinedUserId);
            if (existing) {
              console.log(`⚠️ Participant ${joinedUserId} already exists`);
              return prev;
            }
            
            const newParticipants = [
              ...prev,
              { 
                id: joinedUserId,
                name: userName || 'Participant',
                isMuted: false,
                isVideoOff: false,
                isScreenSharing: false,
                joinTime: Date.now()
              }
            ];
            
            console.log(`📊 Total participants now: ${newParticipants.length}`);
            return newParticipants;
          });
          
          // Create peer connection immediately
          const pc = createPeerConnection(joinedUserId);
          if (!pc) {
            console.error(`❌ Failed to create peer connection for ${joinedUserId}`);
            return;
          }

          // Add local stream tracks immediately
          if (currentLocalStream && currentLocalStream.getTracks().length > 0) {
            currentLocalStream.getTracks().forEach(track => {
              console.log(`➕ Adding ${track.kind} track to peer connection for ${joinedUserId}`);
              pc.addTrack(track, currentLocalStream);
            });
          }
          
          // Determine who should initiate the offer
          const shouldInitiate = socketRef.current.id.localeCompare(joinedUserId) < 0;
          
          console.log(`🎯 My Socket ID: "${socketRef.current.id}", Their ID: "${joinedUserId}"`);
          console.log(`🎯 Should I initiate? ${shouldInitiate}`);
          
          if (shouldInitiate) {
            console.log(`✅ I will initiate the connection to ${joinedUserId}`);
            setTimeout(async () => {
              try {
                if (pc.signalingState === 'stable') {
                  console.log(`🔥 Creating offer for ${joinedUserId}`);
                  const offer = await pc.createOffer({
                    offerToReceiveAudio: true, 
                    offerToReceiveVideo: true
                  });
                  await pc.setLocalDescription(offer);
                  
                  console.log(`📤 Sending offer to ${joinedUserId}`);
                  socketRef.current.emit('offer', { to: joinedUserId, offer });
                }
              } catch (err) {
                console.error(`❌ Error creating offer for ${joinedUserId}:`, err);
              }
            }, 1000);
          }
        });

        socketRef.current.on('user-left', (userId) => {
          console.log(`👋 User ${userId} left`);
          setParticipants(prev => prev.filter(p => p.id !== userId));
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[userId];
            return newStreams;
          });
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
          }
        });

        // Handle WebRTC signaling
        socketRef.current.on('offer', async ({ from, offer }) => {
          try {
            if (!from || !offer) {
              console.warn('❌ Received invalid offer:', { from, offer });
              return;
            }
            
            console.log(`📥 Received offer from ${from}`);
            
            // Create peer connection if it doesn't exist
            let peerConnection = peerConnections.current[from];
            if (!peerConnection) {
              console.log(`🔄 Creating new peer connection for offer from ${from}`);
              peerConnection = createPeerConnection(from);
              if (!peerConnection) {
                console.error(`❌ Failed to create peer connection for offer from ${from}`);
                return;
              }
            }

            // Add local stream tracks
            if (currentLocalStream && currentLocalStream.getTracks().length > 0) {
              console.log(`➕ Adding local stream tracks for ${from}`);
              currentLocalStream.getTracks().forEach(track => {
                const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === track.kind);
                if (!sender) {
                  console.log(`➕ Adding ${track.kind} track for ${from}`);
                  peerConnection.addTrack(track, currentLocalStream);
                }
              });
            }
            
            // Set remote description and create answer
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log(`✅ Set remote description for ${from}`);
            
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log(`🔥 Created answer for ${from}`);
            
            socketRef.current.emit('answer', { to: from, answer });
            console.log(`📤 Sent answer to ${from}`);
          } catch (err) {
            console.error(`❌ Error handling offer from ${from}:`, err);
          }
        });

        socketRef.current.on('answer', async ({ from, answer }) => {
          try {
            if (!from || !answer) {
              console.warn('❌ Received invalid answer:', { from, answer });
              return;
            }
            
            console.log(`📥 Received answer from ${from}`);
            
            const peerConnection = peerConnections.current[from];
            if (!peerConnection) {
              console.warn(`❌ No peer connection found for answer from ${from}`);
              return;
            }
            
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`✅ Set remote answer for ${from} - connection established!`);
          } catch (err) {
            console.error(`❌ Error handling answer from ${from}:`, err);
          }
        });

        socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
          try {
            if (!from || !candidate) {
              console.warn('❌ Received invalid ICE candidate');
              return;
            }
            
            const peerConnection = peerConnections.current[from];
            if (!peerConnection) {
              console.warn(`❌ No peer connection for ICE candidate from ${from}`);
              return;
            }
            
            if (peerConnection.remoteDescription) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              console.log(`✅ Added ICE candidate for ${from}`);
            } else {
              console.log(`⏳ Queuing ICE candidate for ${from}`);
            }
          } catch (err) {
            console.warn(`❌ Error processing ICE candidate from ${from}:`, err);
          }
        });

        socketRef.current.on('chat-message', (message) => {
          setMessages(prev => [...prev, message]);
        });

        socketRef.current.on('toggle-mute', (userId, state) => {
          setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isMuted: state } : p));
        });

        socketRef.current.on('toggle-video', (userId, state) => {
          setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isVideoOff: state } : p));
        });

        socketRef.current.on('toggle-screen-share', (userId, state) => {
          setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isScreenSharing: state } : p));
        });

        // Enhanced disconnect handling
        socketRef.current.on('disconnect', () => {
          console.log('❌ Socket disconnected');
        });
      };
      
      setupMedia();

      return () => {
        console.log('🧹 Cleaning up on unmount');
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        
        // Clear state
        setParticipants([]);
        setRemoteStreams({});
        setMessages([]);
      };
    }
  }, [currentPage, meetingId, username]);

  // Persist meeting data
  useEffect(() => {
    localStorage.setItem('meetingId', meetingId);
    localStorage.setItem('username', username);
    localStorage.setItem('isOwner', isOwner);
  }, [meetingId, username, isOwner]);

  // Handle joining an existing meeting
  const handleJoinMeeting = async () => {
    if (!meetingId.trim() || !username.trim()) return;

    try {
      // ALWAYS generate a NEW unique userId for each tab/session
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);

      // Store the EXACT meeting ID (preserve case and format)
      const cleanMeetingId = meetingId.trim().toUpperCase();
      setMeetingId(cleanMeetingId);
      localStorage.setItem('meetingId', cleanMeetingId);
      localStorage.setItem('username', username);

      console.log(`🎯 Joining meeting: "${cleanMeetingId}" as user: "${username}" (${newUserId})`);
      setCurrentPage('meeting');
    } catch (err) {
      console.error('Error joining meeting:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to join meeting. Please try again.',
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // Handle creating a new meeting (owner)
  const handleCreateMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentPage('auth');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/meeting/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Meeting created:', data);
        const cleanMeetingId = data.meetingId.trim().toUpperCase();
        
        // ALWAYS generate a NEW unique userId for each tab/session
        const newUserId = `owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setUserId(newUserId);
        localStorage.setItem('userId', newUserId);
        
        setMeetingId(cleanMeetingId);
        setIsOwner(true);
        localStorage.setItem('meetingId', cleanMeetingId);
        localStorage.setItem('isOwner', 'true');
        
        console.log(`🎯 Created meeting: "${cleanMeetingId}" as owner: "${username}" (${newUserId})`);
        setCurrentPage('meeting');
      } else {
        throw new Error(data.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to create meeting. Please try again.',
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // Enhanced logout function
  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('meetingId');
    localStorage.removeItem('username');
    localStorage.removeItem('isOwner');
    localStorage.removeItem('userId');
    
    // Reset state
    setCurrentPage('auth');
    setUsername('');
    setMeetingId('');
    setIsOwner(false);
    setLocalStream(null);
    setRemoteStreams({});
    setParticipants([]);
    setMessages([]);
    
    // Close any active connections
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  };

  const handleAuthSuccess = (user) => {
    setUsername(user.name);
    setCurrentPage('home');
  };

  return (
    <>
      {currentPage === 'auth' ? (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      ) : currentPage === "home" ? (
        <HomePage 
          meetingId={meetingId}
          setMeetingId={setMeetingId}
          username={username}
          setUsername={setUsername}
          handleCreateMeeting={handleCreateMeeting}
          handleJoinMeeting={handleJoinMeeting}
          onLogout={handleLogout}
        />
      ) : (
        <MeetingRoom
          meetingId={meetingId}
          username={username}
          localStream={localStream}
          remoteStreams={remoteStreams}
          setRemoteStreams={setRemoteStreams} // Add this missing prop
          participants={participants}
          setParticipants={setParticipants}
          messages={messages}
          setMessages={setMessages}
          socketRef={socketRef}
          peerConnections={peerConnections}
          localVideoRef={localVideoRef}
          isOwner={isOwner}
          setCurrentPage={setCurrentPage}
          userId={userId}
        />
      )}
    </>
  );
}