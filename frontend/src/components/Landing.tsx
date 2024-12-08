import { useEffect, useRef, useState } from "react";
import * as faceapi from 'face-api.js';
import "./Landing.css";

// Assuming `Room` component is available
import { Room } from './Room';

export const Landing = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [showPopup, setShowPopup] = useState(true); // Show popup when face is not detected

  // State to store audio and video tracks
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);

  // Load models from CDN
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load models from jsDelivr CDN
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights');
        
        // After models are loaded, start the video stream
        startVideoStream();
      } catch (error) {
        console.error("Error loading face detection models:", error);
      }
    };
    loadModels();
  }, []);

  // Start webcam video stream and capture audio/video tracks
  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // No need to explicitly call play(), the browser does that automatically.
      }

      // Capture the audio and video tracks
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  // Periodically check for face detections
  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        setFaceDetected(detections.length > 0); // Set state if faces are detected
      }
    }, 1000); // Check every second

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Stop video stream
  // const stopVideoStream = () => {
  //   if (videoRef.current && videoRef.current.srcObject) {
  //     const stream = videoRef.current.srcObject as MediaStream;
  //     stream.getTracks().forEach((track) => track.stop());
  //   }
  // };

  useEffect(() => {
    // Hide popup when face is detected
    if (faceDetected) {
      setShowPopup(false);
    } else {
      setShowPopup(true);
    }
  }, [faceDetected]);

  if (!joined) {
    return (
      <div className="landing-container">
        {/* Face detection popup */}
        <div className={`face-detection-popup ${showPopup ? "visible" : ""}`}>
          {faceDetected ? "Face Detected!" : "Please make sure your face is visible."}
        </div>
        
        <video ref={videoRef} autoPlay muted className="video-background" />
        
        <div className="overlay">
          <input
            type="text"
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
            className="name-input"
          />
          <button
            onClick={() => setJoined(true)}
            disabled={!name || !faceDetected} // Enable button if either name or face detected
            className="join-button">
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Assuming Room component exists and requires localAudioTrack and localVideoTrack */}
      <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
    </div>
  );
};
