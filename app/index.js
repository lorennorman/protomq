import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('body')


import { loadProtoFile } from './protobuf_service'
import { connect } from './mqtt_service'
// once page is loaded...
document.addEventListener("DOMContentLoaded", async () => {
  // load the proto files
  await loadProtoFile('/protobufs/signal.proto')
  // and connect to mqtt
  connect()
})



// const TOPIC_PARSERS = {
//   "*/wprsnpr/info/status": PB.CreateDescriptionRequest,
//   "*/info/status/device/complete": PB.RegistrationComplete,
//   "*/signals/device": PB.CreateSignalRequest,
//   "*/signals/device/i2c": PB.I2CResponse,
//   "*/signals/device/pinConfigComplete": PB.SignalResponse,
//   "*/signals/device/servo": PB.ServoResponse,
//   "*/signals/device/ds18x20": PB.Ds18x20Response,
//   "*/signals/device/pwm": PB.PWMResponse,
// }

// const parseMessageByTopic = (topic, message) => {
//   let parser

//   forEach(TOPIC_PARSERS, (currentParser, topicSpec) => {
//     if(parser) { return }

//     if(topicSpec.startsWith('*')) {
//       const topicEndFragment = topicSpec.slice(1)
//       if(topic.endsWith(topicEndFragment)) {
//         parser = currentParser
//       }

//     } else {
//       if(topic === topicSpec) {
//         parser = currentParser
//       }
//     }
//   })

//   if(!parser) {
//     try{
//       return JSON.parse(message)
//     } catch(err) { return message }
//   }

//   return (parser.deserializeBinary
//     ? parser.deserializeBinary(message).toObject()
//     : parser(message))
// }
