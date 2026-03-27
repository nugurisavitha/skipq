const socketIO = require('socket.io');

/**
 * Initialize Socket.IO for real-time features
 * @param {http.Server} server - Express server instance
 * @returns {socketIO.Server} Socket.IO instance
 */
const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? true
        : (process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store connected users
  const connectedUsers = new Map();

  /**
   * Handle socket connections
   */
  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    /**
     * User joins with their userId
     * Emitted by: Client when user logs in
     */
    socket.on('user_join', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    /**
     * Customer joins order tracking room
     * Emitted by: Customer to receive order updates
     */
    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
    });

    /**
     * Restaurant joins order room
     * Emitted by: Restaurant to receive new orders
     */
    socket.on('join_restaurant_room', (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`Socket ${socket.id} joined restaurant room: restaurant_${restaurantId}`);
    });

    /**
     * Delivery person joins their delivery room
     * Emitted by: Delivery person to receive assigned orders
     */
    socket.on('join_delivery_room', (deliveryPersonId) => {
      socket.join(`delivery_${deliveryPersonId}`);
      console.log(`Socket ${socket.id} joined delivery room: delivery_${deliveryPersonId}`);
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error: ${error}`);
    });
  });

  /**
   * Helper to emit order status update to specific order room
   */
  io.emitOrderUpdate = (orderId, status, data) => {
    io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId,
      status,
      ...data,
      timestamp: new Date(),
    });
  };

  /**
   * Helper to emit new order notification to restaurant
   */
  io.emitNewOrder = (restaurantId, orderData) => {
    io.to(`restaurant_${restaurantId}`).emit('new_order', {
      ...orderData,
      timestamp: new Date(),
    });
  };

  /**
   * Helper to emit order assignment to delivery person
   */
  io.emitOrderAssignment = (deliveryPersonId, orderData) => {
    io.to(`delivery_${deliveryPersonId}`).emit('order_assigned', {
      ...orderData,
      timestamp: new Date(),
    });
  };

  /**
   * Helper to get connected user socket ID
   */
  io.getSocketId = (userId) => connectedUsers.get(userId);

  return io;
};

module.exports = initializeSocket;
