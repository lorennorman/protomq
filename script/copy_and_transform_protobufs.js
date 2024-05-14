import { homedir } from 'os'
import { copyFile, lstat, mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { pbjs } from "protobufjs-cli"


const loadEnv = async () => {
  // load the file
  let envJSON
  try {
    envJSON = (await readFile('./.env.json')).toString()
  } catch(e) {
    if(e.message.includes("ENOENT")) {
      throw new Error("Did not find environment file: `.env.json`. Look at README.md for instructions.")
    }

   throw e
  }

  // parse the json
  let env
  try {
    env = JSON.parse(envJSON)
  } catch(e) {
    throw new Error("Environment file `env.json` is not valid JSON.")
  }

  // check the var we want is present
  if(!env?.protobufSource) {
    throw new Error("Did not find 'protobufSource' attribute in file .env.json!")
  }

  return env
}

// wrap and call so we can use async/await
(async function() {
  console.log("Protobuf Import")

  console.log("Loading env.json...")
  const env = await loadEnv()

  const destination = "protobufs"
  console.log(`Cleaning destination: ${destination}`)

  // rm -rf protobufs && mkdir protobufs
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination)

  // import from where? look up location
  const
    protobufRoot = env.protobufSource,
    protobufRootExpanded = protobufRoot.replace('~', homedir())

  console.log(`Copying .proto files (recursively) from: ${protobufRootExpanded}`)

  const recursiveProtoCopy = async currentDirectory => {
    // list items in directory
    const items = await readdir(currentDirectory)

    for(const itemName of items) {
      const fullSourcePath = `${currentDirectory}/${itemName}`

      // skip nanopb
      if(itemName == "nanopb.proto") {
        // console.log("skip", itemName)

      // copy .proto files
      } else if(itemName.endsWith('.proto')) {
        // console.log("copy", itemName)
        const fullDestinationPath = `./${destination}/${itemName}`
        await copyFile(fullSourcePath, fullDestinationPath)

      // recurse into directories
      } else if((await lstat(fullSourcePath)).isDirectory()) {
        // console.log("recurse", itemName)
        await recursiveProtoCopy(fullSourcePath)

      // say what you're skipping
      } else {
        // console.log("skip", itemName)
      }
    }
  }

  await recursiveProtoCopy(protobufRootExpanded)

  console.log('Transforming .proto files...')

  // modifications to make to the proto files
  const replacements = [
    // no nanopb
    ['import "nanopb.proto";', '// nanopb import removed'],
    ['import "nanopb/nanopb.proto";', '// nanopb import removed'],
    // flatten import directories: "wippersnapper/file.proto" -> "file.proto"
    [/import "((?:\w*\/)+)\w*.proto";/g, (match, group) => match.replace(group, '')]
  ]

  // traverse the proto files in the destination
  for(const filename of await readdir(destination)) {
    const
      // build the full path
      filePath = `./${destination}/${filename}`,
      // read the file into memory
      contents = (await readFile(filePath)).toString(),
      // apply all replacements
      replacedContents = replacements.reduce((acc, replaceArgs) => {
        return acc.replaceAll(...replaceArgs)
      }, contents)

    // overwrite the file
    await writeFile(filePath, replacedContents)
  }

  console.log('Processing *.proto files to bundle.json')

  pbjs.main([ "--target", "json", "protobufs/signal.proto" ], async (err, output) => {
    if (err) { throw err }

    await writeFile('protobufs/bundle.json', output)
  })

  console.log('Done')
})()
