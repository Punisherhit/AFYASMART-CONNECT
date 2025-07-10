const socketio = require('socket.io');
const Notification = require('../models/Notification');

let io = null;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Join user-specific room
    socket.on('join', async (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
      
      // Send pending notifications
      const notifications = await Notification.find({
        recipient: userId,
        isRead: false
      });
      
      notifications.forEach(notification => {
        socket.emit('notification:new', {
          id: notification._id,
          message: notification.message,
          type: notification.type,
          data: notification.data
        });
      });
    });
    
    // Mark notification as read
    socket.on('notification:read', async (notificationId) => {
      await Notification.findByIdAndUpdate(notificationId, {
        isRead: true
      });
    });
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

exports.getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};