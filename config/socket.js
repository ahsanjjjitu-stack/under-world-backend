const { Server } = require("socket.io");



let io;
const onlineUsers = new Map();


const initSocket = (server) => {

    io = new Server(server, {
        cors: { origin: "*" }
    });


    io.on("connection", (socket) => {

        console.log("A user connected: " + socket.id);


        socket.on("register_user", (userId) => {
            onlineUsers.set(userId.toString(), socket.id);
            console.log(`User registered for socket: ${userId} -> ${socket.id}`);
        });


        socket.on('disconnect', () => {
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User disconnected: ${userId}`);
                    break;
                }
            }
        });
    });


    return io;


}



const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
}


module.exports = { initSocket, getIO, onlineUsers };