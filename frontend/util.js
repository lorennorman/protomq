import { find } from 'lodash-es'


const TOPIC_MESSAGE_MAP = [
  [ /\/ws-b2d\//, "BrokerToDevice" ],
  [ /\/ws-d2b\//, "DeviceToBroker" ],
]

export const
  topicToMessageName = topic => {
    // lookup protobuf type by regex
    const [ , protoName ] = find(TOPIC_MESSAGE_MAP, ([ topicSpec, ]) =>
      topicSpec.test(topic)
    ) || []

    return protoName
  },

  messageToTopic = message => {

  }
