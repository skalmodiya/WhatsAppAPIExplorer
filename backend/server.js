require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path')

const db = require('./db/database')
const { initSocket } = require('./socket/socketManager')
const routes = require('./routes/index')

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

initSocket(io)
db.init()
app.use('/', routes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`WhatsApp API Explorer backend running on http://localhost:${PORT}`)
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`)
})
