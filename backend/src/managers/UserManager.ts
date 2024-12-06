
// import { Socket } from "socket.io";
// import { RoomManager } from "./RoomManager";

// export interface User {
//     socket: Socket;
//     name: string;
// }

// export class UserManager {
//     private users: User[];
//     private queue: string[];
//     private roomManager: RoomManager;

//     constructor() {
//         this.users = [];
//         this.queue = [];
//         this.roomManager = new RoomManager();
//     }

//     // Add a new user to the system and try to match them
//     addUser(name: string, socket: Socket) {
//         this.users.push({ name, socket });
//         this.queue.push(socket.id);
//         socket.emit("lobby");
//         this.clearQueue();
//         this.initHandlers(socket);
//     }

//     // Remove a user, manage their room, and re-queue the remaining user if necessary
//     removeUser(socketId: string) {
//         // Remove user from users and queue
//         this.users = this.users.filter(user => user.socket.id !== socketId);
//         this.queue = this.queue.filter(id => id !== socketId);

//         // Handle the room removal and re-queue the remaining user
//         const remainingUser = this.roomManager.removeRoomBySocketId(socketId);
//         if (remainingUser) {
//             this.queue.push(remainingUser.socket.id);
//             remainingUser.socket.emit("lobby");
//         }

//         // Attempt to match users again
//         this.clearQueue();
//     }

//     // Attempt to match users in the queue into rooms
//     clearQueue() {
//         console.log("Inside clearQueue. Current queue length:", this.queue.length);
//         while (this.queue.length >= 2) {
//             const id1 = this.queue.shift();
//             const id2 = this.queue.shift();

//             const user1 = this.users.find(user => user.socket.id === id1);
//             const user2 = this.users.find(user => user.socket.id === id2);

//             if (!user1 || !user2) continue;

//             console.log("Creating room");
//             this.roomManager.createRoom(user1, user2);
//         }
//     }

//     // Set up event handlers for a user's socket
//     initHandlers(socket: Socket) {
//         socket.on("offer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
//             this.roomManager.onOffer(roomId, sdp, socket.id);
//         });

//         socket.on("answer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
//             this.roomManager.onAnswer(roomId, sdp, socket.id);
//         });

//         socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
//             this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
//         });

//         socket.on("disconnect", () => {
//             this.removeUser(socket.id);
//         });
//     }
// }

// import { Socket } from "socket.io";
// import { RoomManager } from "./RoomManager";

// export interface User {
//     socket: Socket;
//     name: string;
// }

// export class UserManager {
//     private users: User[];
//     private queue: string[];
//     private roomManager: RoomManager;

//     constructor() {
//         this.users = [];
//         this.queue = [];
//         this.roomManager = new RoomManager();
//     }

//     addUser(name: string, socket: Socket) {
//         this.users.push({ name, socket });
//         this.queue.push(socket.id);
//         socket.emit("lobby");
//         this.clearQueue();
//         this.initHandlers(socket);
//     }

//     removeUser(socketId: string) {
//         this.users = this.users.filter((user) => user.socket.id !== socketId);
//         this.queue = this.queue.filter((id) => id !== socketId);

//         const roomData = this.roomManager.findRoomBySocketId(socketId);
//         if (roomData) {
//             const { roomId, room } = roomData;
//             const remainingUser =
//                 room.user1?.socket.id === socketId ? room.user2 : room.user1;

//             if (remainingUser) {
//                 // Add the remaining user to the queue temporarily
//                 this.queue.push(remainingUser.socket.id);
//                 this.clearQueue(); // Try matching again for the room
//             }
//         }

//         this.clearQueue();
//     }

//     clearQueue() {
//         console.log("Inside clearQueue. Current queue length:", this.queue.length);

//         // Check for users waiting in rooms
//         for (const [roomId, room] of this.roomManager.rooms.entries()) {
//             if (room.user1 && !room.user2 && this.queue.length > 0) {
//                 const newUserId = this.queue.shift();
//                 const newUser = this.users.find((user) => user.socket.id === newUserId);
//                 if (newUser) {
//                     console.log(`Matching new user to room ${roomId}`);
//                     this.roomManager.replaceUserInRoom(roomId, room.user1.socket.id, newUser);
//                 }
//             } else if (room.user2 && !room.user1 && this.queue.length > 0) {
//                 const newUserId = this.queue.shift();
//                 const newUser = this.users.find((user) => user.socket.id === newUserId);
//                 if (newUser) {
//                     console.log(`Matching new user to room ${roomId}`);
//                     this.roomManager.replaceUserInRoom(roomId, room.user2.socket.id, newUser);
//                 }
//             }
//         }

//         // Create new rooms for users in the queue
//         while (this.queue.length >= 2) {
//             const id1 = this.queue.shift();
//             const id2 = this.queue.shift();

//             const user1 = this.users.find((user) => user.socket.id === id1);
//             const user2 = this.users.find((user) => user.socket.id === id2);

//             if (!user1 || !user2) continue;

//             console.log("Creating new room");
//             this.roomManager.createRoom(user1, user2);
//         }
//     }

//     initHandlers(socket: Socket) {
//         socket.on("offer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
//             this.roomManager.onOffer(roomId, sdp, socket.id);
//         });

//         socket.on("answer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
//             this.roomManager.onAnswer(roomId, sdp, socket.id);
//         });

//         socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
//             this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
//         });

//         socket.on("end-call", () => {
//             const roomData = this.roomManager.findRoomBySocketId(socket.id);
//             if (roomData) {
//                 const { roomId, room } = roomData;
//                 const remainingUser =
//                     room.user1?.socket.id === socket.id ? room.user2 : room.user1;

//                 // Remove the user and requeue the remaining user
//                 this.roomManager.removeUserFromRoom(roomId,socket.id);
//                 //const leavingUser = room.user1?.socket.id === socket.id ? room.user1 : room.user2;
//                 this.queue.push(socket.id);
//                 if (remainingUser) {
//                     this.queue.push(remainingUser.socket.id);
//                     this.clearQueue();
//                 }
//             }
//         });
        

//         socket.on("disconnect", () => {
//             this.removeUser(socket.id);
//         });
//     }
// }



import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;

    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket) {
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {
        this.users = this.users.filter((user) => user.socket.id !== socketId);
        this.queue = this.queue.filter((id) => id !== socketId);

        const roomData = this.roomManager.findRoomBySocketId(socketId);
        if (roomData) {
            const { roomId, room } = roomData;
            const remainingUser =
                room.user1?.socket.id === socketId ? room.user2 : room.user1;

            this.roomManager.removeUserFromRoom(roomId, socketId);

            if (remainingUser) {
                this.queue.push(remainingUser.socket.id);
                this.clearQueue();
            }
        }
    }

    clearQueue() {
        while (this.queue.length >= 2) {
            const id1 = this.queue.shift();
            const id2 = this.queue.shift();

            const user1 = this.users.find((user) => user.socket.id === id1);
            const user2 = this.users.find((user) => user.socket.id === id2);

            if (!user1 || !user2) continue;

            this.roomManager.createRoom(user1, user2);
        }
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });

        socket.on("end-call", () => {
            const roomData = this.roomManager.findRoomBySocketId(socket.id);
            if (roomData) {
                const { roomId, room } = roomData;
                const remainingUser =
                    room.user1?.socket.id === socket.id ? room.user2 : room.user1;

                this.roomManager.removeUserFromRoom(roomId, socket.id);

                if (remainingUser) {
                    this.queue.push(remainingUser.socket.id);
                    this.clearQueue();
                }
            }
        });

        socket.on("disconnect", () => {
            this.removeUser(socket.id);
        });
    }
}
