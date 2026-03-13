// AEGIS — Socket.io Server
// Real-time event streaming to dashboard

let connectedClients = 0;

function initSocketServer(io) {
  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`[AEGIS Socket] Client connected: ${socket.id} (total: ${connectedClients})`);

    socket.emit('connection:confirmed', {
      message: 'Connected to AEGIS real-time stream',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Join exam room
    socket.on('join:exam', (examId) => {
      socket.join(`exam:${examId}`);
      console.log(`[AEGIS Socket] ${socket.id} joined exam:${examId}`);
    });

    // Join student room for focused monitoring
    socket.on('join:student', (studentId) => {
      socket.join(`student:${studentId}`);
    });

    // Proctor ping/pong for latency check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      connectedClients--;
      console.log(`[AEGIS Socket] Client disconnected: ${socket.id} (total: ${connectedClients})`);
    });

    socket.on('error', (err) => {
      console.error('[AEGIS Socket] Error:', err);
    });
  });

  console.log('[AEGIS] Socket.io server initialized');
}

module.exports = { initSocketServer };
