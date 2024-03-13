// intercept fetches
self.addEventListener('fetch', function(event) {
  event.respondWith(
    overrideContentTypeForProtos(event.request)
  )
})

const overrideContentTypeForProtos = async request => {
  // ignore all non proto files
  if(!request.url.endsWith('.proto')) { return fetch(request) }

  // do the fetch and grab the response
  const response = await(fetch(request))

  // extract all the headers
  const headers = {};
  for (let entry of response.headers.entries()) {
    headers[entry[0]] = entry[1];
  }
  // add the header we care about
  headers['content-type'] = "application/vnd.google.protobuf"

  // reconstruct a clone of the response with our header added
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(headers)
  })

  // return it
  return newResponse
}
