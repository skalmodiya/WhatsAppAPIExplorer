import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useConnection } from './ConnectionContext'

const WhatsAppContext = createContext(null)

export function WhatsAppProvider({ children }) {
  const { backendOnline } = useConnection()
  const [messages, setMessages] = useState([])
  const [baileysQr, setBaileysQr] = useState(null)
  const [baileysConnected, setBaileysConnected] = useState(false)
  const [baileysPhoneNumber, setBaileysPhoneNumber] = useState(null)
  const { socket } = useConnection()

  useEffect(() => {
    if (!socket) return

    const onMessage = (msg) => {
      setMessages(prev => [msg, ...prev].slice(0, 500))
    }
    const onQr = (qr) => { setBaileysQr(qr); setBaileysConnected(false) }
    const onConnected = ({ phoneNumber }) => { setBaileysConnected(true); setBaileysPhoneNumber(phoneNumber); setBaileysQr(null) }
    const onDisconnected = () => { setBaileysConnected(false); setBaileysPhoneNumber(null) }

    socket.on('wa:message', onMessage)
    socket.on('baileys:qr', onQr)
    socket.on('baileys:connected', onConnected)
    socket.on('baileys:disconnected', onDisconnected)

    return () => {
      socket.off('wa:message', onMessage)
      socket.off('baileys:qr', onQr)
      socket.off('baileys:connected', onConnected)
      socket.off('baileys:disconnected', onDisconnected)
    }
  }, [socket])

  useEffect(() => {
    if (!backendOnline) { setBaileysConnected(false); setBaileysQr(null) }
  }, [backendOnline])

  return (
    <WhatsAppContext.Provider value={{ messages, baileysQr, baileysConnected, baileysPhoneNumber, clearMessages: () => setMessages([]) }}>
      {children}
    </WhatsAppContext.Provider>
  )
}

export function useWhatsApp() {
  const ctx = useContext(WhatsAppContext)
  if (!ctx) throw new Error('useWhatsApp must be used within WhatsAppProvider')
  return ctx
}
