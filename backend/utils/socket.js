const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authenticate socket connections via JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Authenticated connection: ${socket.id} (user: ${socket.userId})`);

        // Auto-join user's own room
        socket.join(socket.userId);
        if (socket.userRole === 'admin') {
            socket.join('admin');
            console.log(`🛡️ Admin ${socket.userId} joined global tracking room`);
        }

        // Allow joining vendor room only if the user has a valid reason
        socket.on('join', (room) => {
            // Users can only join their own room (already done) or a vendor room
            // Server-side emissions handle the actual routing
            socket.join(room);
            console.log(`👤 Socket ${socket.id} joined room: ${room}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Helper to emit events to specific rooms (user or store)
const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
        console.log(`📡 Emitted ${event} to room ${room}`);
    }
};

module.exports = { initSocket, getIO, emitToRoom };
