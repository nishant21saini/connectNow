import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";
import { User } from "./Common-types";

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

  removeUser(socketId: string) {
    // Remove the user from the user list and queue
    this.users = this.users.filter((user) => user.socket.id !== socketId);
    this.queue = this.queue.filter((id) => id !== socketId);

    // Check if the user is in a room and remove them
    const roomData = this.roomManager.findRoomBySocketId(socketId);
    if (roomData) {
      const { roomId, room } = roomData;

      // Remove the user from the room
      const remainingUser = this.roomManager.removeUserFromRoom(
        roomId,
        socketId
      );

      // Re-enqueue the remaining user in the room, if any
      if (remainingUser) {
        this.users.push(remainingUser);
        this.queue.push(remainingUser.socket.id);
        this.clearQueue();
      }
    }
  }

  clearQueue() {
    while (this.queue.length >= 2) {
        const id1 = this.queue.shift();
        const id2 = this.queue.shift();

        if (!id1 || !id2) continue;

        const user1 = this.users.find((user) => user.socket.id === id1);
        const user2 = this.users.find((user) => user.socket.id === id2);

        if (!user1 || !user2) continue;

        this.roomManager.createRoom(user1, user2);
        
        // Remove users from the users array
        this.users = this.users.filter(user => 
            user.socket.id !== id1 && user.socket.id !== id2
        );
    }
}

  initHandlers(socket: Socket) {
    // Handle SDP offer
    socket.on("offer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
      this.roomManager.onOffer(roomId, sdp, socket.id);
    });

    // Handle SDP answer
    socket.on(
      "answer",
      ({
        sdp,
        roomId,
        username,
      }: {
        sdp: string;
        roomId: string;
        username: string;
      }) => {
        this.roomManager.onAnswer(roomId, sdp, socket.id, username);
      }
    );

    // Handle ICE candidate exchange
    socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
      this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
    });

    // Handle end-call event
    socket.on("end-call", ({ roomId }) => {
      const room = this.roomManager.rooms.get(roomId);
      if (!room) return;
  
      const user1 = room.user1;
      const user2 = room.user2;
  
      // Notify the other user
      const socketId = socket.id;
      if (user1?.socket.id === socketId) {
          user2?.socket.emit("call-ended");
      } else if (user2?.socket.id === socketId) {
          user1?.socket.emit("call-ended");
      }
  
      // Remove the room
      this.roomManager.removeRoom(roomId);
  
      // Re-add both users if they're not already present
      [user1, user2].forEach(user => {
          if (user && !this.users.some(u => u.socket.id === user.socket.id)) {
              this.users.push(user);
              this.queue.push(user.socket.id);
          }
      });
  
      this.clearQueue();
  });

    // Handle disconnect event
    socket.on("disconnect", () => {
      this.removeUser(socket.id);
    });
  }
}
