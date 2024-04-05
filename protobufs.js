import protobuf from "protobufjs"
import protobufJSON from "./protobufs/bundle.json" assert { type: "json" }


const protobufRoot = protobuf.Root.fromJSON(protobufJSON)

export default protobufRoot

export const
  BrokerToDevice = protobufRoot.lookupType("signal.BrokerToDevice"),
  DeviceToBroker = protobufRoot.lookupType("signal.DeviceToBroker")
