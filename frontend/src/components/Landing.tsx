import { useEffect, useRef, useState } from "react";
import * as faceapi from 'face-api.js';
import { Room } from './Room';
import { AlertCircle, Check, Loader, Camera, User } from 'lucide-react';

export const Landing = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // State
  const [faceDetected, setFaceDetected] = useState(false);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);

  // Derived state
  const showPopup = !faceDetected || !modelsLoaded || cameraLoading;
  const joinDisabled = !name.trim() || !faceDetected || !modelsLoaded;

  // Load face detection models
  useEffect(() => {
    let isMounted = true;
    
    const loadModels = async () => {
      try {
        const modelUrls = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrls),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrls),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrls)
        ]);
        
        if (isMounted) {
          setModelsLoaded(true);
          await startVideoStream();
        }
      } catch (error) {
        console.error("Model loading error:", error);
        if (isMounted) setError("Failed to load face detection. Please refresh.");
      }
    };
    
    loadModels();
    
    return () => {
      isMounted = false;
      stopMediaStream();
    };
  }, []);

  // Media stream handling
  const startVideoStream = async () => {
    try {
      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      if (!videoRef.current) return;
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      await videoRef.current.play().catch(e => {
        throw new Error('Video playback failed');
      });
      
      setLocalAudioTrack(stream.getAudioTracks()[0]);
      setLocalVideoTrack(stream.getVideoTracks()[0]);
      setCameraLoading(false);
    } catch (error) {
      console.error("Media access error:", error);
      setError("Camera/microphone access required. Please enable permissions.");
      setCameraLoading(false);
    }
  };

  const stopMediaStream = () => {
    streamRef.current?.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    streamRef.current = null;
  };

  // Face detection
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;
    
    let detectionActive = true;
    
    const detectFaces = async () => {
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
          .withFaceLandmarks();
        
        if (detectionActive) {
          setFaceDetected(detections.length > 0);
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    };
    
    const detectionInterval = setInterval(detectFaces, 1000);
    
    return () => {
      detectionActive = false;
      clearInterval(detectionInterval);
    };
  }, [modelsLoaded]);

  // Handlers
  const handleJoin = () => {
    if (!joinDisabled) {
      setJoined(true);
    }
  };

  const handleRetry = async () => {
    setError(null);
    await startVideoStream();
  };

  if (joined) {
    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 flex justify-center items-center">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button 
            onClick={handleRetry}
            className="ml-2 px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Status Overlay */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-30 px-4 py-3 rounded-lg shadow-lg transition-opacity ${
        showPopup ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${faceDetected ? "bg-green-500" : "bg-yellow-500"} text-white flex items-center space-x-2`}>
        {cameraLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Initializing camera...</span>
          </>
        ) : modelsLoaded ? (
          <>
            {faceDetected ? (
              <>
                <Check className="w-5 h-5" />
                <span>Face detected!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Position your face in frame</span>
              </>
            )}
          </>
        ) : (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading face detection...</span>
          </>
        )}
      </div>

      {/* Video Preview */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1] z-10" 
      />

      {/* Join Card */}
      <div className="relative z-20 flex flex-col items-center p-8 bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl w-96">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">connectNow</h1>
        </div>

        <div className="w-full mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nishant Saini"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500"
              autoComplete="name"
            />
            <User className="absolute right-3 top-3.5 text-gray-500 w-5 h-5" />
          </div>
        </div>

        <button
          className={`w-full py-3.5 font-medium rounded-lg transition-all ${
            joinDisabled 
              ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
              : 'text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2'
          }`}
          disabled={joinDisabled}
          onClick={handleJoin}
        >
          {joinDisabled ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              {!name.trim() ? "Enter your name" : "Verifying..."}
            </span>
          ) : (
            "Join Meeting"
          )}
        </button>
      </div>

      {/* System Status */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800 text-sm text-gray-300">
          <span className={`w-2.5 h-2.5 rounded-full ${
            modelsLoaded ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
          }`} />
          <span>{modelsLoaded ? "Face Detection Ready" : "Loading AI Models"}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800 text-sm text-gray-300">
          <span className={`w-2.5 h-2.5 rounded-full ${
            faceDetected ? 'bg-green-400' : 'bg-red-400 animate-pulse'
          }`} />
          <span>{faceDetected ? "Face Verified" : "Awaiting Verification"}</span>
        </div>
      </div>
    </div>
  );
};