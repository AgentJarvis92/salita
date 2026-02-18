/**
 * Generate Ate Maria 3D avatar model on-the-fly
 * Creates a procedural character with blend shapes
 * Runs once, caches to localStorage
 */

import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

export async function generateAteMariaModel(): Promise<ArrayBuffer> {
  const scene = new THREE.Scene()
  const group = new THREE.Group()
  scene.add(group)

  // ─── HEAD ─────────────────────────────────────────────────────────────

  const headGeom = new THREE.IcosahedronGeometry(0.5, 4)
  const headMesh = new THREE.Mesh(
    headGeom,
    new THREE.MeshPhongMaterial({
      color: 0xd4a574, // Warm skin tone
    })
  )
  headMesh.scale.set(1, 1.1, 0.95)
  headMesh.position.y = 0.8
  headMesh.name = 'Head'
  group.add(headMesh)

  // ─── NECK ─────────────────────────────────────────────────────────────

  const neckGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16)
  const neckMesh = new THREE.Mesh(
    neckGeom,
    new THREE.MeshPhongMaterial({ color: 0xd4a574 })
  )
  neckMesh.position.y = 0.35
  neckMesh.name = 'Neck'
  group.add(neckMesh)

  // ─── BODY ─────────────────────────────────────────────────────────────

  const bodyGeom = new THREE.BoxGeometry(0.6, 0.8, 0.4)
  const bodyMesh = new THREE.Mesh(
    bodyGeom,
    new THREE.MeshPhongMaterial({ color: 0x4a5f8f }) // Professional blue
  )
  bodyMesh.position.y = -0.2
  bodyMesh.name = 'Body'
  group.add(bodyMesh)

  // ─── EYES ─────────────────────────────────────────────────────────────

  const eyeGeom = new THREE.SphereGeometry(0.08, 16, 16)
  const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x2c1810 })

  const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial)
  leftEye.position.set(-0.15, 0.95, 0.35)
  leftEye.scale.set(1, 1.2, 0.8)
  leftEye.name = 'LeftEye'
  group.add(leftEye)

  const rightEye = new THREE.Mesh(eyeGeom, eyeMaterial.clone())
  rightEye.position.set(0.15, 0.95, 0.35)
  rightEye.scale.set(1, 1.2, 0.8)
  rightEye.name = 'RightEye'
  group.add(rightEye)

  // ─── MOUTH (with blend shapes) ────────────────────────────────────────

  const mouthGeom = new THREE.BoxGeometry(0.3, 0.1, 0.2, 4, 2, 2)
  const mouthMesh = new THREE.Mesh(
    mouthGeom,
    new THREE.MeshPhongMaterial({ color: 0xc97c5e })
  )
  mouthMesh.position.set(0, 0.5, 0.5)
  mouthMesh.name = 'Mouth'

  // Create blend shapes for phonemes
  const basePositions = mouthGeom.attributes.position.array as Float32Array

  const phonemes = [
    'A',
    'E',
    'I',
    'O',
    'U',
    'M',
    'F',
    'V',
    'TH',
    'L',
    'D',
    'T',
    'N',
    'G',
    'K',
    'S',
    'Z',
    'SH',
    'CH',
    'J',
    'R',
    'W',
    'Y',
  ]

  mouthGeom.morphAttributes.position = []

  for (const phoneme of phonemes) {
    const positions = new Float32Array(basePositions)

    // Apply phoneme-specific deformations
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]

      switch (phoneme) {
        case 'A': // Wide open
          positions[i + 1] = y * 2.0
          break
        case 'E': // Half open
          positions[i + 1] = y * 1.3
          break
        case 'I': // Narrow
          positions[i] = x * 0.6
          positions[i + 1] = y * 0.8
          break
        case 'O': // Round
          positions[i] = x * 0.7
          positions[i + 1] = y * 1.5
          break
        case 'U': // Pursed
          positions[i] = x * 0.4
          positions[i + 1] = y * 0.6
          break
        case 'M': // Closed
          positions[i + 1] = y * 0.3
          break
        case 'F':
        case 'V':
          positions[i + 1] = y * 1.1
          positions[i + 2] = z + 0.1
          break
        case 'S':
        case 'Z':
        case 'SH':
          positions[i] = x * 1.2
          positions[i + 1] = y * 0.5
          break
      }
    }

    mouthGeom.morphAttributes.position.push(
      new THREE.BufferAttribute(positions, 3)
    )
  }

  group.add(mouthMesh)

  // ─── LIGHTING ─────────────────────────────────────────────────────────

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 5, 5)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))

  // ─── EXPORT ───────────────────────────────────────────────────────────

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter()

    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result)
        } else {
          reject(new Error('Export failed'))
        }
      },
      (error) => {
        reject(error)
      },
      { binary: true }
    )
  })
}

/**
 * Load or generate Ate Maria model
 * Caches to IndexedDB for performance
 */
export async function getAteMariasModel(): Promise<ArrayBuffer> {
  const CACHE_KEY = 'ate-maria-model-v1'
  const DB_NAME = 'avatar-models'
  const STORE_NAME = 'models'

  // Try IndexedDB first
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = async () => {
      const db = request.result
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(CACHE_KEY)

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result as ArrayBuffer)
        } else {
          // Generate and cache
          generateAteMariaModel()
            .then(async (model) => {
              // Save to IndexedDB
              const db2 = request.result
              const writeTransaction = db2.transaction([STORE_NAME], 'readwrite')
              const writeStore = writeTransaction.objectStore(STORE_NAME)
              writeStore.put(model, CACHE_KEY)

              resolve(model)
            })
            .catch(reject)
        }
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}
