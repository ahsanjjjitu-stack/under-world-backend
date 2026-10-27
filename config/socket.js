const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

let io;




const pubClient = new Redis(process.env.REDIS_URL, {
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    keepAlive: 30000
});
const subClient = pubClient.duplicate();





const appRedis = new Redis(process.env.REDIS_URL, {
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    keepAlive: 30000,
    retryStrategy(times) {
        return Math.min(times * 50, 2000);
    }
});



appRedis.on('connect', () => console.log('✅ App Redis Connected Successfully!'));
appRedis.on('error', (err) => console.error('❌ App Redis Error:', err.message));

pubClient.on('error', (err) => console.error('❌ Redis Pub Error:', err.message));
subClient.on('error', (err) => console.error('❌ Redis Sub Error:', err.message));




const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*" }
    });

    io.adapter(createAdapter(pubClient, subClient));
    console.log("🚀 Socket.io initialized with Redis Adapter!");

    io.on("connection", (socket) => {
        console.log("A user connected: " + socket.id);

        socket.on("register_user", async (userId) => {
            console.log("A user ID received: " + userId);
            try {
                if (!userId) {
                    console.log("❌ Received empty userId!");
                    return;
                }

                await appRedis.hset("online_users", userId.toString(), socket.id);
                console.log(`✅ User successfully registered in Redis: ${userId} -> ${socket.id}`);
            }
            catch (err) {
                console.error("❌ Error registering user in Redis:", err.message);
            }
        });



        socket.on('disconnect', async () => {
            console.log("A user disconnected: " + socket.id);
            try {
                const users = await appRedis.hgetall("online_users");
                for (let [userId, socketId] of Object.entries(users)) {
                    if (socketId === socket.id) {
                        await appRedis.hdel("online_users", userId);
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
};




const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};







const getSocketId = async (userId) => {
    try {
        const redisQuery = appRedis.hget("online_users", userId.toString());
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Redis operation timed out")), 3000)
        );

        return await Promise.race([redisQuery, timeout]);
    }
    catch (err) {
        console.error("⚠️ Redis getSocketId warning/timeout:", err.message);
        return null;
    }
}






module.exports = { initSocket, getIO, getSocketId };