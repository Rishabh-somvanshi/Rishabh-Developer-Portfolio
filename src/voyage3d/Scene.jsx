import { Suspense } from 'react'
import MotionContext from './MotionContext'
import CameraRig from './CameraRig'
import Precompile from './Precompile'
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

const SUN_POSITION = SUN_DIR.map((c) => c * 100)

export default function Scene({ reduced, onReady }) {
  return (
    <MotionContext.Provider value={reduced}>
      <directionalLight position={SUN_POSITION} intensity={2.2} color="#fff1dc" />
      <ambientLight intensity={0.05} />
      <CameraRig reduced={reduced} />
      <Starfield3D />
      <Nebula />
      {/* Everything without a texture compiles straight away. */}
      <Precompile />
      {/* Textured bodies each suspend on their own files (see Worlds), so the
          first planet appears as soon as its texture lands instead of waiting
          for Earth's — and the stars, nebula and camera never wait at all. */}
      <Worlds onFirstReady={onReady} />
      <Suspense fallback={null}>
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
