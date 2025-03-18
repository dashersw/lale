import * as THREE from 'three'

export let floorTexture
export let wallTexture
export let doorTexture
export let specialFloorTexture
export let ceilingTexture

// New displacement maps
export let floorDisplacementMap
export let ceilingDisplacementMap
export let wallDisplacementMap
export let doorDisplacementMap

// Load all textures from external files
export function loadAllTextures() {
  console.log('Loading all textures from external files...')

  // Create promises for all textures
  const texturePromises = [
    // Main floor - stone texture
    loadExternalTexture('/textures/stone.jpeg').then(texture => {
      floorTexture = texture
      floorTexture.repeat.set(2, 2) // Repeat texture for more detail
      console.log('Floor texture loaded: stone.jpeg')
    }),

    // Floor displacement map
    loadExternalTexture('/textures/stone.disp.jpeg').then(texture => {
      floorDisplacementMap = texture
      floorDisplacementMap.repeat.set(2, 2) // Match main texture
      console.log('Floor displacement map loaded: stone.disp.jpeg')
    }),

    // Walls - brick texture
    loadExternalTexture('/textures/brick.jpeg').then(texture => {
      wallTexture = texture
      console.log('Wall texture loaded: brick.jpeg')
    }),

    // Wall displacement map
    loadExternalTexture('/textures/brick.disp.jpeg').then(texture => {
      wallDisplacementMap = texture
      console.log('Wall displacement map loaded: brick.disp.jpeg')
    }),

    // Ceiling - concrete texture
    loadExternalTexture('/textures/concrete.jpeg').then(texture => {
      ceilingTexture = texture
      console.log('Ceiling texture loaded: concrete.jpeg')
    }),

    // Ceiling displacement map
    loadExternalTexture('/textures/concrete.disp.jpeg').then(texture => {
      ceilingDisplacementMap = texture
      console.log('Ceiling displacement map loaded: concrete.disp.jpeg')
    }),

    // Doors - rubble texture
    loadExternalTexture('/textures/rubble.jpeg').then(texture => {
      doorTexture = texture
      console.log('Door texture loaded: rubble.jpeg')
    }),

    // Door displacement map
    loadExternalTexture('/textures/rubble.disp.jpeg').then(texture => {
      doorDisplacementMap = texture
      console.log('Door displacement map loaded: rubble.disp.jpeg')
    }),

    // Special floors - sand texture
    loadExternalTexture('/textures/sand.jpeg').then(texture => {
      specialFloorTexture = texture
      console.log('Special floor texture loaded: sand.jpeg')
    })
  ]

  // Return a promise that resolves when all textures are loaded
  return Promise.all(texturePromises)
    .then(() => {
      // Verify all textures were loaded successfully
      if (!floorTexture || !wallTexture || !doorTexture || !specialFloorTexture || !ceilingTexture) {
        throw new Error('Failed to load one or more textures')
      }

      // Apply appropriate texture settings
      floorTexture.repeat.set(1, 1)
      wallTexture.repeat.set(1, 1)
      doorTexture.repeat.set(1, 1)
      specialFloorTexture.repeat.set(1, 1)
      ceilingTexture.repeat.set(2, 2)

      console.log('All textures loaded successfully')
      return true
    })
    .catch(error => {
      console.error('Error loading textures:', error)
      throw error
    })
}

// Function to load an external texture
function loadExternalTexture(path) {
  console.log(`Loading external texture from: ${path}`)
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      path,
      texture => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        console.log(`Successfully loaded texture: ${path}`)
        resolve(texture)
      },
      undefined,
      error => {
        console.error(`Failed to load texture ${path}:`, error)
        reject(error)
      }
    )
  })
}
