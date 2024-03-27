// make some magic usernames, passwords, and client ids that always
// generate the same responses for testing purposes

const
  VALID_USER = "io_user",
  INVALID_USER = "invalid_io_user",
  VALID_KEY = "io_key",
  INVALID_KEY = "invalid_io_key",
  VALID_CLIENT_ID = "io_client_id",
  INVALID_CLIENT_ID = "invalid"

export const
  addDefaultAuthResponses = broker => {
    broker.authenticate = (client, username, password, callback) => {
      password = password?.toString()
      console.log("authenticate:", username, password, client.id)

      // user and key failures are the same
      if(username === INVALID_USER || password === INVALID_KEY) {
        const failure = new Error('invalid username and password')
        failure.returnCode = 4
        return callback(failure, null)
      }

      if(client.id.includes(INVALID_CLIENT_ID)) {
        const failure = new Error('invalid client id')
        failure.returnCode = 2
        return callback(failure, null)
      }

      callback(null, true)
    }
  }
