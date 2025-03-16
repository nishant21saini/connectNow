

import { Socket } from "socket.io";
import { User, Room } from "./Common-types";


export class RoomManager {
    public rooms: Map<string, Room>;
    
    constructor() {
        this.rooms = new Map();
    }

    createRoom(user1: User, user2: User) {
        const roomId = `${user1.socket.id}-${user2.socket.id}`;
        const room: Room = { user1, user2 };
        this.rooms.set(roomId, room);

        user1.socket.emit("send-offer", { roomId, });
        user2.socket.emit("send-offer", { roomId, });
    }

    removeRoom(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        return this.rooms.delete(roomId);
    }

    removeUserFromRoom(roomId: string, socketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        let remainingUser: User | null = null;

        // Remove the user from the room
        if (room.user1?.socket.id === socketId) {
            remainingUser = room.user2;
        } else if (room.user2?.socket.id === socketId) {
            remainingUser = room.user1;
        }

        // Notify the remaining user (if any) that the call has ended
        if (remainingUser) {
            remainingUser.socket.emit("call-ended");
        }

        // Delete the room if both users are gone
        
            this.rooms.delete(roomId);
    

        return remainingUser;
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

    onAnswer(roomId: string, sdp: string, senderId: string,username:string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receiver = room.user1?.socket.id === senderId ? room.user2 : room.user1;
        receiver?.socket.emit("answer", { sdp, roomId ,username});
    }
    
    onIceCandidates(roomId: string, senderId: string, candidate: RTCIceCandidate, type: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const receiver = room.user1?.socket.id === senderId ? room.user2 : room.user1;
        receiver?.socket.emit("add-ice-candidate", { candidate, type });
    }
}
