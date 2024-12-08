"use strict";
//  import { User } from "./UserManager";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
let GLOBAL_ROOM_ID = 1;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    // Creates a new room with two users and returns the room ID
    createRoom(user1, user2) {
        const roomId = this.generate().toString();
        console.log(`Room created with ID: ${roomId}`);
        // Store the room with its two users
        this.rooms.set(roomId, { user1, user2 });
        // Notify both users to start their connection process
        user1.socket.emit("send-offer", { roomId });
        user2.socket.emit("send-offer", { roomId });
        return roomId;
    }
    // Removes a room and returns the remaining user, if any
    removeRoomBySocketId(socketId) {
        // Find the room containing the disconnected user
        const roomEntry = [...this.rooms].find(([_, room]) => room.user1.socket.id === socketId || room.user2.socket.id === socketId);
        if (!roomEntry) {
            console.log(`No room found for socket ID: ${socketId}`);
            return null; // No room found
        }
        const [roomId, room] = roomEntry;
        const remainingUser = room.user1.socket.id === socketId ? room.user2 : room.user1;
        // Remove the room from the rooms map
        this.rooms.delete(roomId);
        console.log(`Room with ID: ${roomId} removed`);
        return remainingUser;
    }
    // Handle offer signaling from one user to the other
    onOffer(roomId, sdp, senderSocketId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.emit("offer", { sdp, roomId });
    }
    // Handle answer signaling from one user to the other
    onAnswer(roomId, sdp, senderSocketId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.emit("answer", { sdp, roomId });
    }
    // Handle ICE candidates signaling between users
    onIceCandidates(roomId, senderSocketId, candidate, type) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.emit("add-ice-candidate", { candidate, type });
    }
    // Generate unique room ID
    generate() {
        return GLOBAL_ROOM_ID++;
    }
}
exports.RoomManager = RoomManager;
