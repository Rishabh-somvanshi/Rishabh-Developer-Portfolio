import { Suspense, useMemo, useRef } from 'react'
import Planet3D from './Planet3D'
import Ring from './Ring'
import Moons from './Moons'
import Precompile from '../Precompile'
import { useLayout } from '../LayoutProvider'
import { useSceneVisibility } from '../useSceneVisibility'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { clamp01 } from '../interp'
import { BODIES } from '../camera/stations'
import { PALETTES, VAULT_SHIELD_AT, voyageTextures } from '../../data/voyage'
import { isCoarsePointer } from '../../journey/hooks'

/**
 * One world: visible only in its own scene, and suspended on its own textures —
 * so each planet appears as its files land, not when the slowest one does.
 * `onReady` fires once it has mounted and its shaders are compiled.
 */
function World({ id, onReady, children }) {
  const ref = useRef()
  useSceneVisibility(ref, [id])
  return (
    <Suspense fallback={null}>
      <group ref={ref}>{children}</group>
      <Precompile onDone={onReady} />
    </Suspense>
  )
}

/** 3-D Secure / OTP "gates": one hex lattice sweep, pole to pole, on arrival. */
function vaultShield(material) {
  const v = sceneProgress(progress.windows, progress.p, 'vault')
  material.uniforms.uShield.value = clamp01((v - VAULT_SHIELD_AT) / 0.35)
}

/** The four worlds. `onFirstReady` fires when Curo — the first one the reader meets — is ready. */
export default function Worlds({ onFirstReady }) {
  const { scales } = useLayout()
  const tex = useMemo(() => voyageTextures({ coarse: isCoarsePointer() }), [])
  return (
    <>
      {/* Curo — the living world: weather over the continents, a 60 bpm heartbeat in the aura. */}
      <World id="curo" onReady={onFirstReady}>
        <Planet3D
          {...BODIES.curo}
          scale={scales.curo}
          palette={PALETTES.curo}
          spin={0.05}
          map={tex.curo}
          tint="#6fa398"
          cloudMap={tex.clouds}
          aura={PALETTES.curo.aura}
          auraPulseHz={1}
        />
      </World>

      {/* Mercantile — the market world: city lights, three award moons. */}
      <World id="mercantile">
        <Planet3D
          {...BODIES.mercantile}
          scale={scales.mercantile}
          palette={PALETTES.mercantile}
          spin={0.04}
          map={tex.mercantile}
          lights={PALETTES.mercantile.lights}
        >
          <Moons radius={BODIES.mercantile.radius} map={tex.moon} />
        </Planet3D>
      </World>

      {/* Vault — the fortress world: seamed, shielded, ringed. */}
      <World id="vault">
        <Planet3D
          {...BODIES.vault}
          scale={scales.vault}
          palette={PALETTES.vault}
          spin={0.03}
          seams
          map={tex.vault}
          tint="#7c98a1"
          onFrame={vaultShield}
        >
          <Ring
            radius={BODIES.vault.radius}
            color={PALETTES.vault.ring}
            tilt={PALETTES.vault.ringTilt}
            map={tex.ring}
          />
        </Planet3D>
      </World>

      {/* Porcelain — the beauty world: glazed ceramic, and the only world that holds still. */}
      <World id="porcelain">
        <Planet3D
          {...BODIES.porcelain}
          scale={scales.porcelain}
          palette={PALETTES.porcelain}
          map={tex.porcelain}
          physical={{
            roughness: 0.5,
            clearcoat: 1,
            clearcoatRoughness: 0.25,
            iridescence: 0.3,
            iridescenceIOR: 1.3,
            sheen: 0.4,
            sheenColor: PALETTES.porcelain.band,
          }}
        >
          <Ring radius={BODIES.porcelain.radius} color={PALETTES.porcelain.ring} tilt={PALETTES.porcelain.ringTilt} />
        </Planet3D>
      </World>
    </>
  )
}
