"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    addUser(name, socket) {
        // Add the user to the user list and queue
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        // Notify the user they are in the lobby
        socket.emit("lobby");
        // Attempt to match users in the queue
        this.clearQueue();
        // Initialize event handlers for the user's socket
        this.initHandlers(socket);
    }
    removeUser(socketId) {
        // Remove the user from the user list and queue
        this.users = this.users.filter((user) => user.socket.id !== socketId);
        this.queue = this.queue.filter((id) => id !== socketId);
        // Check if the user is in a room and remove them
        const roomData = this.roomManager.findRoomBySocketId(socketId);
        if (roomData) {
            const { roomId, room } = roomData;
            // Remove the user from the room
            const remainingUser = this.roomManager.removeUserFromRoom(roomId, socketId);
            // Re-enqueue the remaining user in the room, if any
            if (remainingUser) {
                this.users.push(remainingUser);
                this.queue.push(remainingUser.socket.id);
                this.clearQueue();
            }
        }
    }
    clearQueue() {
        // Match users in the queue if there are at least two
        while (this.queue.length >= 2) {
            const id1 = this.queue.shift();
            const id2 = this.queue.shift();
            if (!id1 || !id2)
                continue;
            const user1 = this.users.find((user) => user.socket.id === id1);
            const user2 = this.users.find((user) => user.socket.id === id2);
            if (!user1 || !user2)
                continue;
            // Create a room for the two users
            this.roomManager.createRoom(user1, user2);
        }
    }
    initHandlers(socket) {
        // Handle SDP offer
        socket.on("offer", ({ sdp, roomId }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        // Handle SDP answer
        socket.on("answer", ({ sdp, roomId, username, }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id, username);
        });
        // Handle ICE candidate exchange
        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
        // Handle end-call event
        socket.on("end-call", ({ roomId }) => {
            const room = this.roomManager.rooms.get(roomId);
            if (!room)
                return;
            const user1 = room.user1;
            const user2 = room.user2;
            // Use the socket.id from the event handler's scope
            const socketId = socket.id;
            // Notify the other user
            if ((user1 === null || user1 === void 0 ? void 0 : user1.socket.id) === socketId) {
                user2 === null || user2 === void 0 ? void 0 : user2.socket.emit("call-ended");
            }
            else if ((user2 === null || user2 === void 0 ? void 0 : user2.socket.id) === socketId) {
                user1 === null || user1 === void 0 ? void 0 : user1.socket.emit("call-ended");
            }
            // Remove the room
            this.roomManager.removeRoom(roomId);
            const user1AlreadyExists = this.users.some((u) => user1 && u.socket.id === user1.socket.id);
            const user2AlreadyExists = this.users.some((u) => user2 && u.socket.id === user2.socket.id);
            if (user1 && !user1AlreadyExists) {
                this.users.push(user1);
                this.queue.push(user1.socket.id);
                console.log("user1 pushed to queue");
            }
            if (user2 && !user2AlreadyExists) {
                this.users.push(user2);
                this.queue.push(user2.socket.id);
                console.log("user2 pushed to queue");
            }
            // Attempt to match users in the queue
            this.clearQueue();
        });
        // Handle disconnect event
        socket.on("disconnect", () => {
            this.removeUser(socket.id);
        });
    }
}
exports.UserManager = UserManager;
