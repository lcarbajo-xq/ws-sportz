import 'dotenv/config'
import http from 'http'
import cors from 'cors'
import express from 'express'
import { pool } from '../db/db.js'
import { liveMatchSimulator } from './live-simulator.js'
import { attachWebSocketServer } from '../ws/server.js'
import { matchsRouter } from '../routes/matches.js'
import { commentaryRouter } from '../routes/commentary.js'

function toNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const config = {
  tickMs: toNumber(process.env.SIM_TICK_MS, 3000),
  createMatchProbability: toNumber(
    process.env.SIM_CREATE_MATCH_PROBABILITY,
    0.3
  ),
  scoreUpdateProbability: toNumber(
    process.env.SIM_SCORE_UPDATE_PROBABILITY,
    0.4
  ),
  maxLiveMatches: Math.max(1, toNumber(process.env.SIM_MAX_LIVE_MATCHES, 6))
}

const port = toNumber(process.env.SIM_WS_PORT, 3005)
const host = process.env.SIM_WS_HOST || '0.0.0.0'

const app = express()
app.use(cors())
app.use(express.json())
app.get('/', (_req, res) =>
  res.json({ ok: true, mode: 'simulator-standalone' })
)
app.use('/matches', matchsRouter)
app.use('/matches/:matchId/commentary', commentaryRouter)

const server = http.createServer(app)

const {
  broadcastMatchCreated,
  broadcastMatchCommentary,
  broadcastScoreUpdated
} = attachWebSocketServer(server)

app.locals.broadcastMatchCreated = broadcastMatchCreated
app.locals.broadcastMatchCommentary = broadcastMatchCommentary
app.locals.broadcastScoreUpdated = broadcastScoreUpdated

server.listen(port, host, () => {
  const url =
    host === '0.0.0.0' ? `http://localhost:${port}` : `http://${host}:${port}`
  console.log(`[simulator-runner] HTTP/WS listening on ${url}`)
  console.log(`[simulator-runner] WS endpoint ${url.replace('http', 'ws')}/ws`)
  liveMatchSimulator.start(config, {
    broadcastMatchCreated,
    broadcastMatchCommentary,
    broadcastScoreUpdated
  })
  console.log('[simulator-runner] running in standalone mode')
})

async function shutdown(signal: string) {
  console.log(`[simulator-runner] received ${signal}, shutting down...`)
  liveMatchSimulator.stop()
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
  await pool.end()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
