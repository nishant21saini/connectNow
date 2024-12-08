import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import './Room.css';

const URL = "http://localhost:3000";
declare global {
    interface Window {
        pc: RTCPeerConnection | null;
    }
}

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {
    
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement|null>(null);
    const localVideoRef = useRef<HTMLVideoElement|null>(null);

    useEffect(() => {
        const socket = io(URL);
        socket.on('send-offer', async ({roomId}) => {
            console.log("sending offer");
            setLobby(false);
            const pc = new RTCPeerConnection();

            setSendingPc(pc);
            if (localVideoTrack) {
                console.error("added tack");
                console.log(localVideoTrack)
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                console.error("added tack");
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                   })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation neeeded, sending offer");
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        });

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("received offer");
            setLobby(false);
            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }

            setRemoteMediaStream(stream);
            // trickle ice 
            setReceivingPc(pc);
            window.pc = pc;
            pc.ontrack = () => {
                alert("ontrack");
                
            }

            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;
                }
                console.log(" ice candidate on receiving side");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                   })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
                
            }, 5000)
        });

        socket.on("answer", ({roomId, sdp: remoteSdp}) => {
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            });
            console.log("loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("add ice candidate from remote");
            console.log({candidate, type})
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receiving pc not found");
                    } else {
                        console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc nout found")
                    } else {
                        // console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            }
        })

        setSocket(socket)
    }, [name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])
    
    const endCall = (socket: Socket | null) => {
        if (!socket) return;
    
        // Notify the server to end the call
        socket.emit("end-call");
    
        // Stop local tracks
        // if (localVideoTrack) {
        //     localVideoTrack.stop(); // Stop the local video track
        // }
        // if (localAudioTrack) {
        //     localAudioTrack.stop(); // Stop the local audio track
        // }
    
        // Stop remote tracks
        if (remoteVideoTrack) {
            remoteVideoTrack.stop(); // Stop the remote video track
        }
        if (remoteAudioTrack) {
            remoteAudioTrack.stop();
        }
    
        // Close the peer connections
        sendingPc?.close(); // Close the sending peer connection
        receivingPc?.close(); // Close the receiving peer connection
    
        // Reset the local state
        setLobby(true);
        setSendingPc(null);
        setReceivingPc(null);
        setRemoteAudioTrack(null);
        setRemoteVideoTrack(null);
        setRemoteMediaStream(null);
    
        // Clear video elements
       // if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
    };
    
    const [isMicOn, setIsMicOn] = useState(true);
const toggleMic = () => {
    if (localAudioTrack) {
        localAudioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
    }
};
    return (
        <div className="room-container">
            
            <header className="room-header">
                <h1 className="room-title">👋 Hi, {name}!</h1>
                <p className="room-subtitle">
                    {lobby
                        ? "Get ready to connect with someone amazing!"
                        : "You're connected! Have a great conversation."}
                </p>
            </header>
    
            <div className="video-container">
                <div className="video-box local">
                    <video
                        autoPlay
                        ref={localVideoRef}
                        className="local-video"
                    />
                    <p className="video-label">You</p>
                </div>
    
                {lobby && (
                    <div className="lobby-message">
                        <p>⏳ Waiting to connect you to someone...</p>
                    </div>
                )}
    
                <div className="video-box remote">
                    <video
                        autoPlay
                        ref={remoteVideoRef}
                        className="remote-video"
                    />
                    {remoteVideoTrack && <p className="video-label">Stranger</p>}
                </div>
            </div>
    
            {!lobby && (
                <footer className="room-footer">
                    <button
                        className="end-call-button"
                        onClick={() => endCall(socket)}
                    >
                        End Call
                    </button>
                    <button className="mic-toggle-button" onClick={toggleMic} aria-label={isMicOn ? "Mute Microphone" : "Unmute Microphone"}>
    <img
        src={isMicOn ? "/src/components/unmute.png" : "/src/components/mute.svg"}
        alt={isMicOn ? "Unmute" : "Mute"}
        className="mic-icon"
    />
</button>

                </footer>
            )}
        </div>
    );
    
};
