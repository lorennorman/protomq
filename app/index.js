import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('body')


import { loadStoreData } from './stores/data_loader'
import { loadProtoFile } from './protobuf_service'
import { connect } from './mqtt_service'

// fix an xhr error after the first load
navigator.serviceWorker.register('fetch_headers_service_worker.js')
  .then(registration => {
    console.log('Service worker registered with scope: ', registration.scope)
  })
  .catch(err => {
    console.log('ServiceWorker registration failed: ', err);
  })

// once page is loaded...
document.addEventListener("DOMContentLoaded", async () => {
  await loadStoreData()
  // load the proto files
  await loadProtoFile('/protobufs/signal.proto')
  // and connect to mqtt
  connect()
})
