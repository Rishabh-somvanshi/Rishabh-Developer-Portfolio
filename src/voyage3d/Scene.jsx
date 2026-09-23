import { Suspense, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import MotionContext from './MotionContext'
import CameraRig from './CameraRig'
import Starfield3D from './objects/Starfield3D'
import Nebula from './objects/Nebula'
import Worlds from './objects/Worlds'
import MeteorField from './objects/MeteorField'
import Supernova from './objects/Supernova'
import Pulsar from './objects/Pulsar'
import BlackHole from './objects/BlackHole'
import WarpStreaks from './objects/WarpStreaks'
import Earth from './objects/Earth'
import Effects from './quality/Effects'
import { SUN_DIR } from './camera/stations'
import { progress } from './store'

const SUN_POSITION = SUN_DIR.map((c) => c * 100)

/**
 * Compile every material once, while the reader is still on Launch, so no
 * planet hitches on arrival. Lives inside the same Suspense boundary as the
 * textured bodies (Worlds, Earth) and after them in tree order, so it only
 * runs once their textures have resolved and they've actually mounted.
 */
function Precompile() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        gl.compile(scene, camera)
      } catch {
        /* fall back to compiling lazily on first sight */
      }
      progress.compiled = true
    })
    return () => cancelAnimationFrame(id)
  }, [gl, scene, camera])
  return null
}

export default function Scene({ reduced }) {
  return (
    <MotionContext.Provider value={reduced}>
      <directionalLight position={SUN_POSITION} intensity={2.2} color="#fff1dc" />
      <ambientLight intensity={0.05} />
      <CameraRig reduced={reduced} />
      <Starfield3D />
      <Nebula />
      {/* Textured bodies only: stars/nebula/camera render immediately, planets
          suspend until their WebP textures resolve. Precompile sits after them
          so gl.compile() sees the real materials, not placeholders. */}
      <Suspense fallback={null}>
        <Worlds />
        <Earth />
        <Precompile />
      </Suspense>
      <MeteorField />
      <Supernova />
      <Pulsar />
      <BlackHole />
      {!reduced && <WarpStreaks />}
      <Effects />
    </MotionContext.Provider>
  )
}
