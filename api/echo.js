import { BrokerToDevice } from "../protobufs.js"

export default (router, broker) => {
  console.log("Installing Echo Command")

  // Send a requested protobuf over a requested topic
  router.post('/echo', (req, res) => {
    const { topic, payload } = req.body

    broker.publish({ topic, payload: Buffer.from(payload, 'latin1') })

    res.json({ status: "OK" })

    // console.log(`Echo:\n  topic: "${topic}\n  message: ${message}`)
  })
}

const pbNameToFieldName = pbName => {
  return "digitalioAdd"
}
