import fs from 'fs/promises'
import { fileURLToPath } from 'node:url'
import archiver from 'archiver'
import { url, log, newVersion, pkgName } from './utils.mjs'

const entryDir = url('../extension/')
const outputDir = url('../dist/')
// Derived from package.json rather than hardcoded, so a rename of the
// project does not silently ship a zip named after the upstream one.
const extName = `${pkgName}-${newVersion}.zip`

try {
  await fs.access(entryDir)
  await fs.access(outputDir).catch(() => fs.mkdir(outputDir))

  const fh = await fs.open(url(extName, outputDir), 'w+')
  const output = fh.createWriteStream()

  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  archive.on('error', log.red)
  output.on('close', () =>
    log.green(
      `📦[output]: ${outputDir + extName} [${archive.pointer()} bytes]`,
    ),
  )

  archive.pipe(output)
  // Use fileURLToPath here, not the URL's pathname property. On Windows
  // that property yields "/C:/path/to/extension/", and the leading slash
  // before the drive letter makes it an invalid path. archiver then finds
  // no files and silently writes a 22 byte archive, which is a valid but
  // completely empty zip. fileURLToPath returns a real platform path.
  archive.directory(fileURLToPath(entryDir), false)
  await archive.finalize()

  // Guard against ever publishing an empty archive again.
  const { size } = await fs.stat(url(extName, outputDir))
  if (size < 1024) {
    log.red(`Archive is only ${size} bytes, so it is empty.`)
    log.red(`Check that extension/ exists and contains a build.`)
    process.exit(1)
  }
} catch (err) {
  log.red(err)
  process.exit(1)
}
