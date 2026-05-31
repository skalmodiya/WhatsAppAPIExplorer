let io

function initSocket(socketIo) {
  io = socketIo

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
  })
}

function getIo() {
  return io
}

module.exports = { initSocket, getIo }
