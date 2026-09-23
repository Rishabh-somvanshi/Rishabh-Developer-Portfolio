import { useRef } from 'react'
import Planet3D from './Planet3D'
import Ring from './Ring'
import Moons from './Moons'
import { useLayout } from '../LayoutProvider'
import { useSceneVisibility } from '../useSceneVisibility'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { clamp01 } from '../interp'
import { BODIES } from '../camera/stations'
import { PALETTES, VAULT_SHIELD_AT } from '../../data/voyage'

function VisibleIn({ id, children }) {
  const ref = useRef()
  useSceneVisibility(ref, [id])
  return <group ref={ref}>{children}</group>
}

/** 3-D Secure / OTP "gates": one hex lattice sweep, pole to pole, on arrival. */
function vaultShield(material) {
  const v = sceneProgress(progress.windows, progress.p, 'vault')
  material.uniforms.uShield.value = clamp01((v - VAULT_SHIELD_AT) / 0.35)
}

export default function Worlds() {
  const { scales } = useLayout()
  return (
    <>
      {/* Curo — the living world: weather over the continents, a 60 bpm heartbeat in the aura. */}
      <VisibleIn id="curo">
        <Planet3D
          {...BODIES.curo}
          scale={scales.curo}
          palette={PALETTES.curo}
          spin={0.05}
          bandFreq={3}
          bandSpeed={0.02}
          aura={PALETTES.curo.aura}
          auraPulseHz={1}
          clouds
        />
      </VisibleIn>

      {/* Mercantile — the market world: fast bands, city lights, three award moons. */}
      <VisibleIn id="mercantile">
        <Planet3D
          {...BODIES.mercantile}
          scale={scales.mercantile}
          palette={PALETTES.mercantile}
          spin={0.04}
          bandFreq={14}
          bandSpeed={0.35}
          lights={PALETTES.mercantile.lights}
        >
          <Moons radius={BODIES.mercantile.radius} />
        </Planet3D>
      </VisibleIn>

      {/* Vault — the fortress world: faceted, seamed, shielded. */}
      <VisibleIn id="vault">
        <Planet3D
          {...BODIES.vault}
          scale={scales.vault}
          palette={PALETTES.vault}
          spin={0.03}
          flat
          seams
          bandFreq={4}
          bandSpeed={0}
          onFrame={vaultShield}
        >
          <Ring radius={BODIES.vault.radius} color={PALETTES.vault.ring} tilt={PALETTES.vault.ringTilt} />
        </Planet3D>
      </VisibleIn>

      {/* Porcelain — the beauty world: glazed ceramic, and the only world that holds still. */}
      <VisibleIn id="porcelain">
        <Planet3D
          {...BODIES.porcelain}
          scale={scales.porcelain}
          palette={PALETTES.porcelain}
          physical={{
            color: PALETTES.porcelain.top,
            roughness: 0.35,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
            iridescence: 0.3,
            iridescenceIOR: 1.3,
            sheen: 0.4,
            sheenColor: PALETTES.porcelain.band,
          }}
        >
          <Ring radius={BODIES.porcelain.radius} color={PALETTES.porcelain.ring} tilt={PALETTES.porcelain.ringTilt} />
        </Planet3D>
      </VisibleIn>
    </>
  )
}
