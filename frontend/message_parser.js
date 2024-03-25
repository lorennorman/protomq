import { some } from 'lodash-es'

import { topicToMessageName } from './util'
import { decodeByName } from './protobuf_service'


const SYSTEM_TOPIC_PREFIXES = ["#", "$SYS/", "state/clients"]

export const parseMessage = ({ topic, message }) => {
  // assume message type from the topic it arrived on
  const protobufMessageName = topicToMessageName(topic)

  if(!protobufMessageName) {
    // warn if it's not one of the system topics
    if(!some(SYSTEM_TOPIC_PREFIXES, prefix => topic.startsWith(prefix))) {
      console.error(`Received message on unrecognized MQTT topic: "${topic}"`)
    }

    return tryJSONParse(message)
  }

  return decodeByName(protobufMessageName, message)
}

const tryJSONParse = message => {
  try{
    return JSON.parse(message)
  } catch(err) {
    return message
  }
}
