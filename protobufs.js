import protobuf from "protobufjs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import protobufJSON from "./protobufs/bundle.json" with { type: "json" }
import protobufV1JSON from "./protobufs-v1/bundle.json" with { type: "json" }

const __dirname = dirname(fileURLToPath(import.meta.url))

// ============================================================================
// V2 (primary) — single nested signal envelope per direction
// ============================================================================
const protobufRoot = protobuf.Root.fromJSON(protobufJSON)

export default protobufRoot

export const
  BrokerToDevice = protobufRoot.lookupType("signal.BrokerToDevice"),
  DeviceToBroker = protobufRoot.lookupType("signal.DeviceToBroker")

// ============================================================================
// V1 (legacy) — no single envelope; one message type per MQTT subtopic.
// ============================================================================
export const protobufRootV1 = protobuf.Root.fromJSON(protobufV1JSON)

// The V1 bundle is compiled from signal.proto, which never imports
// description.proto — so the checkin messages (CreateDescription*) are absent
// from bundle.json. Load that one proto into the same root at runtime. The
// file in protobufs-v1/ has already been transformed (nanopb stripped, imports
// flattened) by `npm run import-protos`, so it loads cleanly on its own.
protobufRootV1.loadSync(join(__dirname, "protobufs-v1", "description.proto"))

// V1 signal subtopics: each maps to a {device→broker, broker→device} pair of
// message types under wippersnapper.signal.v1. The suffix is the trailing
// topic segment after signals/{device|broker} ('' = the bare main signal topic).
// NOTE: the pixels subtopic is spelled "pixel" (singular) on the wire.
const V1_SIGNAL_SUBTOPICS = {
  '':        ['SignalResponse',  'CreateSignalRequest'],
  i2c:       ['I2CResponse',     'I2CRequest'],
  ds18x20:   ['Ds18x20Response', 'Ds18x20Request'],
  servo:     ['ServoResponse',   'ServoRequest'],
  pwm:       ['PWMResponse',     'PWMRequest'],
  pixel:     ['PixelsResponse',  'PixelsRequest'],
  uart:      ['UARTResponse',    'UARTRequest'],
  display:   ['DisplayResponse', 'DisplayRequest'],
}

const lookupV1 = (name) => {
  try { return protobufRootV1.lookupType(name) } catch { return null }
}

// Resolve a V1 MQTT topic to its message type + direction.
// Returns { name, type, direction: 'd2b'|'b2d', isCheckinRequest } or null.
// Direction is inferred purely from topic shape (the user's chosen routing):
//   {user}/wprsnpr/info/status                     → CreateDescriptionRequest  (d2b, checkin)
//   {user}/wprsnpr/{uid}/info/status/broker        → CreateDescriptionResponse (b2d)
//   {user}/wprsnpr/{uid}/info/status/device/complete → RegistrationComplete    (d2b)
//   {user}/wprsnpr/{uid}/signals/device[/<sub>]    → <sub> response            (d2b)
//   {user}/wprsnpr/{uid}/signals/broker[/<sub>]    → <sub> request             (b2d)
export const resolveV1Topic = (topic) => {
  const marker = '/wprsnpr/'
  const at = topic.indexOf(marker)
  if (at === -1) return null
  const rest = topic.slice(at + marker.length)

  // Checkin request is the one topic with no device-uid segment.
  if (rest === 'info/status') {
    const name = 'wippersnapper.description.v1.CreateDescriptionRequest'
    return { name, type: lookupV1(name), direction: 'd2b', isCheckinRequest: true }
  }

  // Everything else is {uid}/<path...>
  const segs = rest.split('/')
  const path = segs.slice(1).join('/')

  if (path === 'info/status/broker') {
    const name = 'wippersnapper.description.v1.CreateDescriptionResponse'
    return { name, type: lookupV1(name), direction: 'b2d' }
  }
  if (path === 'info/status/device/complete') {
    const name = 'wippersnapper.description.v1.RegistrationComplete'
    return { name, type: lookupV1(name), direction: 'd2b' }
  }
  // Device's ACK that it finished the hardware (pin) config workflow.
  // NOTE: the firmware builds a SignalResponse{configuration_complete:true} but
  // encodes it with the RegistrationComplete descriptor — a quirk that's
  // harmless here since both are a single bool at field 1 (wire bytes 0x08 0x01).
  if (path === 'signals/device/pinConfigComplete') {
    const name = 'wippersnapper.signal.v1.SignalResponse'
    return { name, type: lookupV1(name), direction: 'd2b' }
  }

  const sub = segs.slice(1) // drop uid: ['signals', 'device'|'broker', <suffix?>]
  if (sub[0] === 'signals' && (sub[1] === 'device' || sub[1] === 'broker')) {
    const suffix = sub[2] || ''
    const pair = V1_SIGNAL_SUBTOPICS[suffix]
    if (!pair) return null
    const [d2bType, b2dType] = pair
    const broker = sub[1] === 'broker'
    const name = `wippersnapper.signal.v1.${broker ? b2dType : d2bType}`
    return { name, type: lookupV1(name), direction: broker ? 'b2d' : 'd2b' }
  }

  return null
}

// Unified topic-shape decode used by the loggers/auditors. Picks the protocol
// version from the topic (ws-b2d/ws-d2b → v2, wprsnpr → v1) and returns
// { version, name, direction, message, type } or null if it can't decode.
export const decodeByTopic = (topic, payload) => {
  try {
    if (topic.includes('/ws-b2d/'))
      return { version: 'v2', name: 'BrokerToDevice', direction: 'b2d', type: BrokerToDevice, message: BrokerToDevice.decode(payload) }
    if (topic.includes('/ws-d2b/'))
      return { version: 'v2', name: 'DeviceToBroker', direction: 'd2b', type: DeviceToBroker, message: DeviceToBroker.decode(payload) }
    if (topic.includes('/wprsnpr/')) {
      const r = resolveV1Topic(topic)
      if (r?.type)
        return { version: 'v1', name: r.name, direction: r.direction, type: r.type, message: r.type.decode(payload) }
    }
  } catch { /* not a protobuf topic, or decode failed */ }
  return null
}
