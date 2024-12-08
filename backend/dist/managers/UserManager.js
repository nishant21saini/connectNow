"use strict";
// import { Socket } from "socket.io";
// import { RoomManager } from "./RoomManager";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    // Add a new user to the system and try to match them
    addUser(name, socket) {
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }
    // Remove a user, manage their room, and re-queue the remaining user if necessary
    removeUser(socketId) {
        // Remove user from users and queue
        this.users = this.users.filter(user => user.socket.id !== socketId);
        this.queue = this.queue.filter(id => id !== socketId);
        // Handle the room removal and re-queue the remaining user
        const remainingUser = this.roomManager.removeRoomBySocketId(socketId);
        if (remainingUser) {
            this.queue.push(remainingUser.socket.id);
            remainingUser.socket.emit("lobby");
        }
        // Attempt to match users again
        this.clearQueue();
    }
    // Attempt to match users in the queue into rooms
    clearQueue() {
        console.log("Inside clearQueue. Current queue length:", this.queue.length);
        while (this.queue.length >= 2) {
            const id1 = this.queue.shift();
            const id2 = this.queue.shift();
            const user1 = this.users.find(user => user.socket.id === id1);
            const user2 = this.users.find(user => user.socket.id === id2);
            if (!user1 || !user2)
                continue;
            console.log("Creating room");
            this.roomManager.createRoom(user1, user2);
        }
    }
    // Set up event handlers for a user's socket
    initHandlers(socket) {
        socket.on("offer", ({ sdp, roomId }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        socket.on("answer", ({ sdp, roomId }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
        socket.on("disconnect", () => {
            this.removeUser(socket.id);
        });
    }
}
exports.UserManager = UserManager;
