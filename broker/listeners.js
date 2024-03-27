import { map } from 'lodash-es'

// CONSTANTS
const EVENT_NAMES = [
  'client',
  'clientReady',
  'clientDisconnect',
  'clientError',
  'connectionError',
  'keepaliveTimeout',
  'publish',
  'ack',
  'ping',
  'subscribe',
  'unsubscribe',
  'connackSent',
  'closed'
]

// HELPERS
const
  formatPacket = packet => (packet
    ? { topic: packet.topic, payload: packet.payload?.toString() }
    : 'packet unavailable'
  ),
  addListeners = (broker, listeners, options={}) => {
    const handledEvents = Object.keys(listeners)

    handledEvents.forEach(eventName => {
      const eventHandler = listeners[eventName]
      if(options.curryBroker) {
        const boundHandler = eventHandler.bind(eventHandler, broker)
        broker.on(eventName, boundHandler)
      } else {
        broker.on(eventName, eventHandler)
      }
    })
  }

// GROUPS OF HANDLERS
const
  LOGGING = {
    client: client => console.log(`connected (${client.id})`),
    clientReady: client => console.log(`ready (${client.id})`),
    clientDisconnect: client => console.log(`disconnected (${client.id})`),
    clientError: (client, error) => console.log(`error (${client.id}):`, error),
    connectionError: (client, error) => console.log(`connection error (${client.id}):`, error),
    // keepaliveTimeout: (client) => console.log(`keepalive timeout (${client.id})`),
    publish: (packet, client) => client?.id && console.log(`publish (${client.id}):`, formatPacket(packet)),
    // ack: (packet, client) => console.log(`ack (${client.id}):`, formatPacket(packet)),
    // ping: (packet, client) => console.log(`ping (${client.id}):`, formatPacket(packet)),
    subscribe: (subscriptions, client) => console.log(`subscriptions (${client.id})`, map(subscriptions, "topic")),
    unsubscribe: (unsubscriptions, client) => console.log(`unsubscriptions (${client.id}):`, map(unsubscriptions, "topic")),
    // connackSent: (packet, client) => console.log(`connack (${client.id}):`, packet),
    closed: () => console.log("Broker closed."),
  },

  // publish state update whenever clients or subscriptions change
  emitState = (broker) => {
    // get all clients from broker
    // transform clients to data
    const clients = map(broker.clients, ({ id, subscriptions }) => {
      return { id, subscriptions: Object.keys(subscriptions) }
    })
    // publish client data on magic topic
    broker.publish({ topic: "state/clients", payload: JSON.stringify(clients) })
  },
  REACTIVE_EMITTERS = {
    client: emitState,
    clientDisconnect: emitState,
    subscribe: emitState,
    unsubscribe: emitState,
  }

export const
  addLoggingListeners = broker => {
    console.log(`Adding Logging Listeners to Broker '${broker.id}'`)
    addListeners(broker, LOGGING)
  },

  addReactiveEmitters = broker => {
    console.log(`Adding Reactive State-Change Emitter Listeners to Broker '${broker.id}'`)
    addListeners(broker, REACTIVE_EMITTERS, { curryBroker: true })
  }
