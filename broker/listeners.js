
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
  onClient = client => console.log(`connected (${client.id})`),
  onClientReady = client => console.log(`ready (${client.id})`),
  onClientDisconnect = client => console.log(`disconnected (${client.id})`),
  onClientError = (client, error) => console.log(`error (${client.id}):`, error),
  onConnectionError = (client, error) => console.log(`connection error (${client.id}):`, error),
  onKeepaliveTimeout = (client) => console.log(`keepalive timeout (${client.id})`),
  onPublish = (packet, client) => console.log(`publish (${client?.id || 'internal'}):`, formatPacket(packet)),
  onAck = (packet, client) => console.log(`ack (${client.id}):`, formatPacket(packet)),
  onPing = (packet, client) => console.log(`ping (${client.id}):`, formatPacket(packet)),
  onSubscribe = (subscriptions, client) => console.log(`subscriptions (${client.id})`, subscriptions),
  onUnsubscribe = (unsubscriptions, client) => console.log(`unsubscriptions (${client.id}):`, unsubscriptions),
  onConnackSent = (packet, client) => console.log(`connack (${client.id}):`, packet),
  onClosed = () => console.log("Broker closed.")
