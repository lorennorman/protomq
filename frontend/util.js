import { find } from 'lodash-es'


export const TOPIC_MESSAGE_MAP = [
  [ /\/ws-b2d/, "BrokerToDevice" ],
  [ /\/ws-d2b/, "DeviceToBroker" ],
]

// V1 signal subtopics → [device→broker type, broker→device type].
// WARNING: this mirrors V1_SIGNAL_SUBTOPICS / resolveV1Topic in the backend
// protobufs.js — the frontend can't import that server module, so keep the two
// copies in sync if subtopics change. The pixels subtopic is "pixel" on the wire.
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

export const
  topicToMessageName = topic => {
    // V2: lookup envelope type by regex
    const [ , protoName ] = find(TOPIC_MESSAGE_MAP, ([ topicSpec, ]) =>
      topicSpec.test(topic)
    ) || []
    if(protoName) return protoName

    // V1: resolve by +/wprsnpr/# topic structure
    if(topic.includes('/wprsnpr/')) return resolveV1TopicName(topic)

    return protoName
  },

  // Resolve a V1 (+/wprsnpr/#) topic to the short proto type name expected on it.
  // Returns the short name (e.g. "CreateSignalRequest") or null if unrecognized.
  resolveV1TopicName = topic => {
    const marker = '/wprsnpr/'
    const at = topic.indexOf(marker)
    if(at === -1) return null
    const rest = topic.slice(at + marker.length)

    if(rest === 'info/status') return 'CreateDescriptionRequest'

    const segs = rest.split('/')
    const path = segs.slice(1).join('/')
    if(path === 'info/status/broker') return 'CreateDescriptionResponse'
    if(path === 'info/status/device/complete') return 'RegistrationComplete'
    // Device's pin-config-complete ACK. Firmware encodes a
    // SignalResponse{configuration_complete:true} (bytes 0x08 0x01) here.
    if(path === 'signals/device/pinConfigComplete') return 'SignalResponse'

    const sub = segs.slice(1) // drop uid
    if(sub[0] === 'signals' && (sub[1] === 'device' || sub[1] === 'broker')) {
      const pair = V1_SIGNAL_SUBTOPICS[sub[2] || '']
      if(!pair) return null
      return sub[1] === 'broker' ? pair[1] : pair[0]
    }

    return null
  },

  messageToTopic = message => {

  }
