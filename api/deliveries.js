import { compact, filter, find, forEach, keys, map, pick } from 'lodash-es'

import { BrokerToDevice, DeviceToBroker } from "../protobufs.js"


export default (router, broker) => {
  console.log("Installing Deliveries Tracker")

  // Install Route Handlers
  // begin tracking all message traffic to/from a client id
  router.post('/track_deliveries', addDeliveryTracker)
  // return all message traffic since track_deliveries to/from a client id
  router.post('/dump_deliveries', dumpDeliveryTracker)

  // Install Subscription Handler
  // Watch all message traffic for tracked deliveries
  broker.subscribe('#', sortDeliveries(broker))
}

const
  IGNORED_TOPICS_PREFIXES = [ "$SYS/", "state/clients" ],

  topicIsIgnored = topic =>
    find(IGNORED_TOPICS_PREFIXES, prefix => topic.startsWith(prefix)),

  deliveries = {},

  addDeliveryTracker = ({ protomq: { clientId }}, res) => {
    // check for existing mailbox for this client
    if(deliveries[clientId]) {
      console.error(`Deliveries already tracked for ${clientId}`)
      // error and clear the mailbox if already tracking this client
      res.json({ status: 'ERROR', message: `Mailbox already initialized for: ${clientId}, clearing it now.` })
      delete deliveries[clientId]
      return
    }

    // initialize a mailbox for it
    deliveries[clientId] = { inbox: [], outbox: [] }
    // install publish handlers for this client
    res.json({ status: "OK" })
  },

  // dumpDeliveryTracker = protomqApi((req, res, { clientId }) => {
  dumpDeliveryTracker = ({ protomq: { clientId }}, res) => {
    // look up mailbox for it and map to response
    const clientDeliveries = deliveries[clientId]
    // error if no mailbox found for client
    if(!clientDeliveries) {
      console.error(`Deliveries not tracked for ${clientId}`)
      res.json({ status: 'ERROR', message: `No mailbox initialized for: ${clientId}.` })
      return
    }
    // clear the mailbox
    delete deliveries[clientId]

    res.json({ status: "OK", deliveries: clientDeliveries })
  },

  sortDeliveries = broker => (packet, callback) => {
    const { topic, clientId } = packet

    if(topicIsIgnored(topic)) { return }

    const
      protobufPayload = topic.includes('/ws-d2b/')
        ? DeviceToBroker.decode(packet.payload)
        : topic.includes('/ws-b2d/')
        ? BrokerToDevice.decode(packet.payload)
        : payload,
      trackablePacket = { topic, payload: protobufPayload }

    // if the publishing client has an outbox, track it
    deliveries[clientId]?.outbox.push(trackablePacket)

    // find all tracked clients subscribed to this topic
    const
      trackedIds = keys(deliveries),
      trackedClients = compact(map(trackedIds, clientId => broker.clients[clientId])),
      hitClients = filter(trackedClients, client => find(keys(client.subscriptions), subTopic => subTopic === topic))

    // push it into their inboxes
    forEach(hitClients, client => deliveries[client.id].inbox.push(trackablePacket))
  }
