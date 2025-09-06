import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  ScreenShare,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Settings,
  MoreVertical,
  X,
  RefreshCw,
  User,
  SunMoon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoTile from '../components/VideoTile';
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/dist/sweetalert2.css";

export default function MeetingRoom({
  meetingId,
  username,
  localStream,
  remoteStreams,
  setRemoteStreams, // Add this missing prop
  participants,
  setParticipants,
  messages,
  setMessages,
  socketRef,
  peerConnections,
  localVideoRef,
  isOwner = false,
  setCurrentPage,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [meetingTimer, setMeetingTimer] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMeetingCode, setShowMeetingCode] = useState(false);
  const [privateMessageTo, setPrivateMessageTo] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [ownerControls, setOwnerControls] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [settings, setSettings] = useState({
    showDebug: false,
    showAvatars: true,
    gridSize: 0,
  });
  
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update unread message count when chat is closed
  useEffect(() => {
    if (!isChatOpen) {
      setUnreadMessages(messages.length);
    } else {
      setUnreadMessages(0);
    }
  }, [messages, isChatOpen]);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Get theme-specific Swal configuration
  const getSwalConfig = (type = 'default') => {
    const baseConfig = {
      background: theme === 'dark' 
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
      color: theme === 'dark' ? "#fff" : "#1f2937",
      customClass: { popup: "rounded-2xl" },
    };

    if (type === 'error') {
      baseConfig.confirmButtonColor = "#ef4444";
    } else if (type === 'success') {
      baseConfig.confirmButtonColor = "#10b981";
    } else {
      baseConfig.confirmButtonColor = theme === 'dark' ? "#8b5cf6" : "#6366f1";
    }

    return baseConfig;
  };

  // Copy meeting code function
  const copyMeetingCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingId);
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'success',
        title: 'Meeting code copied to clipboard!',
        ...getSwalConfig('success'),
      });
    } catch (err) {
      console.error('Failed to copy meeting code:', err);
      
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = meetingId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'success',
        title: 'Meeting code copied!',
        ...getSwalConfig('success'),
      });
    }
  };

  // Toggle mute for local user
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        
        if (socketRef.current) {
          socketRef.current.emit('toggle-mute', socketRef.current.id, !isMuted);
        }
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
        
        if (socketRef.current) {
          socketRef.current.emit('toggle-video', socketRef.current.id, !isVideoOff);
        }
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        const drawScreen = () => {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = 'white';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Screen Share Demo', canvas.width / 2, canvas.height / 2);
          ctx.font = '24px Arial';
          ctx.fillText(new Date().toLocaleTimeString(), canvas.width / 2, canvas.height / 2 + 60);
          
          if (isScreenSharing) {
            requestAnimationFrame(drawScreen);
          }
        };
        drawScreen();
        
        const screenStream = canvas.captureStream(30);
        setIsScreenSharing(true);
        
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
      } else {
        setIsScreenSharing(false);
        
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }
      
      if (socketRef.current) {
        socketRef.current.emit('toggle-screen-share', socketRef.current.id, !isScreenSharing);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  // Owner controls for participants
  const toggleParticipantAudio = (userId, newState) => {
    if (isOwner && socketRef.current) {
      console.log(`Owner ${username} toggling audio for ${userId} to ${newState}`);
      socketRef.current.emit('owner-toggle-mute', userId, newState);
      
      // Update local state immediately for better UX
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isMuted: newState } : p
      ));
      
      // Show confirmation toast
      const participantName = participants.find(p => p.id === userId)?.name || 'Participant';
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'success',
        title: `${participantName} ${newState ? 'muted' : 'unmuted'}`,
        ...getSwalConfig('success'),
      });
    }
  };

  const toggleParticipantVideo = (userId, newState) => {
    if (isOwner && socketRef.current) {
      console.log(`Owner ${username} toggling video for ${userId} to ${newState}`);
      socketRef.current.emit('owner-toggle-video', userId, newState);
      
      // Update local state immediately for better UX
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isVideoOff: newState } : p
      ));
      
      // Show confirmation toast
      const participantName = participants.find(p => p.id === userId)?.name || 'Participant';
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        icon: 'success',
        title: `${participantName} video ${newState ? 'disabled' : 'enabled'}`,
        ...getSwalConfig('success'),
      });
    }
  };

  // Enhanced leave meeting function with immediate action
  const leaveMeeting = (endForAll = false) => {
    const title = endForAll ? 'End Meeting for Everyone?' : 'Leave Meeting?';
    const text = endForAll 
      ? 'This will immediately end the meeting for all participants.' 
      : 'Are you sure you want to leave this meeting?';
    
    Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: endForAll ? 'End Meeting Now' : 'Leave Now',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusConfirm: false,
      ...getSwalConfig('error'),
    }).then((result) => {
      if (result.isConfirmed) {
        // Show immediate feedback
        Swal.fire({
          title: endForAll ? 'Ending Meeting...' : 'Leaving Meeting...',
          text: 'Please wait...',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          timer: 1000,
          ...getSwalConfig(),
        }).then(() => {
          // Perform the actual leave/end actions immediately
          performMeetingExit(endForAll);
        });
      }
    });
  };

  // Separate function to handle the actual meeting exit logic
  const performMeetingExit = (endForAll = false) => {
    try {
      // Send end meeting signal if owner is ending for all
      if (endForAll && isOwner && socketRef.current) {
        socketRef.current.emit('end-meeting', meetingId);
      }
      
      // Stop timer immediately
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Leave room and disconnect socket immediately
      if (socketRef.current) {
        socketRef.current.emit('leave-room', meetingId);
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Stop local stream immediately
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
      
      // Close all peer connections immediately
      Object.entries(peerConnections.current).forEach(([userId, pc]) => {
        console.log(`Closing peer connection to ${userId}`);
        pc.close();
      });
      peerConnections.current = {};

      // Clear localStorage and state immediately
      localStorage.removeItem('meetingId');
      localStorage.removeItem('username');
      localStorage.removeItem('isOwner');
      
      // Reset all state immediately
      setParticipants([]);
      setRemoteStreams({});
      setMessages([]);
      
      // Show success message and redirect
      Swal.fire({
        title: endForAll ? 'Meeting Ended' : 'Left Meeting',
        text: endForAll 
          ? 'The meeting has been ended for all participants.' 
          : 'You have successfully left the meeting.',
        icon: 'success',
        confirmButtonText: 'OK',
        timer: 2000,
        ...getSwalConfig('success'),
      }).then(() => {
        setCurrentPage('home');
      });
      
    } catch (error) {
      console.error('Error during meeting exit:', error);
      // Even if there's an error, still redirect to home
      setCurrentPage('home');
    }
  };

  // Helper to check for duplicate messages
  const isDuplicateMessage = (msg, messagesArr) => {
    return messagesArr.some(
      m => m._id === msg._id && m.timestamp === msg.timestamp
    );
  };

  // Send chat message (updated to support private messages)
  const sendMessage = async () => {
    if (newMessage.trim() && meetingId) {
      const messageData = {
        _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        meetingId,
        sender: username,
        text: newMessage,
        timestamp: new Date().toISOString(),
        isPrivate: !!privateMessageTo,
        to: privateMessageTo
      };

      // Send the message through socket
      if (socketRef.current) {
        socketRef.current.emit('send-message', messageData);
      }

      // For public messages, add immediately to local state to show instantly
      if (!privateMessageTo) {
        setMessages(prev => {
          // Check for duplicates before adding
          const isDuplicate = prev.some(m => 
            m._id === messageData._id || 
            (m.sender === messageData.sender && 
             m.text === messageData.text && 
             Math.abs(new Date(m.timestamp) - new Date(messageData.timestamp)) < 1000)
          );
          
          if (!isDuplicate) {
            return [...prev, messageData];
          }
          return prev;
        });
      }

      setNewMessage("");

      // Reset private message recipient after sending
      if (privateMessageTo) {
        setPrivateMessageTo(null);
      }
    }
  };

  // Format time for timer
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show participant controls (for owner)
  const showParticipantControls = (participant) => {
    if (!isOwner) return;
    setOwnerControls({
      participant,
      show: true
    });
    // Show participant name in a toast for feedback
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      icon: 'info',
      title: `Selected: ${participant.name}`,
      ...getSwalConfig(),
    });
  };

  // Set private message recipient
  const setMessageRecipient = (participant) => {
    setPrivateMessageTo(participant.id);
    setIsChatOpen(true);
    setNewMessage(`@${participant.name}: `);
  };

  // Start meeting timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setMeetingTimer(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Set up socket event listeners for enhanced features
  useEffect(() => {
    if (socketRef.current) {
      // Listen for private messages
      socketRef.current.on('private-message', (message) => {
        if (message.to === socketRef.current.id) {
          setMessages(prev => [...prev, message]);
          
          // If chat is closed, notify user of private message
          if (!isChatOpen) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 4000,
              icon: 'info',
              title: `Private message from ${message.sender}`,
              text: message.text,
              ...getSwalConfig(),
            });
          }
        }
      });
      
      // Listen for owner control events
      socketRef.current.on('owner-toggle-mute', (userId, state) => {
        console.log(`Received owner-toggle-mute for ${userId}: ${state}`);
        
        // Update participant state
        setParticipants(prev => prev.map(p => 
          p.id === userId ? { ...p, isMuted: state } : p
        ));
        
        // If this is about the current user, apply the change
        if (userId === socketRef.current.id) {
          console.log(`Host ${state ? 'muted' : 'unmuted'} me`);
          
          if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.enabled = !state;
              setIsMuted(state);
            }
          }
          
          // Notify user with enhanced message
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            icon: state ? 'warning' : 'success',
            title: state ? '🔇 You have been muted by the host' : '🔊 Host has unmuted you',
            text: state ? 'Your microphone is now disabled' : 'You can now speak',
            ...getSwalConfig(),
          });
        }
      });
      
      socketRef.current.on('owner-toggle-video', (userId, state) => {
        console.log(`Received owner-toggle-video for ${userId}: ${state}`);
        
        // Update participant state
        setParticipants(prev => prev.map(p => 
          p.id === userId ? { ...p, isVideoOff: state } : p
        ));
        
        // If this is about the current user, apply the change
        if (userId === socketRef.current.id) {
          console.log(`Host ${state ? 'disabled' : 'enabled'} my video`);
          
          if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.enabled = !state;
              setIsVideoOff(state);
            }
          }
          
          // Notify user with enhanced message
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            icon: state ? 'warning' : 'success',
            title: state ? '📷 Your video has been disabled by the host' : '📹 Host has enabled your video',
            text: state ? 'Your camera is now turned off' : 'Your camera is now active',
            ...getSwalConfig(),
          });
        }
      });
      
      // Listen for chat messages (prevent duplicates and add all messages)
      socketRef.current.on('chat-message', (message) => {
        console.log('Received chat message:', message);
        
        setMessages(prev => {
          // Check for duplicates by ID and timestamp
          const isDuplicate = prev.some(m => 
            m._id === message._id || 
            (m.sender === message.sender && 
             m.text === message.text && 
             Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000)
          );
          
          if (isDuplicate) {
            console.log('Duplicate message detected, ignoring:', message);
            return prev;
          }
          
          console.log('Adding new chat message:', message);
          return [...prev, message];
        });
      });
      
      return () => {
        // Safe cleanup with null checks
        if (socketRef.current) {
          try {
            socketRef.current.off('private-message');
            socketRef.current.off('owner-toggle-mute');
            socketRef.current.off('owner-toggle-video');
            socketRef.current.off('chat-message');
          } catch (error) {
            console.warn('Error during socket cleanup:', error);
          }
        }
      };
    }
  }, [isChatOpen, localStream, username]);

  // Helper to get all participants including local user - memoized to prevent unnecessary re-renders
  const getAllParticipants = useMemo(() => {
    const mySocketId = socketRef.current?.id || 'local';
    
    const local = {
      id: mySocketId,
      name: `${username} (You)`,
      isMuted,
      isVideoOff,
      isScreenSharing,
      isLocal: true,
      stream: localStream,
      joinTime: 0, // Always first
      live: !!localStream
    };
    
    // Remote participants with their streams - filter out duplicates of local user
    const remoteParticipants = participants
      .filter(p => p.id !== mySocketId && p.id !== 'local') // Filter out self from participants list
      .map((p, index) => ({
        ...p,
        isLocal: false,
        stream: remoteStreams[p.id] || null,
        live: !!(remoteStreams[p.id]),
        name: p.name && p.name !== username ? p.name : "Participant",
        joinTime: p.joinTime || (Date.now() + index)
      }));
    
    // Always return local user first, then remote participants
    const allParticipants = [local, ...remoteParticipants];
    console.log(`👥 Total participants for display: ${allParticipants.length} (1 local + ${remoteParticipants.length} remote)`);
    
    return allParticipants;
  }, [
    socketRef.current?.id, 
    username, 
    isMuted, 
    isVideoOff, 
    isScreenSharing, 
    localStream, 
    participants.length,
    Object.keys(remoteStreams).length,
    Object.keys(remoteStreams).join(',')
  ]);

  // Monitor participants and remote streams - simplified and less frequent
  useEffect(() => {
    console.log(`🔍 Participants: ${participants.length}, Streams: ${Object.keys(remoteStreams).length}`);
    
    // Only remove duplicates if they actually exist
    const uniqueIds = new Set();
    const hasDuplicates = participants.some(p => {
      if (uniqueIds.has(p.id)) {
        return true;
      }
      uniqueIds.add(p.id);
      return false;
    });
    
    if (hasDuplicates) {
      console.log('🔧 Removing duplicates');
      const uniqueParticipants = participants.filter((p, index, arr) => 
        arr.findIndex(item => item.id === p.id) === index
      );
      setParticipants(uniqueParticipants);
    }
  }, [participants.length]); // Only run when participant count changes

  // Add reconnection button for failed streams - enhanced for cross-browser testing
  const requestReconnect = (participant) => {
    if (!socketRef.current) return;
    
    console.log(`Manually requesting reconnection with ${participant.name}`);
    
    // Clear any existing connection
    if (peerConnections.current[participant.id]) {
      console.log(`Closing existing connection to ${participant.id}`);
      const pc = peerConnections.current[participant.id];
      pc.close();
      delete peerConnections.current[participant.id];
    }
    
    // The actual reconnection will be handled by the socket event handlers
    socketRef.current.emit('request-reconnect', {
      to: participant.id,
      from: socketRef.current.id
    });
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      icon: 'info',
      title: `Reconnecting with ${participant.name}...`,
      ...getSwalConfig(),
    });
  };

  // Track when participants join for reconnection timing - fix duplicate keys and blinking
  useEffect(() => {
    setParticipants(prev => prev.map((p, index) => {
      // Only assign joinTime if not already set
      if (!p.joinTime) {
        // Use a stable value based on id and index for uniqueness
        return { ...p, joinTime: Date.now() + index };
      }
      return p;
    }));
  }, [participants.length]);

  // Settings modal component (memoized to prevent blinking)
  const SettingsModal = useMemo(() => () => (
    <AnimatePresence>
      {showSettingsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 relative"
          >
            <button
              className="absolute top-2 right-2 text-white bg-black/30 rounded-full p-2 hover:bg-black/50"
              onClick={() => setShowSettingsModal(false)}
              aria-label="Close Settings"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Settings</h3>
            <div className="space-y-6">
              {/* General Section */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">General</h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white">Show Debug Info</span>
                  <Button
                    variant={settings.showDebug ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSettings(s => ({ ...s, showDebug: !s.showDebug }))}
                  >
                    {settings.showDebug ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Show Avatars</span>
                  <Button
                    variant={settings.showAvatars ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSettings(s => ({ ...s, showAvatars: !s.showAvatars }))}
                  >
                    {settings.showAvatars ? "On" : "Off"}
                  </Button>
                </div>
              </div>
              {/* Divider */}
              <div className="border-t border-white/20 my-4"></div>
              {/* Layout Section */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Layout</h4>
                <div className="flex items-center justify-between">
                  <span className="text-white">Grid Size</span>
                  <select
                    value={settings.gridSize}
                    onChange={e => setSettings(s => ({ ...s, gridSize: Number(e.target.value) }))}
                    className="bg-white/10 text-white rounded px-2 py-1 border border-white/20"
                  >
                    <option value={0}>Auto</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              </div>
              {/* Divider */}
              <div className="border-t border-white/20 my-4"></div>
              {/* Close Button */}
              <Button
                variant="ghost"
                className="w-full text-white hover:bg-white/10 mt-2"
                onClick={() => setShowSettingsModal(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [showSettingsModal, settings]);

  // Update dynamic grid class for better participant display
  const getGridClass = () => {
    if (settings.gridSize > 0) return `grid-cols-${settings.gridSize}`;
    const count = getAllParticipants.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 12) return 'grid-cols-3 md:grid-cols-4';
    return 'grid-cols-3 md:grid-cols-4';
  };

  // Show participant debug info
  const showParticipantDebugInfo = () => {
    const info = participants.map(p => ({
      id: p.id,
      name: p.name,
      hasStream: !!remoteStreams[p.id],
      joinTime: new Date(p.joinTime || Date.now()).toLocaleTimeString(),
      streamTracks: remoteStreams[p.id] ? 
        remoteStreams[p.id].getTracks().map(t => 
          `${t.kind}:${t.enabled ? 'on' : 'off'} (${t.readyState})`
        ).join(', ') : 
        'none'
    }));
    
    // Add my info too
    info.push({
      id: socketRef.current?.id || 'unknown',
      name: `${username} (You)`,
      hasStream: !!localStream,
      joinTime: new Date().toLocaleTimeString(),
      streamTracks: localStream ? 
        localStream.getTracks().map(t => 
          `${t.kind}:${t.enabled ? 'on' : 'off'} (${t.readyState})`
        ).join(', ') : 
        'none'
    });
    
    Swal.fire({
      title: 'Participant Debug Info',
      html: `<pre style="text-align: left; max-height: 60vh; overflow-y: auto;">${JSON.stringify(info, null, 2)}</pre>`,
      customClass: {
        popup: 'rounded-2xl',
        content: 'text-left'
      }
    });
  };

  return (
    <div className={`min-h-screen text-white flex flex-col ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500'
        : 'bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100'
    }`}>
      {/* Top Bar with theme toggle */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`backdrop-blur-lg border-b py-3 px-4 flex items-center justify-between ${
          theme === 'dark' 
            ? 'bg-white/10 border-white/20'
            : 'bg-white/30 border-gray-200/30'
        }`}
      >
        <div className="flex items-center space-x-6">
          <motion.div 
            className={`flex items-center rounded-full px-3 py-1 cursor-pointer ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/50'
            }`}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowMeetingCode(true)}
          >
            <Calendar className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {meetingId}
            </span>
          </motion.div>
          
          <motion.div 
            className={`flex items-center rounded-full px-3 py-1 ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/50'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <Clock className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className={`text-sm font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(meetingTimer)}
            </span>
          </motion.div>
          
          <motion.div 
            className={`flex items-center rounded-full px-3 py-1 ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100/50'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <Users className={`h-4 w-4 mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {participants.length + 1}
            </span>
          </motion.div>
          
          {isOwner && (
            <motion.div
              className={`flex items-center border rounded-full px-3 py-1 ${
                theme === 'dark' 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-green-100/80 border-green-300/50 text-green-700'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm font-medium">Host</span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="sm"
            className={`rounded-full ${
              theme === 'dark' 
                ? 'text-white hover:bg-white/10 bg-white/5' 
                : 'text-gray-900 hover:bg-white/80 bg-white/60 border border-gray-200'
            }`}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            <SunMoon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMeetingCode(true)}
            className={`rounded-full ${
              theme === 'dark' 
                ? 'text-white hover:bg-white/10 bg-white/5' 
                : 'text-gray-900 hover:bg-white/80 bg-white/60 border border-gray-200'
            }`}
          >
            <Users className="h-4 w-4 mr-1" />
            Invite
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className={`rounded-full ${
              theme === 'dark' 
                ? 'text-white hover:bg-white/10 bg-white/5' 
                : 'text-gray-900 hover:bg-white/80 bg-white/60 border border-gray-200'
            }`}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {settings.showDebug && (
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full ${
                theme === 'dark' 
                  ? 'text-white hover:bg-white/10 bg-white/5' 
                  : 'text-gray-900 hover:bg-white/80 bg-white/60 border border-gray-200'
              }`}
              onClick={showParticipantDebugInfo}
            >
              Debug
            </Button>
          )}
          {isOwner && (
            <Button 
              onClick={() => leaveMeeting(true)}
              className={`border ${
                theme === 'dark'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-400/30'
                  : 'bg-red-500 hover:bg-red-600 text-white border-red-500'
              }`}
              size="sm"
            >
              End Meeting
            </Button>
          )}
          <Button 
            onClick={() => leaveMeeting(false)}
            variant="ghost"
            size="sm"
            className={`${
              theme === 'dark' 
                ? 'text-white hover:bg-white/10 bg-white/5' 
                : 'text-gray-900 hover:bg-white/80 bg-white/60 border border-gray-200'
            }`}
          >
            <PhoneOff className="h-4 w-4 mr-1" />
            Leave
          </Button>
        </div>
      </motion.div>

      {/* Settings Modal */}
      <SettingsModal />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 p-6 grid gap-4 auto-rows-fr ${getGridClass()}`}
        >
          {getAllParticipants.map((participant, index) => (
            <motion.div
              key={`participant-${participant.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => isOwner && !participant.isLocal && showParticipantControls(participant)}
              title={participant.name}
              className="relative"
            >
              <VideoTile 
                name={participant.name}
                isMuted={participant.isMuted}
                isVideoOff={participant.isVideoOff}
                isScreenSharing={participant.isScreenSharing}
                isLocal={participant.isLocal}
                stream={participant.stream}
              >
                {/* Status indicator */}
                <div className="absolute top-2 left-2 z-10">
                  <span className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    participant.live 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {participant.live ? 'Live' : 'Connecting...'}
                  </span>
                </div>
                {/* Owner controls for remote participants */}
                {!participant.isLocal && isOwner && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-2 right-2 flex space-x-1"
                  >
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleParticipantAudio(participant.id, !participant.isMuted);
                      }}
                      className={`rounded-full p-1 ${
                        theme === 'dark' 
                          ? participant.isMuted 
                            ? 'bg-red-500/80 hover:bg-red-500 text-white border-red-400'
                            : 'bg-green-500/80 hover:bg-green-500 text-white border-green-400'
                          : participant.isMuted 
                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                            : 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                      }`}
                      title={participant.isMuted ? 'Unmute participant' : 'Mute participant'}
                    >
                      {participant.isMuted ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleParticipantVideo(participant.id, !participant.isVideoOff);
                      }}
                      className={`rounded-full p-1 ${
                        theme === 'dark' 
                          ? participant.isVideoOff 
                            ? 'bg-red-500/80 hover:bg-red-500 text-white border-red-400'
                            : 'bg-green-500/80 hover:bg-green-500 text-white border-green-400'
                          : participant.isVideoOff 
                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                            : 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                      }`}
                      title={participant.isVideoOff ? 'Enable participant video' : 'Disable participant video'}
                    >
                      {participant.isVideoOff ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageRecipient(participant);
                      }}
                      className={`rounded-full p-1 border ${
                        theme === 'dark' 
                          ? 'bg-blue-500/80 hover:bg-blue-500 border-blue-400 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 border-blue-500 text-white'
                      }`}
                      title="Send private message"
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                    
                    {!participant.live && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestReconnect(participant);
                        }}
                        className={`rounded-full p-1 border ${
                          theme === 'dark'
                            ? 'bg-orange-500/80 hover:bg-orange-500 border-orange-400 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white'
                        }`}
                        title="Reconnect participant"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </motion.div>
                )}
              </VideoTile>
            </motion.div>
          ))}
        </motion.div>

        {/* Chat Panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`w-80 backdrop-blur-lg border-l flex flex-col ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/30 border-gray-200/30'
              }`}
            >
              <div className={`p-4 border-b flex items-center ${
                theme === 'dark' ? 'border-white/20' : 'border-gray-200/30'
              }`}>
                <MessageSquare className={`h-5 w-5 mr-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`} />
                <h3 className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Chat {privateMessageTo && <span className="text-xs">(Private)</span>}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`ml-auto rounded-full ${
                    theme === 'dark' 
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-900 hover:bg-gray-100/50'
                  }`}
                  onClick={() => {
                    setIsChatOpen(false);
                    setPrivateMessageTo(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message, index) => (
                  <motion.div 
                    key={`${message._id}-${message.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg p-3 ${
                      message.isPrivate 
                        ? theme === 'dark'
                          ? 'bg-purple-500/20 border border-purple-400/30'
                          : 'bg-purple-100/80 border border-purple-300/50'
                        : theme === 'dark'
                          ? 'bg-white/5'
                          : 'bg-gray-100/50'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className={`font-medium mr-2 ${
                        theme === 'dark' ? 'text-purple-200' : 'text-purple-700'
                      }`}>
                        {message.sender}
                        {message.isPrivate && <span className="text-xs ml-1">(private)</span>}
                      </span>
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`mt-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {message.text}
                    </p>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <div className={`p-4 border-t ${
                theme === 'dark' ? 'border-white/20' : 'border-gray-200/30'
              }`}>
                {privateMessageTo && (
                  <div className={`mb-2 flex items-center justify-between rounded-lg p-2 text-xs ${
                    theme === 'dark' 
                      ? 'bg-purple-500/20'
                      : 'bg-purple-100/80'
                  }`}>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      Private message to: <span className="font-bold">{
                        participants.find(p => p.id === privateMessageTo)?.name || 'Participant'
                      }</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => setPrivateMessageTo(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Input
                    placeholder={privateMessageTo ? "Type private message..." : "Type a message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className={`flex-1 rounded-full ${
                      theme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder:text-white/60'
                        : 'bg-gray-100/50 border-gray-200/50 text-gray-900 placeholder:text-gray-500'
                    }`}
                  />
                  <Button 
                    onClick={sendMessage} 
                    className={`rounded-full px-6 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                    }`}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`backdrop-blur-lg border-t py-6 px-6 ${
          theme === 'dark' 
            ? 'bg-white/10 border-white/20'
            : 'bg-white/30 border-gray-200/30'
        }`}
      >
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant={isMuted ? "destructive" : "secondary"} 
                size="icon" 
                className={`rounded-full h-14 w-14 backdrop-blur-sm shadow-lg ${
                  theme === 'dark'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-white/80 hover:bg-white text-gray-900 border border-gray-300'
                }`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant={isVideoOff ? "destructive" : "secondary"} 
                size="icon" 
                className={`rounded-full h-14 w-14 backdrop-blur-sm shadow-lg ${
                  theme === 'dark'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-white/80 hover:bg-white text-gray-900 border border-gray-300'
                }`}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 shadow-lg text-white"
                onClick={() => leaveMeeting(false)}
              >
                <PhoneOff className="h-8 w-8" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant={isScreenSharing ? "secondary" : "outline"} 
                size="icon" 
                className={`rounded-full h-14 w-14 backdrop-blur-sm shadow-lg border ${
                  theme === 'dark'
                    ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                    : 'bg-white/80 hover:bg-white border-gray-300 text-gray-900'
                }`}
                onClick={toggleScreenShare}
              >
                <ScreenShare className="h-6 w-6" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant={isChatOpen ? "secondary" : "outline"} 
                size="icon" 
                className={`rounded-full h-14 w-14 backdrop-blur-sm shadow-lg border relative ${
                  theme === 'dark'
                    ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                    : 'bg-white/80 hover:bg-white border-gray-300 text-gray-900'
                }`}
                onClick={() => {
                  setIsChatOpen(!isChatOpen);
                  if (!isChatOpen) {
                    setUnreadMessages(0);
                  }
                }}
              >
                <MessageSquare className="h-6 w-6" />
                {!isChatOpen && messages.length > unreadMessages && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white"
                  >
                    {messages.length - unreadMessages}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <video
        ref={localVideoRef}
        autoPlay
        muted
        style={{ display: 'none' }}
      />

      {/* Meeting Code Modal */}
      <AnimatePresence>
        {showMeetingCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowMeetingCode(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`backdrop-blur-lg border rounded-2xl p-8 max-w-md w-full mx-4 ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/30 border-gray-200/30'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                }`}>
                  <Users className="h-8 w-8 text-white" />
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Invite Others
                </h3>
                <p className={`mb-6 ${
                  theme === 'dark' ? 'text-white/80' : 'text-gray-600'
                }`}>
                  Share this meeting code with others to join
                </p>
                
                <div className={`rounded-xl p-6 mb-6 border ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-100/50 border-gray-200/30'
                }`}>
                  <div className="text-center">
                    <p className={`text-sm mb-2 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      Meeting Code
                    </p>
                    <div className={`text-4xl font-bold font-mono tracking-wider ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {meetingId}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={copyMeetingCode}
                    className={`w-full py-3 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                    }`}
                  >
                    Copy Meeting Code
                  </Button>
                  
                  <Button
                    onClick={() => setShowMeetingCode(false)}
                    variant="ghost"
                    className={`w-full ${
                      theme === 'dark' 
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100/50 border border-gray-300'
                    }`}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Owner Controls Modal */}
      <AnimatePresence>
        {ownerControls && ownerControls.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setOwnerControls(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`backdrop-blur-lg border rounded-2xl p-6 max-w-sm w-full mx-4 ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/30 border-gray-200/30'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Participant Controls
                </h3>
                <div className="text-center mb-6">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    theme === 'dark' 
                      ? 'bg-purple-500/30'
                      : 'bg-purple-100/80'
                  }`}>
                    <User className={`h-10 w-10 ${
                      theme === 'dark' ? 'text-white' : 'text-purple-700'
                    }`} />
                  </div>
                  <p className={`text-lg font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {ownerControls.participant.name}
                  </p>
                  {/* Status badges */}
                  <div className="flex items-center justify-center mt-1 space-x-2">
                    {ownerControls.participant.isMuted && (
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        theme === 'dark' 
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-red-100/80 text-red-700'
                      }`}>
                        Muted
                      </span>
                    )}
                    {ownerControls.participant.isVideoOff && (
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        theme === 'dark' 
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-red-100/80 text-red-700'
                      }`}>
                        Video Off
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        toggleParticipantAudio(
                          ownerControls.participant.id, 
                          !ownerControls.participant.isMuted
                        );
                        setOwnerControls(null);
                      }}
                      variant="outline"
                      className={`py-5 border ${
                        theme === 'dark'
                          ? ownerControls.participant.isMuted
                            ? 'border-green-400/50 bg-green-500/20 hover:bg-green-500/30 text-green-300'
                            : 'border-red-400/50 bg-red-500/20 hover:bg-red-500/30 text-red-300'
                          : ownerControls.participant.isMuted
                            ? 'border-green-500 bg-green-100 hover:bg-green-200 text-green-700'
                            : 'border-red-500 bg-red-100 hover:bg-red-200 text-red-700'
                      }`}
                    >
                      {ownerControls.participant.isMuted ? (
                        <>
                          <Mic className="h-5 w-5 mr-2" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <MicOff className="h-5 w-5 mr-2" />
                          Mute
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        toggleParticipantVideo(
                          ownerControls.participant.id, 
                          !ownerControls.participant.isVideoOff
                        );
                        setOwnerControls(null);
                      }}
                      variant="outline"
                      className={`py-5 border ${
                        theme === 'dark'
                          ? ownerControls.participant.isVideoOff
                            ? 'border-green-400/50 bg-green-500/20 hover:bg-green-500/30 text-green-300'
                            : 'border-red-400/50 bg-red-500/20 hover:bg-red-500/30 text-red-300'
                          : ownerControls.participant.isVideoOff
                            ? 'border-green-500 bg-green-100 hover:bg-green-200 text-green-700'
                            : 'border-red-500 bg-red-100 hover:bg-red-200 text-red-700'
                      }`}
                    >
                      {ownerControls.participant.isVideoOff ? (
                        <>
                          <Video className="h-5 w-5 mr-2" />
                          Enable Video
                        </>
                      ) : (
                        <>
                          <VideoOff className="h-5 w-5 mr-2" />
                          Disable Video
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setMessageRecipient(ownerControls.participant);
                      setOwnerControls(null);
                    }}
                    className={`w-full py-5 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    } text-white`}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Send Private Message
                  </Button>
                  
                  <Button
                    onClick={() => setOwnerControls(null)}
                    variant="ghost"
                    className={`w-full ${
                      theme === 'dark' 
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100/50 border border-gray-300'
                    }`}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}