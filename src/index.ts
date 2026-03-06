dotenv.config()
import cors from 'cors'
import express from 'express'
import http from 'http'
import { attachWebSocketServer } from './ws/server.js'
import dotenv from 'dotenv'
import { matchsRouter } from './routes/matches.js'
import { securityMiddleware } from './arcjet.js'

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json())
app.use(securityMiddleware())

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente'
  })
})

app.use('/matches', matchsRouter)

const { broadcastMatchCreated } = attachWebSocketServer(server)
app.locals.broadcastMatchCreated = broadcastMatchCreated

server.listen(PORT, HOST, () => {
  const serverUrl =
    HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
  console.log(`Servidor ejecutándose en: ${serverUrl}`)
  console.log(
    `WebSocket server activo en: ${serverUrl.replace('http', 'ws')}/ws`
  )
})
