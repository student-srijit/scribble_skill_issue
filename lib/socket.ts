interface GameStateResponse {
  success: boolean
  state?: any
}

class GameSocket {
  private listeners: Map<string, Function[]> = new Map()
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private roomCode: string | null = null
  private userId: string | null = null

  connect(roomCode: string, userId: string): Promise<void> {
    this.roomCode = roomCode
    this.userId = userId
    this.stopPolling()
    this.startPolling()
    return Promise.resolve()
  }

  private startPolling() {
    if (!this.roomCode || !this.userId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/socket?room=${this.roomCode}&user=${this.userId}`)
        const data = (await res.json()) as GameStateResponse
        if (data.state) {
          this.emit('state-sync', data.state)
        }
      } catch (error) {
        console.error('[v0] Polling error:', error)
      }
    }

    poll()
    this.pollInterval = setInterval(poll, 1000)
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  async send(type: string, data: any): Promise<void> {
    if (!this.roomCode || !this.userId) return
    try {
      const res = await fetch('/api/socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, roomCode: this.roomCode, userId: this.userId, data }),
      })

      const result = (await res.json()) as GameStateResponse
      if (result.state) {
        this.emit('state-sync', result.state)
      }
    } catch (error) {
      console.error('[v0] Send error:', error)
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter(cb => cb !== callback)
      )
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(callback => callback(data))
  }

  disconnect(): void {
    this.stopPolling()
    this.roomCode = null
    this.userId = null
  }
}

export const gameSocket = new GameSocket()
