'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Minimize2, Send } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

type Message = {
  id: number
  text: string
  sender: 'user' | 'bot'
}

type ChatbotWidgetProps = {
  websiteId: string
}

function getDisplayText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  const parts = Array.isArray(content) ? content : [content]
  return parts
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }
      if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
        return part.text
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

export default function ChatbotWidget({ websiteId }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)

  const toggleChat = () => setIsOpen(!isOpen)
  const websocketBaseUrl = import.meta.env.VITE_WS_URL
   if (!websocketBaseUrl) {
     throw new Error('VITE_WS_URL is not configured')
   }
  useEffect(() => {
    // Initialize threadId from localStorage or generate a new one
    const storedThreadId = localStorage.getItem('threadId')
    if (storedThreadId) {
      setThreadId(storedThreadId)
    } else {
      const newThreadId = generateThreadId()
      setThreadId(newThreadId)
      localStorage.setItem('threadId', newThreadId)
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !threadId) {
      return
    }

    let reconnectTimeout: number | undefined
    let shouldReconnect = true

    const connectWebSocket = () => {
      // const newSocket = new WebSocket(
      //   `ws://127.0.0.1:8000/ws/${websiteId}/${threadId}`,
      // )
      const newSocket = new WebSocket(
     `${websocketBaseUrl.replace(/\/$/, '')}/ws/${websiteId}/${threadId}`,
   )
      socketRef.current = newSocket

      newSocket.onopen = () => {
        console.log('WebSocket connection established')
      }

      newSocket.onmessage = (event) => {
        console.log('Message from server: ', event.data)
        let data: unknown
        try {
          data = JSON.parse(event.data)
        } catch (error) {
          console.error('Invalid message from server:', error)
          return
        }
        if (!data || typeof data !== 'object' || !('type' in data)) {
          console.error('Invalid message from server:', data)
          return
        }

        const message = data as { type: unknown; content?: unknown }
        if (message.type === 'bot_response') {
          const text = getDisplayText(message.content)
          if (text) {
            setMessages((prev) => [...prev, { id: prev.length + 1, text, sender: 'bot' }])
          } else {
            console.error('Server response contained no displayable text:', message.content)
          }
          setIsTyping(false)
        } else if (message.type === 'tool_call') {
          const userApproval = confirm(`Approve this action?\n${getDisplayText(message.content)}`)
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({
              approval: userApproval ? 'yes' : 'no',
            }))
          }
        } else if (message.type === 'error') {
          const text = getDisplayText(message.content)
          console.error('Error from server:', message.content)
          setMessages((prev) => [...prev, {
            id: prev.length + 1,
            text: `Error: ${text || 'An unexpected error occurred.'}`,
            sender: 'bot',
          }])
          setIsTyping(false)
        }
      }

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason)
        if (socketRef.current === newSocket) {
          socketRef.current = null
        }
        if (event.code === 4001) {
          console.error('Invalid website ID')
        } else if (event.code === 4002) {
          console.error('Unauthorized origin')
        } else if (shouldReconnect && event.code !== 1000) {
          reconnectTimeout = window.setTimeout(connectWebSocket, 3000)
        }
      }

      newSocket.onerror = (error) => {
        console.error('WebSocket Error: ', error)
      }
    }

    connectWebSocket()
    return () => {
      shouldReconnect = false
      if (reconnectTimeout !== undefined) {
        window.clearTimeout(reconnectTimeout)
      }
      const activeSocket = socketRef.current
      socketRef.current = null
      if (activeSocket && activeSocket.readyState < WebSocket.CLOSING) {
        activeSocket.close(1000, 'Chat closed')
      }
    }
  }, [isOpen, threadId, websiteId])

  const generateThreadId = () => {
    return uuidv4();
  }

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const socket = socketRef.current
    if (
      inputMessage.trim() === ''
      || !socket
      || socket.readyState !== WebSocket.OPEN
    ) return

    const newMessage: Message = { id: messages.length + 1, text: inputMessage, sender: 'user' }
    setMessages([...messages, newMessage])
    setInputMessage('')
    setIsTyping(true)

    socket.send(JSON.stringify({
      content: inputMessage
    }))
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])


  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-xl w-80 sm:w-96 h-[70vh] max-h-[600px] flex flex-col"
          >
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-semibold">Realtor Chat</h2>
              <div className="flex space-x-2">
                <button onClick={toggleChat} className="p-1 hover:bg-blue-700 rounded">
                  <Minimize2 size={20} />
                </button>
                <button onClick={toggleChat} className="p-1 hover:bg-blue-700 rounded">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg break-words whitespace-pre-wrap ${message.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100'}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleChat}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
