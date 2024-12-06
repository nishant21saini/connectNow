
// import { User } from "./UserManager";
// import  {UserManager}  from "./UserManager";

// // Unique Room ID counter
// let GLOBAL_ROOM_ID = 1;

// interface Room {
//     user1: User | null; // First user in the room
//     user2: User | null; // Second user in the room
//     localVideoTrack: MediaStreamTrack | null; // Your local video track (you)
//     remoteVideoTrack: MediaStreamTrack | null; // Remote user's video track (stranger)
//     micEnabled: boolean; // Whether the mic is enabled
// }

// export class RoomManager {
//     private rooms: Map<string, Room>; // Stores the rooms

//     constructor() {
//         this.rooms = new Map<string, Room>();
//     }

//     // Create a new room with two users
//     createRoom(user1: User, user2: User) {
//         const roomId = this.generate().toString();
//         console.log(`Room created: ${roomId}`);

//         // Create initial empty tracks for video streams and mic state
//         const newRoom: Room = {
//             user1,
//             user2,
//             localVideoTrack: null,
//             remoteVideoTrack: null,
//             micEnabled: true, // Mic is on by default
//         };

//         this.rooms.set(roomId, newRoom);

//         // Notify both users to send an offer for the video call
//         user1.socket.emit("send-offer", { roomId });
//         user2.socket.emit("send-offer", { roomId });

//         return roomId;
//     }

//     // Replace a user in a room
//     replaceUserInRoom(roomId: string, oldSocketId: string, newUser: User): void {
//         const room = this.rooms.get(roomId);
//         if (!room) return;

//         if (room.user1?.socket.id === oldSocketId) {
//             room.user1 = newUser;
//         } else if (room.user2?.socket.id === oldSocketId) {
//             room.user2 = newUser;
//         } else {
//             console.error(`No user with socket ID: ${oldSocketId} found in room ${roomId}`);
//             return;
//         }

//         // Notify both users
//         if (room.user1 && room.user2) {
//             room.user1.socket.emit("send-offer", { roomId });
//             room.user2.socket.emit("send-offer", { roomId });
//         } else {
//             console.log(`Room ${roomId} has only one user; waiting for a new match.`);
//         }
//     }
    
    
//     // Find a room by the socket ID of the user
//     findRoomBySocketId(socketId: string): { roomId: string; room: Room } | null {
//         for (const [roomId, room] of this.rooms.entries()) {
//             if (room.user1?.socket.id === socketId || room.user2?.socket.id === socketId) {
//                 return { roomId, room };
//             }
//         }
//         return null;
//     }

//     // Handle receiving an offer
//     onOffer(roomId: string, sdp: string, senderSocketId: string) {
//         const room = this.rooms.get(roomId);
//         if (!room) return;

//         const receivingUser = room.user1?.socket.id === senderSocketId ? room.user2 : room.user1;
//         receivingUser?.socket.emit("offer", { sdp, roomId });
//     }

//     // Handle receiving an answer to an offer
//     onAnswer(roomId: string, sdp: string, senderSocketId: string) {
//         const room = this.rooms.get(roomId);
//         if (!room) return;

//         const receivingUser = room.user1?.socket.id === senderSocketId ? room.user2 : room.user1;
//         receivingUser?.socket.emit("answer", { sdp, roomId });
//     }

//     // Handle ICE candidates
//     onIceCandidates(roomId: string, senderSocketId: string, candidate: any, type: "sender" | "receiver") {
//         const room = this.rooms.get(roomId);
//         if (!room) return;

//         const receivingUser = room.user1?.socket.id === senderSocketId ? room.user2 : room.user1;
//         receivingUser?.socket.emit("add-ice-candidate", { candidate, type });
//     }

//     // Enable/Disable the microphone for a user
//     toggleMic(roomId: string, senderSocketId: string) {
//         const room = this.rooms.get(roomId);
//         if (!room) return;

//         // Toggle the mic state
//         const user = room.user1?.socket.id === senderSocketId ? room.user1 : room.user2;
//         if (user) {
//             room.micEnabled = !room.micEnabled;
//             // Emit the mic toggle event to the user (or all users)
//             user.socket.emit("mic-toggled", { micEnabled: room.micEnabled });
//         }
//     }

//     // Set video tracks for a room
//     setVideoTracks(roomId: string, localTrack: MediaStreamTrack, remoteTrack: MediaStreamTrack) {
//         const room = this.rooms.get(roomId);
//         if (!room) return;

//         // Assign video tracks for local and remote users
//         room.localVideoTrack = localTrack;
//         room.remoteVideoTrack = remoteTrack;

//         // Notify the users about the new video tracks (can be handled by your front-end)
//         room.user1?.socket.emit("video-track-set", { localTrack, remoteTrack, roomId });
//         room.user2?.socket.emit("video-track-set", { localTrack, remoteTrack, roomId });
//     }

//     // Generate a new room ID
//     generate() {
//         return GLOBAL_ROOM_ID++;
//     }
// }



import { User } from "./UserManager";

export interface Room {
    user1: User | null;
    user2: User | null;
}

export class RoomManager {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    createRoom(user1: User, user2: User) {
        const roomId = `${user1.socket.id}-${user2.socket.id}`;
        const room: Room = { user1, user2 };
        this.rooms.set(roomId, room);

        user1.socket.emit("send-offer", { roomId });
        user2.socket.emit("send-offer", { roomId });
    }

    removeUserFromRoom(roomId: string, socketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        if (room.user1?.socket.id === socketId) {
            room.user1 = null;
        } else if (room.user2?.socket.id === socketId) {
            room.user2 = null;
        }

        if (!room.user1 && !room.user2) {
            this.rooms.delete(roomId);
        }
    }

    replaceUserInRoom(roomId: string, oldSocketId: string, newUser: User) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        if (room.user1?.socket.id === oldSocketId) {
            room.user1 = newUser;
        } else if (room.user2?.socket.id === oldSocketId) {
            room.user2 = newUser;
        }

        if (room.user1 && room.user2) {
            room.user1.socket.emit("send-offer", { roomId });
            room.user2.socket.emit("send-offer", { roomId });
        }
    }

    findRoomBySocketId(socketId: string) {
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.user1?.socket.id === socketId || room.user2?.socket.id === socketId) {
                return { roomId, room };
            }
        }
        return null;
    }

    onOffer(roomId: string, sdp: string, senderId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receiver = room.user1?.socket.id === senderId ? room.user2 : room.user1;
        receiver?.socket.emit("offer", { sdp, roomId });
    }

    onAnswer(roomId: string, sdp: string, senderId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receiver = room.user1?.socket.id === senderId ? room.user2 : room.user1;
        receiver?.socket.emit("answer", { sdp, roomId });
    }

    onIceCandidates(roomId: string, senderId: string, candidate: RTCIceCandidate, type: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receiver = room.user1?.socket.id === senderId ? room.user2 : room.user1;
        receiver?.socket.emit("add-ice-candidate", { candidate, type });
    }
}
