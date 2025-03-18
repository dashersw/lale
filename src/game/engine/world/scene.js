import * as THREE from 'three'
import { initCamera } from '../camera'
import { player, isFlashlightActive } from '../state'
import { findStartPosition, loadMapFromFile } from '../../map'
import { loadAllTextures } from '../textures'
import { buildDungeon } from './builder'
import { updatePlayerPosition } from '../player/movement'
import { startAnimation } from '../../loop'
import { handleDoorClick } from '../controls/interactions/doors'
import { handleMouseMove, handlePointerLockChange, toggleMouseControls } from '../controls/mouse'
import { createPlayerFlashlight } from '../lighting'

export let fog = new THREE.FogExp2(0x000000, 0.25)
export let scene = null
export let renderer = null

// Initialize the Three.js scene
export function initScene(container) {
  console.log('Initializing Three.js dungeon scene', container)

  if (!container) {
    console.error('No container element provided')
    return null
  }

  // Create the THREE.js scene immediately to return the reference
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  // Add fog to the scene - crucial for volumetric lighting effects
  const fogColor = new THREE.Color(0x000000)
  fog = new THREE.FogExp2(fogColor, 0.25) // Increased fog density from 0.15 to 0.25
  scene.fog = fog

  // Add ambient light for base visibility
  const ambientLight = new THREE.AmbientLight(0x808080, 0.15) // Increased ambient light intensity (was 0.05)
  scene.add(ambientLight)

  // Create the camera
  const camera = initCamera(container)

  // Create the renderer with better shadows and high performance settings
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance' // Request high-performance GPU (helps with Chrome)
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  // Enable shadows
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // Reset player position to default before loading map
  player.x = 1
  player.y = 1
  player.direction = 0
  player.verticalAngle = 0

  // Load the map data from the file - using the public directory
  loadMapFromFile('/1.txt')
    .then(success => {
      if (!success) {
        console.error('Failed to load map data, using default map')
      } else {
        console.log('Map data loaded successfully')

        // Update player position AFTER map loads
        const startPos = findStartPosition()
        console.log('Found start position:', startPos)

        // Convert room coordinates to world coordinates (room grid to 3x3 room layout)
        // Place player in center of the start room
        const roomWorldX = startPos.x * 3 // 3 units per room
        const roomWorldZ = startPos.y * 3
        player.x = roomWorldX + 1 // Center of room (x+1, y+1)
        player.y = roomWorldZ + 1
        player.direction = startPos.direction
        player.verticalAngle = 0

        // Log the room number player is starting in
        const roomIndex = startPos.y * 10 + startPos.x
        console.log(`Starting in room ${roomIndex + 1} at position (${player.x}, ${player.y}) in world coordinates`)
      }

      // Continue initialization
      completeInitialization()
    })
    .catch(error => {
      console.error('Error loading map:', error)
      // Continue with initialization using default map
      completeInitialization()
    })

  // Return necessary objects for Game.vue
  return {
    scene,
    camera,
    renderer
  }
}

// Complete initialization after map loading attempt
function completeInitialization() {
  try {
    // Create procedural textures and wait for external textures to load
    loadAllTextures()
      .then(() => {
        console.log('All textures loaded successfully, building dungeon')

        // Build the dungeon only after textures are loaded
        buildDungeon()

        // Log player position before camera update
        console.log('Final player position before camera update:', player)

        // Set initial player position and camera
        updatePlayerPosition()

        // Log player starting position with room number
        const roomNumber = Math.floor(player.y / 3) * 10 + Math.floor(player.x / 3) + 1 // Assuming a 10x10 grid, +1 because rooms start at 1

        console.log(
          `Player starting at position: (${player.x}, ${player.y}) direction: ${player.direction} in room: ${roomNumber}`
        )
        console.log(`Room coordinates: (${Math.floor(player.x / 3)}, ${Math.floor(player.y / 3)})`)
        console.log(`Position within room: (${player.x % 3}, ${player.y % 3})`)

        // Start animation loop
        startAnimation()

        // Set up mouse controls for the canvas
        renderer.domElement.addEventListener('click', handleDoorClick)
        renderer.domElement.addEventListener('dblclick', toggleMouseControls)
        document.addEventListener('pointerlockchange', handlePointerLockChange)
        document.addEventListener('mousemove', handleMouseMove)

        // Create the player's floating flashlight light that follows them
        createPlayerFlashlight()

        console.log('Initialization completed successfully')
      })
      .catch(error => {
        console.error('Error during texture loading:', error)
        // Fallback to procedural textures and continue initialization
        buildDungeon()
        updatePlayerPosition()
        // window.addEventListener('resize', onWindowResize)
        startAnimation()
        renderer.domElement.addEventListener('click', handleDoorClick)
        renderer.domElement.addEventListener('dblclick', toggleMouseControls)
        document.addEventListener('pointerlockchange', handlePointerLockChange)
        document.addEventListener('mousemove', handleMouseMove)
      })
  } catch (error) {
    console.error('Error during initialization:', error)
  }
}
