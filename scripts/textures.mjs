#!/usr/bin/env node
/**
 * Converts the Solar System Scope source images (D:\Portfolio\.textures-src,
 * gitignored) into the WebP textures the voyage's photo-real planets ship
 * from public/textures/. Run after dropping/refreshing sources:
 *
 *   npm run textures
 *
 * Source: https://www.solarsystemscope.com/textures/ (CC BY 4.0). See
 * public/textures/CREDITS.md for per-file attribution.
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, '.textures-src')
const outDir = join(root, 'public', 'textures')

const JOBS = [
  { src: '2k_jupiter.jpg', out: 'jupiter.webp', width: 2048, height: 1024, quality: 80 },
  { src: '2k_neptune.jpg', out: 'neptune.webp', width: 2048, height: 1024, quality: 80 },
  { src: '2k_venus_atmosphere.jpg', out: 'venus.webp', width: 2048, height: 1024, quality: 80 },
  { src: '2k_earth_daymap.jpg', out: 'earth_day.webp', width: 2048, height: 1024, quality: 80 },
  { src: '2k_earth_nightmap.jpg', out: 'earth_night.webp', width: 2048, height: 1024, quality: 80 },
  { src: '2k_mercury.jpg', out: 'mercury.webp', width: 1024, height: 512, quality: 78 },
  { src: '2k_moon.jpg', out: 'moon.webp', width: 1024, height: 512, quality: 78 },
  { src: '2k_earth_clouds.jpg', out: 'earth_clouds.webp', width: 2048, height: 1024, quality: 70, greyscale: true },
  { src: '2k_saturn_ring_alpha.png', out: 'saturn_ring.webp', width: 1024, height: 64, lossless: true, alpha: true },
]

if (!existsSync(srcDir)) {
  console.error(`Missing ${srcDir} — drop the Solar System Scope source images there first.`)
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

let total = 0
let missing = false
for (const job of JOBS) {
  const inPath = join(srcDir, job.src)
  const outPath = join(outDir, job.out)
  if (!existsSync(inPath)) {
    console.error(`  SKIP: missing source ${inPath}`)
    missing = true
    continue
  }
  let pipeline = sharp(inPath).resize(job.width, job.height, { fit: 'fill' })
  if (job.greyscale) pipeline = pipeline.greyscale()
  pipeline = pipeline.webp({
    quality: job.quality ?? 80,
    lossless: !!job.lossless,
    alphaQuality: job.alpha ? 100 : undefined,
  })
  await pipeline.toFile(outPath)
  const bytes = statSync(outPath).size
  total += bytes
  console.log(`  ${job.out.padEnd(20)} ${job.width}x${job.height}  ${(bytes / 1024).toFixed(1)} KB`)
}

console.log(`\nTotal: ${(total / 1024).toFixed(1)} KB (${(total / 1024 / 1024).toFixed(2)} MB)`)
if (missing) process.exit(1)
