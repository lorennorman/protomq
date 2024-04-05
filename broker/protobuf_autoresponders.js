/**
  Specify protobufs to listen for and respond with
*/
import { find } from 'lodash-es'
import { BrokerToDevice, DeviceToBroker } from "../protobufs.js"


const requestToResponseMap = {
  checkinRequest: {
    checkinResponse: {
      response: 'RESPONSE_OK',
      totalGpioPins: 20,
      totalAnalogPins: 4,
      referenceVoltage: 2.5,
      totalI2cPorts: 1
    }
  }
}

export const
  addDefaultPBResponses = broker => {
    broker.subscribe(
      '+/ws-d2b/#',
      (packet, callback) => {
        const d2bRequest = DeviceToBroker.decode(packet.payload)
        console.log('DELIVERY', packet.topic, d2bRequest)

        // find the key in the r/r map
        const responsePayload = find(requestToResponseMap, (response, requestKey) => d2bRequest[requestKey])

        if(responsePayload) {
          const b2dResponse = BrokerToDevice.encode(responsePayload).finish()

          broker.publish({
            topic: packet.topic.replace('d2b', 'b2d'),
            payload: b2dResponse
          })
        }

        callback()
      },
      () => console.log('!!!subscribed!!!'))
  }
