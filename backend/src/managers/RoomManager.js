"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(user1, user2) {
        const roomId = `${user1.socket.id}-${user2.socket.id}`;
        const room = { user1, user2 };
        this.rooms.set(roomId, room);
        user1.socket.emit("send-offer", { roomId, });
        user2.socket.emit("send-offer", { roomId, });
    }
    removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        return this.rooms.delete(roomId);
    }
    removeUserFromRoom(roomId, socketId) {
        var _a, _b;
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        let remainingUser = null;
        // Remove the user from the room
        if (((_a = room.user1) === null || _a === void 0 ? void 0 : _a.socket.id) === socketId) {
            remainingUser = room.user2;
        }
        else if (((_b = room.user2) === null || _b === void 0 ? void 0 : _b.socket.id) === socketId) {
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
    findRoomBySocketId(socketId) {
        var _a, _b;
        for (const [roomId, room] of this.rooms.entries()) {
            if (((_a = room.user1) === null || _a === void 0 ? void 0 : _a.socket.id) === socketId || ((_b = room.user2) === null || _b === void 0 ? void 0 : _b.socket.id) === socketId) {
                return { roomId, room };
            }
        }
        return null;
    }
    onOffer(roomId, sdp, senderId) {
        var _a;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const receiver = ((_a = room.user1) === null || _a === void 0 ? void 0 : _a.socket.id) === senderId ? room.user2 : room.user1;
        receiver === null || receiver === void 0 ? void 0 : receiver.socket.emit("offer", { sdp, roomId });
    }
    onAnswer(roomId, sdp, senderId, username) {
        var _a;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const receiver = ((_a = room.user1) === null || _a === void 0 ? void 0 : _a.socket.id) === senderId ? room.user2 : room.user1;
        receiver === null || receiver === void 0 ? void 0 : receiver.socket.emit("answer", { sdp, roomId, username });
    }
    onIceCandidates(roomId, senderId, candidate, type) {
        var _a;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const receiver = ((_a = room.user1) === null || _a === void 0 ? void 0 : _a.socket.id) === senderId ? room.user2 : room.user1;
        receiver === null || receiver === void 0 ? void 0 : receiver.socket.emit("add-ice-candidate", { candidate, type });
    }
}
exports.RoomManager = RoomManager;
