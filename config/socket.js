const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");



let io;




const pubClient = new Redis( process.env.REDIS_URL, {
   tls: {
        rejectUnauthorized: false
    },
    maxRetriesPerRequest: null
});



const subClient = pubClient.duplicate();



pubClient.on('error', (err) => console.error('Redis Pub Error:', err.message));
subClient.on('error', (err) => console.error('Redis Sub Error:', err.message));


const initSocket = (server) => {

    io = new Server(server, {
        cors: { origin: "*" }
    });


    io.adapter(createAdapter(pubClient, subClient));


    console.log("🚀 Socket.io initialized with Redis Adapter!");


    io.on("connection", (socket) => {

        console.log("A user connected: " + socket.id);


        socket.on("register_user", async (userId) => {
            
            try {
                await pubClient.hset("online_users", userId.toString(), socket.id);
                console.log(`User registered in Redis: ${userId} -> ${socket.id}`);
            }
            catch (err) {
                console.error("Error registering user in Redis:", err);
            }
           
        });




        socket.on('disconnect', async () => {

              console.log("A user disconnected: " + socket.id);
       
            try {
                const users = await pubClient.hgetall("online_users");
                for (let [userId, socketId] of Object.entries(users)) {
                    if (socketId === socket.id) {
                        await pubClient.hdel("online_users", userId);
                        console.log(`User disconnected and removed from Redis: ${userId}`);
                        break;
                    }
                }
            }
            catch (err) {
                console.error("Error on disconnect in Redis:", err);
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






const getSocketId = async (userId) => {
    try {
        return await pubClient.hget("online_users", userId.toString());
    }
    catch (err) {
        console.error("Error getting socket ID from Redis:", err);
        return null;
    }
}


module.exports = { initSocket, getIO, getSocketId };