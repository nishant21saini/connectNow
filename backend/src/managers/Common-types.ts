import { Socket } from "socket.io";

export interface User {
    socket: Socket;
    name: string;
}

export interface Room {
    user1: User | null;
    user2: User | null;
}