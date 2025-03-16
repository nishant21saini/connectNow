import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { User, PhoneOff, Mic, MicOff, Video, VideoOff, RefreshCw, UserPlus } from 'lucide-react';

const SERVER_URL = "http://localhost:3000";

// Define global type for window to access peer connection for debugging
declare global {
    interface Window {
        pc: RTCPeerConnection | null;
    }
}

interface RoomProps {
    name: string;
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;
}

export const Room = ({ name, localAudioTrack, localVideoTrack }: RoomProps) => {
    // State management
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [r_user, setRuser] = useState<string|null>("Stranger");
    const [callDuration, setCallDuration] = useState(0);
    //const [isCallActive, setIsCallActive] = useState(false);
    
    // Refs for video elements
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
   // const timerRef = useRef<number | null>(null);

    // Setup local video display
    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
            localVideoRef.current.play();
        }
    }, [localVideoRef, localVideoTrack]);

    // Call duration timer
    
    // WebRTC and Socket.io connection setup
    useEffect(() => {
        const socket = io(SERVER_URL, {
            auth: {
                username: name,
            }
        });

        // Socket event handlers
        socket.on("lobby", () => {
            setLobby(true);
        });

        // Handle offer request from server (when matched with another user)
        socket.on('send-offer', async ({ roomId, user }) => {
            setLobby(false);
            setRoomId(roomId);
            const pc = new RTCPeerConnection();
            setSendingPc(pc);
            
            if (localVideoTrack) {
                pc.addTrack(localVideoTrack);
            }
            
            if (localAudioTrack) {
                pc.addTrack(localAudioTrack);
            }
            
            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    });
                }
            };
            
            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer();
                await pc.setLocalDescription(sdp);
                
                socket.emit("offer", {
                    sdp,
                    roomId
                });
            };
        });
        
        // Handle incoming offer from other peer
        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            setRoomId(roomId);
            
            const pc = new RTCPeerConnection();
            await pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createAnswer();
            await pc.setLocalDescription(sdp);
            
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setRemoteMediaStream(stream);
            setReceivingPc(pc);
            window.pc = pc; // For debugging
            
            pc.ontrack = (event) => {
                if (event.track.kind === "video") {
                    setRemoteVideoTrack(event.track);
                } else if (event.track.kind === "audio") {
                    setRemoteAudioTrack(event.track);
                }
                
                if (remoteVideoRef.current && remoteVideoRef.current.srcObject instanceof MediaStream) {
                    remoteVideoRef.current.srcObject.addTrack(event.track);
                }
            };
            
            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                    });
                }
            };
            
            socket.emit("answer", {
                roomId,
                sdp: sdp,
                username: name
            });
            
            // Backup method to get remote tracks if ontrack doesn't fire
            setTimeout(() => {
                if (!remoteVideoTrack && !remoteAudioTrack && pc.getTransceivers().length >= 2) {
                    const track1 = pc.getTransceivers()[0].receiver.track;
                    const track2 = pc.getTransceivers()[1].receiver.track;
                    
                    if (track1.kind === "video") {
                        setRemoteAudioTrack(track2);
                        setRemoteVideoTrack(track1);
                    } else {
                        setRemoteAudioTrack(track1);
                        setRemoteVideoTrack(track2);
                    }
                    
                    if (remoteVideoRef.current && remoteVideoRef.current.srcObject instanceof MediaStream) {
                        remoteVideoRef.current.srcObject.addTrack(track1);
                        remoteVideoRef.current.srcObject.addTrack(track2);
                        remoteVideoRef.current.play();
                    }
                }
            }, 5000);
        });
        
        // Handle incoming answer from peer
        socket.on("answer", ({ sdp: remoteSdp, username: remoteUsername }) => {
            setLobby(false);
            setRuser(remoteUsername);
            setSendingPc(pc => {
                if (pc) {
                    pc.setRemoteDescription(remoteSdp);
                }
                return pc;
            });
        });
        
        // Handle incoming ICE candidates
        socket.on("add-ice-candidate", ({ candidate, type }) => {
            if (type === "sender") {
                setReceivingPc(pc => {
                    if (pc) pc.addIceCandidate(candidate);
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (pc) pc.addIceCandidate(candidate);
                    return pc;
                });
            }
        });
        
        // Handle call ended event
        socket.on("call-ended", () => {
            cleanupCall();
        });
        
        setSocket(socket);
        
        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [name, localAudioTrack, localVideoTrack]);
    
    // Function to end the current call
    const endCall = (socket: Socket | null) => {
        if (!socket || !roomId) return;
        
        socket.emit("end-call", { roomId });
        cleanupCall();
    };
    
    // Clean up resources when a call ends
    const cleanupCall = () => {
        remoteVideoTrack?.stop();
        remoteAudioTrack?.stop();
        
        sendingPc?.close();
        receivingPc?.close();
        
        setLobby(true);
        setSendingPc(null);
        setReceivingPc(null);
        setRemoteAudioTrack(null);
        setRemoteVideoTrack(null);
        setRemoteMediaStream(null);
        setRoomId(null);
        
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    };
    
    // Toggle microphone on/off
    const toggleMic = () => {
        if (localAudioTrack) {
            localAudioTrack.enabled = !isMicOn;
            setIsMicOn(!isMicOn);
        }
    };
    
    // Toggle camera on/off
    const toggleCamera = () => {
        if (localVideoTrack) {
            localVideoTrack.enabled = !isCameraOn;
            setIsCameraOn(!isCameraOn);
        }
    };
    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6">
                <div className="mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-[#008cba] text-white p-2 rounded-lg">
                            <User className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Hello, <span className="text-[#008cba] dark:text-[#006c8a]">{name}</span>
                        </h1>
                    </div>
                    <div className="flex items-center">
                        <span className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                            lobby ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : 
                                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                                lobby ? "bg-yellow-400 animate-pulse" : "bg-green-400"
                            }`}></span>
                            {lobby ? "Searching..." : "Connected!"}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                <div className="h-full w-full">
                    {/* Remote Video Frame */}
                    <div className="h-full bg-gray-800 relative border-4 border-gray-200 dark:border-gray-700 rounded-xl m-4 overflow-hidden shadow-2xl">
                        <video
                            autoPlay
                            playsInline
                            ref={remoteVideoRef}
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Remote User Info */}
                        {remoteVideoTrack && (
                            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {r_user}
                            </div>
                        )}
                        
                    </div>

                    {/* Local Video Preview */}
                    <div className="absolute bottom-6 right-6 w-48 h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-white dark:border-gray-700 bg-gray-800 transition-transform hover:scale-105">
                        <video
                            autoPlay
                            playsInline
                            muted
                            ref={localVideoRef}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 text-white text-xs bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                            You
                        </div>
                    </div>

                    {/* Lobby Overlay */}
                    {lobby && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl max-w-md">
                                <div className="animate-pulse space-y-4">
                                    <div className="bg-[#008cba]/20 p-4 rounded-full inline-flex">
                                        <UserPlus className="h-12 w-12 text-[#008cba]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Connecting with someone special...
                                    </h3>
                                    <div className="flex justify-center">
                                        <RefreshCw className="w-6 h-6 text-[#008cba] animate-spin" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Control Bar */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
                <div className="flex items-center justify-center space-x-6">
                    <button
                        onClick={toggleMic}
                        className={`p-3 rounded-full flex items-center justify-center transition-all ${
                            isMicOn 
                                ? "bg-[#008cba] text-white hover:bg-[#007399]"
                                : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                    >
                        {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={() => endCall(socket)}
                        className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transform transition-all hover:scale-110"
                    >
                        <PhoneOff className="w-8 h-8" />
                    </button>

                    <button
                        onClick={toggleCamera}
                        className={`p-3 rounded-full flex items-center justify-center transition-all ${
                            isCameraOn 
                                ? "bg-[#008cba] text-white hover:bg-[#007399]"
                                : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                    >
                        {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                </div>
            </footer>
        </div>
    );
};