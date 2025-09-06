import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, VideoOff, User } from 'lucide-react';

export default function VideoTile({ name, isMuted, isVideoOff, isScreenSharing, isLocal, stream, children }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentStreamRef = useRef(null);

  // Stable video setup function
  const setupVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !stream) {
      setVideoReady(false);
      setIsPlaying(false);
      return;
    }

    // Skip if this is the same stream
    if (currentStreamRef.current === stream) {
      return;
    }

    console.log(`🎬 Setting up video for ${name}`, { 
      streamId: stream.id, 
      tracks: stream.getTracks().length,
      isLocal 
    });

    try {
      // Store current stream reference
      currentStreamRef.current = stream;

      // Set video properties
      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      // Handle video events
      const handleCanPlay = () => {
        console.log(`✅ Video can play for ${name}`);
        setVideoReady(true);
        
        // Try to play if not already playing
        if (video.paused) {
          video.play().then(() => {
            console.log(`▶️ Video playing for ${name}`);
            setIsPlaying(true);
          }).catch(error => {
            console.warn(`⚠️ Play failed for ${name}:`, error);
            // Don't set error state, video might still work
          });
        }
      };

      const handleLoadedMetadata = () => {
        console.log(`📹 Video metadata loaded for ${name}`);
        setVideoReady(true);
      };

      const handlePlaying = () => {
        console.log(`🎥 Video started playing for ${name}`);
        setIsPlaying(true);
      };

      const handleError = (e) => {
        console.error(`❌ Video error for ${name}:`, e);
        setVideoReady(false);
        setIsPlaying(false);
      };

      // Clean up previous listeners
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);

      // Add new listeners
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);

      // Force load if metadata is already available
      if (video.readyState >= 1) {
        handleLoadedMetadata();
        handleCanPlay();
      }

    } catch (err) {
      console.error(`❌ Setup error for ${name}:`, err);
      setVideoReady(false);
      setIsPlaying(false);
    }
  }, [stream, name, isLocal]);

  // Setup video when stream changes
  useEffect(() => {
    if (stream && stream.getTracks().length > 0) {
      setupVideo();
    } else {
      console.log(`🚫 No stream for ${name}`);
      currentStreamRef.current = null;
      setVideoReady(false);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, setupVideo, name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const showVideo = stream && videoReady && !isVideoOff;

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          showVideo ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ display: showVideo ? 'block' : 'none' }}
      />
      
      {/* Placeholder */}
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3">
              <User className="h-8 w-8 text-white" />
            </div>
            <span className="text-white text-sm font-medium mb-1">{name}</span>
            <span className="text-gray-400 text-xs">
              {!stream 
                ? 'Connecting...' 
                : isVideoOff 
                  ? 'Video off' 
                  : videoReady 
                    ? 'Loading...' 
                    : 'Setting up...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Name and mic status overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm flex items-center max-w-[calc(100%-1rem)]">
        {isMuted ? (
          <MicOff className="h-3 w-3 mr-1 text-red-400 flex-shrink-0" />
        ) : (
          <Mic className="h-3 w-3 mr-1 text-green-400 flex-shrink-0" />
        )}
        <span className="truncate">{name}</span>
      </div>
      
      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
          Screen Sharing
        </div>
      )}
      
      {/* Additional controls/content */}
      {children}
    </div>
  );
}