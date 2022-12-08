import { find } from 'lodash-es'
import { decodeByName } from './protobuf_service'

const TOPIC_PARSERS = {
  "*/wprsnpr/info/status": "CreateDescriptionRequest",
  "*/info/status/device/complete": "RegistrationComplete",
  "*/signals/device": "CreateSignalRequest",
  "*/signals/device/i2c": "I2CResponse",
  "*/signals/device/pinConfigComplete": "SignalResponse",
  "*/signals/device/servo": "ServoResponse",
  "*/signals/device/ds18x20": "Ds18x20Response",
  "*/signals/device/pwm": "PWMResponse",
  "*/signals/device/pixel": "PixelResponse",
}

const parseMessageByTopic = (topic, message) => {
  const protoName = find(TOPIC_PARSERS, (item, topicSpec) => {
    return (topicSpec.startsWith('*') && topic.endsWith(topicSpec.slice(1)))
      || (topic === topicSpec)
  })

  if(!protoName) { return }

  // lookup protobuf type
  // deserialize message
  // return json
  return decodeByName(protoName, message)
}

export const parseMessage = ({ topic, message }) => {
  // check topic-based parsers
  const parsedMessage = parseMessageByTopic(topic, message)
  if(parsedMessage) { return parsedMessage }

  // try json
  try{
    return JSON.parse(message)
  } catch(err) {
    // return raw
    return message
  }
}
