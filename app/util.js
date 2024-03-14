import { find } from 'lodash-es'


const TOPIC_MESSAGE_MAP = [
  [ /^\w+\/ws-b2d\/io-wipper-\w+\/$/, "BrokerToDevice" ],
  [ /^\w+\/ws-d2b\/io-wipper-\w+\/$/, "DeviceToBroker" ],
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
