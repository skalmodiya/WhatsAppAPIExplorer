import { useEffect, useRef } from 'react'
import { useConnection } from '../contexts/ConnectionContext'

export function useSocket(event, handler) {
  const { socket } = useConnection()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!socket) return
    const fn = (...args) => handlerRef.current(...args)
    socket.on(event, fn)
    return () => socket.off(event, fn)
  }, [socket, event])
}
