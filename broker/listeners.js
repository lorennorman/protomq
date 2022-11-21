
export const addLoggingListeners = broker => {
  console.log(`Adding Logging Listeners to Broker '${broker.id}'`)
  broker.on('client', onClient)
  broker.on('clientReady', onClientReady)
  broker.on('clientDisconnect', onClientDisconnect)
  broker.on('clientError', onClientError)
  broker.on('connectionError', onConnectionError)
  broker.on('keepaliveTimeout', onKeepaliveTimeout)
  broker.on('publish', onPublish)
  broker.on('ack', onAck)
  broker.on('ping', onPing)
  broker.on('subscribe', onSubscribe)
  broker.on('unsubscribe', onUnsubscribe)
  broker.on('connackSent', onConnackSent)
  broker.on('closed', onClosed)
}

const
  formatPacket = packet => (packet ? { topic: packet.topic, payload: packet.payload?.toString() } : 'packet unavailable'),
  onClient = client => console.log(`Client Connected: '${client.id}'`),
  onClientReady = client => console.log(`Client Ready: '${client.id}'`),
  onClientDisconnect = client => console.log(`Client Disconnected: '${client.id}'`),
  onClientError = (client, error) => console.log(`Error for client '${client.id}':`, error),
  onConnectionError = (client, error) => console.log(`Connection Error for client: '${client.id}'`, error),
  onKeepaliveTimeout = (client) => console.log(`Keepalive Timeout for client: '${client.id}'`),
  onPublish = (packet, client) => console.log(`Publish to Client: '${client?.id || 'internal'}', Packet:`, formatPacket(packet)),
  onAck = (packet, client) => console.log(`Ack from client: '${client.id}' for packet:`, formatPacket(packet)),
  onPing = (packet, client) => console.log(`Ping from client: '${client.id}'`, formatPacket(packet)),
  onSubscribe = (subscriptions, client) => console.log(`Subscriptions for client: '${client.id}'`, subscriptions),
  onUnsubscribe = (unsubscriptions, client) => console.log(`Unsubscriptions for client: '${client.id}'`, unsubscriptions),
  onConnackSent = (packet, client) => console.log(`ConnAck from client: '${client.id}'`, packet),
  onClosed = () => console.log("Broker closed.")
