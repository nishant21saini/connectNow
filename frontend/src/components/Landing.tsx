import { useEffect, useRef, useState } from "react";
import * as faceapi from 'face-api.js';
import { Room } from './Room';
import { AlertCircle, Check, Loader, User } from 'lucide-react';

export const Landing = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionActiveRef = useRef<boolean>(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const showPopup = (!faceDetected || !modelsLoaded || cameraLoading) && !joined;
  const joinDisabled = !name.trim() || !faceDetected || !modelsLoaded || connecting;
  useEffect(() => {
    const loadModels = async () => {
      try {

        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights');
        setModelsLoaded(true);
        startVideoStream();
      } catch (error) {
       
        setError("Failed to load face detection models. Please check your internet connection and refresh.");
      }
    };
    
    loadModels();
    
    return () => {
      
      stopMediaStream();
    };
  }, []);


  const startVideoStream = async () => {
    try {
      setCameraLoading(true);
      
      if (streamRef.current) {
        stopMediaStream(); 
      }
      
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", 
          width: { ideal: 600 }, 
          height: { ideal: 480 } 
        },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
    
      streamRef.current = stream;
      
      if (!videoRef.current) {
        
        setError("Video element not found. Please refresh.");
        setCameraLoading(false);
        return;
      }
      
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.onloadeddata = () => {
       
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
             
              
              if (streamRef.current) {
                const audioTracks = streamRef.current.getAudioTracks();
                const videoTracks = streamRef.current.getVideoTracks();
                
                if (audioTracks.length > 0) setLocalAudioTrack(audioTracks[0]);
                if (videoTracks.length > 0) setLocalVideoTrack(videoTracks[0]);
              }
              
              setCameraLoading(false);
            })
            .catch(err => {
            
              setError("Failed to play video stream. Please refresh and try again.");
              setCameraLoading(false);
            });
        }
      };
      
      // Add error handler
      videoRef.current.onerror = () => {
   
        setError("Video element encountered an error.");
        setCameraLoading(false);
      };
      
    } catch (error) {
     
      setError("Camera access denied. Please enable camera permissions and refresh.");
      setCameraLoading(false);
    }
  };

  const stopMediaStream = () => {
    if (streamRef.current) {
    
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  // Face detection interval
  useEffect(() => {
    if (cameraLoading || !modelsLoaded || joined) return;
    
    const interval = setInterval(async () => {
      if (videoRef.current && detectionActiveRef.current) {
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks().withFaceDescriptors();
          
          setFaceDetected(detections.length > 0); 
          console.log(`Detected ${detections.length} faces`);
        } catch (error) {
          console.error("Face detection error:", error);
        }
      }
    }, 1000); 
    
    return () => clearInterval(interval); 
  }, [cameraLoading, modelsLoaded, joined]);

  // Handlers
  const handleJoin = async () => {
    if (joinDisabled) return;
    
    try {
      setConnecting(true);
   
      detectionActiveRef.current = false;
      await new Promise(resolve => setTimeout(resolve, 1500));
      setJoined(true);
    } catch (error) {
      setError("Failed to connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    detectionActiveRef.current = true;
    setFaceDetected(false);
    await startVideoStream();
  };

  if (joined) {
    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 flex justify-center items-center">
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

      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1] z-10" 
      />
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
              placeholder="Enter your name"
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
              : 'text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2'
          }`}
          disabled={joinDisabled}
          onClick={handleJoin}
        >
          {connecting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Connecting...
            </span>
          ) : joinDisabled ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              {!name.trim() ? "Enter your name" : "Verifying..."}
            </span>
          ) : (
            "Join Meeting"
          )}
        </button>
      </div>

    
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
