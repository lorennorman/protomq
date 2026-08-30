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


// Parse a nanopb .options file into structured entries.
// Returns an array of { fqn, options } where fqn is the fully-qualified name
// and options is an object like { max_size: "32", submsg_callback: "true" }
const parseOptionsFile = (contents) => {
  const entries = []
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim()
    // skip comments and blank lines
    if (!line || line.startsWith('#')) continue

    // format: "ws.display.Add.driver  max_size:32" (whitespace-separated, may have spaces around colon)
    const match = line.match(/^(\S+)\s+(.+)$/)
    if (!match) continue

    const fqn = match[1]
    const optionPairs = match[2].trim()
    const options = {}

    // parse key:value pairs — handles both "key:value" and "key: value" (space after colon)
    const pairRegex = /(\w+)\s*:\s*(\S+)/g
    let pairMatch
    while ((pairMatch = pairRegex.exec(optionPairs)) !== null) {
      const key = pairMatch[1]
      let value = pairMatch[2]
      // coerce numeric values to numbers, booleans to booleans
      if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (/^\d+$/.test(value)) value = Number(value)
      options[key] = value
    }

    if (Object.keys(options).length > 0) {
      entries.push({ fqn, options })
    }
  }
  return entries
}


// Convert snake_case to camelCase (pbjs converts proto field names to camelCase in JSON output)
const snakeToCamel = (str) =>
  str.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase())


// Walk the nested bundle JSON to find a field or message by its fully-qualified name,
// then attach options. Returns true if successfully applied.
const applyOptionToBundle = (bundle, fqn, options) => {
  // Split fqn into parts, e.g. "ws.display.Add.driver" -> ["ws", "display", "Add", "driver"]
  const parts = fqn.split('.')

  // Try to resolve as a field first (all parts except last are namespace/message path)
  const resolveField = () => {
    let current = bundle
    for (let i = 0; i < parts.length - 1; i++) {
      if (current.nested?.[parts[i]]) {
        current = current.nested[parts[i]]
      } else {
        return null
      }
    }
    // current should be a message with "fields"
    // try both snake_case (original) and camelCase (pbjs converts to this)
    const rawFieldName = parts[parts.length - 1]
    const camelFieldName = snakeToCamel(rawFieldName)

    if (current.fields?.[rawFieldName]) {
      return current.fields[rawFieldName]
    }
    if (current.fields?.[camelFieldName]) {
      return current.fields[camelFieldName]
    }
    return null
  }

  // Try to resolve as a message (all parts are namespace/message path)
  const resolveMessage = () => {
    let current = bundle
    for (let i = 0; i < parts.length; i++) {
      if (current.nested?.[parts[i]]) {
        current = current.nested[parts[i]]
      } else {
        return null
      }
    }
    return current
  }

  const field = resolveField()
  if (field) {
    field.options = { ...field.options, ...options }
    return true
  }

  const message = resolveMessage()
  if (message) {
    message.options = { ...message.options, ...options }
    return true
  }

  return false
}


// Recursively copy .proto and .options files from source to destination,
// flattening the directory structure (all files end up in one directory).
const recursiveProtoCopy = async (currentDirectory, destination) => {
  const items = await readdir(currentDirectory)

  for (const itemName of items) {
    const fullSourcePath = `${currentDirectory}/${itemName}`

    // skip nanopb
    if (itemName == "nanopb.proto") {
      // skip

    // copy .proto and .options files
    } else if (itemName.endsWith('.proto') || itemName.endsWith('.options')) {
      const fullDestinationPath = `./${destination}/${itemName}`
      await copyFile(fullSourcePath, fullDestinationPath)

    // recurse into directories
    } else if ((await lstat(fullSourcePath)).isDirectory()) {
      await recursiveProtoCopy(fullSourcePath, destination)
    }
  }
}


// Transform .proto files in a directory by applying replacement rules
const transformProtos = async (destination, replacements) => {
  for (const filename of await readdir(destination)) {
    if (!filename.endsWith('.proto')) continue

    const filePath = `./${destination}/${filename}`
    const contents = (await readFile(filePath)).toString()
    const replacedContents = replacements.reduce((acc, replaceArgs) => {
      return acc.replaceAll(...replaceArgs)
    }, contents)

    await writeFile(filePath, replacedContents)
  }
}


// Compile protos to JSON bundle and merge .options metadata
const compileAndMerge = async (protoDir, entryPoint, outputPath) => {
  console.log(`Compiling ${protoDir}/${entryPoint} to ${outputPath}`)

  return new Promise((resolve, reject) => {
    pbjs.main(["--target", "json", `${protoDir}/${entryPoint}`], async (err, output) => {
      if (err) { reject(err); return }

      const bundle = JSON.parse(output)

      // Parse .options files and merge nanopb metadata into the bundle
      console.log('Merging .options metadata into bundle...')
      const allFiles = await readdir(protoDir)
      const optionsFiles = allFiles.filter(f => f.endsWith('.options'))

      let appliedCount = 0
      let skippedCount = 0

      for (const optionsFile of optionsFiles) {
        const contents = (await readFile(`./${protoDir}/${optionsFile}`)).toString()
        const entries = parseOptionsFile(contents)

        for (const { fqn, options } of entries) {
          if (applyOptionToBundle(bundle, fqn, options)) {
            appliedCount++
          } else {
            console.warn(`  Could not resolve: ${fqn} (from ${optionsFile})`)
            skippedCount++
          }
        }
      }

      console.log(`  Applied ${appliedCount} option(s), ${skippedCount} unresolved`)

      await writeFile(outputPath, JSON.stringify(bundle, null, 2))
      resolve()
    })
  })
}


// Standard replacements for all proto files
const standardReplacements = [
  // no nanopb
  ['import "nanopb.proto";', '// nanopb import removed'],
  ['import "nanopb/nanopb.proto";', '// nanopb import removed'],
  // flatten import directories: "wippersnapper/file.proto" -> "file.proto"
  [/import "((?:\w*\/)+)\w*.proto";/g, (match, group) => match.replace(group, '')]
]

// Additional replacements for V1 protos (which have inline nanopb annotations)
const v1ExtraReplacements = [
  // strip nanopb message options: option (nanopb_msgopt).submsg_callback = true;
  [/\s*option\s*\(nanopb_msgopt\)[^;]*;\s*/g, '\n'],
  // strip nanopb field annotations after other options: , (nanopb).type = FT_IGNORE
  [/,\s*\(nanopb\)\.\w+\s*=\s*\w+/g, ''],
  // strip standalone nanopb field options: [(nanopb).type = FT_IGNORE]
  [/\s*\[\s*\(nanopb\)[^\]]*\]/g, ''],
]


// wrap and call so we can use async/await
;(async function() {
  console.log("Protobuf Import")

  console.log("Loading env.json...")
  const env = await loadEnv()

  // ============================================================
  // V2 Proto Import (primary, from protobufSource in .env.json)
  // ============================================================
  const destination = "protobufs"
  console.log(`\n--- V2 Proto Import ---`)
  console.log(`Cleaning destination: ${destination}`)

  await rm(destination, { recursive: true, force: true })
  await mkdir(destination)

  const protobufRootExpanded = env.protobufSource.replace('~', homedir())
  console.log(`Copying .proto and .options files from: ${protobufRootExpanded}`)

  await recursiveProtoCopy(protobufRootExpanded, destination)

  console.log('Transforming V2 .proto files...')
  await transformProtos(destination, standardReplacements)

  await compileAndMerge(destination, 'signal.proto', `${destination}/bundle.json`)

  // ============================================================
  // V1 Proto Import (optional, from protobufSourceV1 in .env.json)
  // ============================================================
  if (env.protobufSourceV1) {
    const destinationV1 = "protobufs-v1"
    console.log(`\n--- V1 Proto Import ---`)
    console.log(`Cleaning destination: ${destinationV1}`)

    await rm(destinationV1, { recursive: true, force: true })
    await mkdir(destinationV1)

    const protobufRootV1 = env.protobufSourceV1.replace('~', homedir())
    console.log(`Copying V1 .proto and .options files from: ${protobufRootV1}`)

    await recursiveProtoCopy(protobufRootV1, destinationV1)

    console.log('Transforming V1 .proto files...')
    await transformProtos(destinationV1, [...standardReplacements, ...v1ExtraReplacements])

    // Find the V1 signal entry point
    const v1Files = await readdir(destinationV1)
    const v1Signal = v1Files.find(f => f === 'signal.proto')
    if (v1Signal) {
      await compileAndMerge(destinationV1, 'signal.proto', `${destinationV1}/bundle.json`)
    } else {
      console.warn('V1 signal.proto not found, skipping V1 bundle compilation')
    }
  } else {
    console.log('\nNo protobufSourceV1 in .env.json, skipping V1 proto import')
  }

  console.log('\nDone')
})()
