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
