import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useSettings } from './SettingsContext'
import { DEMO_MODE } from '../constants'

const ConnectionContext = createContext(null)

export function ConnectionProvider({ children }) {
  const { backendUrl } = useSettings()
  const [backendOnline, setBackendOnline] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef(null)

  const checkHealth = useCallback(async () => {
    if (DEMO_MODE) { setBackendOnline(false); return }
    try {
      const res = await fetch(`${backendUrl}/api/health`, { signal: AbortSignal.timeout(3000) })
      setBackendOnline(res.ok)
    } catch {
      setBackendOnline(false)
    }
  }, [backendUrl])

  // Poll health every 10s
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [checkHealth])

  // Socket.io connection
  useEffect(() => {
    if (DEMO_MODE || !backendOnline) return

    const socket = io(backendUrl, { transports: ['websocket', 'polling'], reconnectionAttempts: 5 })
    socketRef.current = socket

    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('connect_error', () => setSocketConnected(false))

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [backendUrl, backendOnline])

  return (
    <ConnectionContext.Provider value={{ backendOnline, socketConnected, socket: socketRef.current, checkHealth }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const ctx = useContext(ConnectionContext)
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider')
  return ctx
}
