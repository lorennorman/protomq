/**
  Specify protobufs to listen for and respond with
*/
import { find, keys, camelCase } from 'lodash-es'
import { BrokerToDevice, DeviceToBroker } from "../protobufs.js"


const requestToResponseMap = {
  checkinRequest: {
    checkinResponse: {
      response: 'RESPONSE_OK',
      totalGpioPins: 20,
      totalAnalogPins: 4,
      referenceVoltage: 2.5
    }
  }
}

const defaultMessages = {
  digitalioAdd: {
    pinName: 'd0',
    gpioDirection: 'DIGITAL_IO_DIRECTION_INPUT',
    sampleMode: 'DIGITAL_IO_SAMPLE_MODE_TIMER',
    period: 5,
    value: false
  }
}

export const
  addDefaultPBResponses = broker => {
    console.log("PBResponse Listener: Register")
    broker.subscribe(
      '+/ws-d2b/+/',
      (packet, callback) => {
        const d2bRequest = DeviceToBroker.decode(packet.payload)

        // find the key in the re/res map
        const responsePayload = find(requestToResponseMap, (response, requestKey) =>
          d2bRequest[requestKey]
        )

        if(responsePayload) {
          console.log(`Auto-Responding to:\n  ${JSON.stringify(d2bRequest, null, 2)}\nwith:\n  ${JSON.stringify(responsePayload, null, 2)}`)
          const b2dResponse = BrokerToDevice.encode(responsePayload).finish()

          broker.publish({
            topic: packet.topic.replace('d2b', 'b2d'),
            payload: b2dResponse
          })
        } else {
          console.log(`Not Auto-Responding to:\n  ${JSON.stringify(d2bRequest, null, 2)}`)
        }

        callback()
      },
      () => console.log('Protobuf autoresponders installed')
    )
  },

  addEchoService = broker => {
    console.log("PBEcho Listener: Register")
    broker.subscribe(
      '+/ws-d2b/+/echo',
      (packet, callback) => {
        const
          payload = JSON.parse(packet.payload),
          messageName = camelCase(keys(payload)[0])
        console.log("Echo request:", messageName, payload)

        const foundDefaults = find(defaultMessages, (settings, name) => {
          return name == messageName
        })

        if(!foundDefaults) {
          console.log("No message found with name:", messageName)
        } else {
          console.log("found:", foundDefaults)
          const b2dResponse = BrokerToDevice.encode({ [messageName]: foundDefaults }).finish()
          const topic = packet.topic.replace('d2b', 'b2d').replace('/echo', '/')
          console.log("publishing echo!", topic)
          broker.publish({
            topic,
            payload: b2dResponse
          })
        }

        callback()
      },
      () => console.log('Protobuf echo service installed')
    )
  }
