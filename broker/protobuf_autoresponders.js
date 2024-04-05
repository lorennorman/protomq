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
    console.log("PBResponse Listener: Register")
    broker.subscribe(
      '+/ws-d2b/#',
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
        }

        callback()
      },
      () => console.log('Protobuf autoresponders installed')
    )
  }
