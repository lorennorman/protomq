import { topicToMessageName } from './util'
import { decodeByName } from './protobuf_service'


export const parseMessage = ({ topic, message }) => {
  // assume message type from the topic it arrived on
  const protobufMessageName = topicToMessageName(topic)

  if(!protobufMessageName) {
    console.error(`Received message on unrecognized MQTT topic: "${topic}"`)
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
