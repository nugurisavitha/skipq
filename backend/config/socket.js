const socketIO = require('socket.io');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: (process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000').split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  return io;
};

module.exports = initializeSocket;