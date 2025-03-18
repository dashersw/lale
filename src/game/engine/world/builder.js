import * as THREE from 'three'
import { player, debugVisualsEnabled } from '../state.js'
import { getRoomData, FLOOR_TYPES, CEILING_TYPES } from '../../map.js'

import {
  floorTexture,
  floorDisplacementMap,
  wallTexture,
  wallDisplacementMap,
  ceilingTexture,
  ceilingDisplacementMap,
  doorTexture,
  doorDisplacementMap
} from '../textures.js'
import { scene } from './scene.js'

export let walls = []
export let doors = []

// Define textures and colors for different tile types
const COLORS = {
  WALL: { r: 150, g: 120, b: 90 },
  FLOOR: { r: 130, g: 110, b: 80 },
  DOOR: { r: 120, g: 80, b: 40 },
  SPECIAL_FLOOR: { r: 60, g: 180, b: 160 }
}

// Define colors for different floor types
const FLOOR_COLORS = {
  [FLOOR_TYPES.BLACK]: { r: 0, g: 0, b: 0 },
  [FLOOR_TYPES.BLUE]: { r: 0, g: 0, b: 255 },
  [FLOOR_TYPES.GREEN]: { r: 0, g: 255, b: 0 },
  [FLOOR_TYPES.RED]: { r: 255, g: 0, b: 0 },
  1: { r: 130, g: 110, b: 80 }, // Default stone
  2: { r: 80, g: 60, b: 40 }, // Wood
  3: { r: 60, g: 180, b: 160 }, // Special
  4: { r: 180, g: 180, b: 180 }, // Marble
  5: { r: 100, g: 120, b: 140 } // Slate
}

// Define colors for different ceiling types
const CEILING_COLORS = {
  [CEILING_TYPES.STONE]: { r: 110, g: 100, b: 90 }, // Light Gray
  [CEILING_TYPES.WOODEN]: { r: 70, g: 70, b: 90 }, // Brown
  [CEILING_TYPES.DARK]: { r: 140, g: 120, b: 90 }, // Dark Gray
  [CEILING_TYPES.BROKEN_WOODEN]: { r: 60, g: 60, b: 80 } // Sandy Brown
}

// Create a wall segment at specified position and direction
export function createWallSegment(scene, x, y, direction) {
  // Fixed dimensions - walls must be exactly 1.0 wide to match grid cell size
  const wallWidth = 1
  const wallHeight = 1.0
  // Use a thinner wall depth to avoid excessive protrusion
  const wallDepth = 0.1

  console.log(`Creating wall at (${x}, ${y}) facing ${direction}`)

  // Create wall geometry - use more segments for better bump mapping
  const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth, 1, 8, 1)
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.6,
    metalness: 0.8
  })

  // Add bump map to walls
  if (wallDisplacementMap) {
    // Use displacement map as bump map for more detailed walls
    wallMaterial.bumpMap = wallDisplacementMap
    wallMaterial.bumpScale = 2 // Set bump intensity

    // Make sure texture settings match
    if (wallTexture && wallDisplacementMap) {
      wallDisplacementMap.wrapS = wallTexture.wrapS
      wallDisplacementMap.wrapT = wallTexture.wrapT
      wallDisplacementMap.repeat.copy(wallTexture.repeat)
    }
  }

  const wall = new THREE.Mesh(wallGeometry, wallMaterial)

  // Enable shadows
  wall.castShadow = true
  wall.receiveShadow = true

  // Position walls exactly at room boundaries (3x3 grid lines)
  if (direction === 'north') {
    // North wall - place exactly at the north edge
    wall.position.set(x + 0.5, wallHeight / 2, y)
    wall.rotation.y = 0
  } else if (direction === 'south') {
    // South wall - place exactly at the south edge
    wall.position.set(x + 0.5, wallHeight / 2, y)
    wall.rotation.y = 0
  } else if (direction === 'east') {
    // East wall - place exactly at the east edge
    wall.position.set(x, wallHeight / 2, y + 0.5)
    wall.rotation.y = Math.PI / 2
  } else if (direction === 'west') {
    // West wall - place exactly at the west edge
    wall.position.set(x, wallHeight / 2, y + 0.5)
    wall.rotation.y = Math.PI / 2
  }

  // Add the wall to the scene
  scene.add(wall)
  walls.push(wall)

  // Store wall metadata for debugging
  wall.userData = {
    originalX: x,
    originalY: y,
    direction: direction
  }

  // Create a small marker at the wall position to help debug
  const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8)
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // Green
  const marker = new THREE.Mesh(markerGeometry, markerMaterial)
  marker.position.set(0, 0, 0) // At the center of wall
  wall.add(marker)
}

// Build the dungeon from the map data
export function buildDungeon() {
  if (!scene) {
    console.error('Scene not initialized')
    return
  }

  console.log('Building dungeon - 10x10 grid of rooms, each room has 3x3 walkable spaces')

  // Clear previous objects from scene
  for (const wall of walls) {
    scene.remove(wall)
  }

  for (const door of doors) {
    scene.remove(door)
  }

  // Reset collections
  walls = []
  doors = []

  // Add global lighting instead of per-room lights
  // First, remove any existing lights
  scene.children = scene.children.filter(
    child => !(child instanceof THREE.PointLight || child instanceof THREE.DirectionalLight)
  )

  // Add ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0x808080, 0.5)
  scene.add(ambientLight)

  // Add directional light for shadows
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(20, 30, 20)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  dirLight.shadow.camera.left = -30
  dirLight.shadow.camera.right = 30
  dirLight.shadow.camera.top = 30
  dirLight.shadow.camera.bottom = -30
  dirLight.shadow.camera.near = 0.5
  dirLight.shadow.camera.far = 60
  dirLight.shadow.bias = -0.0001
  // scene.add(dirLight)

  // Add directional light helper to visualize light direction and shadow camera
  const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5)
  scene.add(dirLightHelper)

  // Add shadow camera helper to visualize the area where shadows are rendered
  const shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera)
  scene.add(shadowHelper)

  // Add some strategic point lights instead of per-room lights
  // These will be placed at key locations rather than in every room
  const addPointLight = (x, z, intensity = 1, distance = 10) => {
    const light = new THREE.PointLight(0xffd0a0, intensity, distance, 2)
    light.position.set(x, 0.5, z) // Position at player eye level
    light.castShadow = true
    light.shadow.mapSize.width = 512
    light.shadow.mapSize.height = 512
    light.shadow.bias = -0.0005
    scene.add(light)

    // Add a visible sphere to represent the light source
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 8) // Much larger sphere (0.5 units)
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00, // Bright yellow
      emissive: 0xffff00,
      emissiveIntensity: 1.0
    })
    const lightBulb = new THREE.Mesh(sphereGeometry, sphereMaterial)
    lightBulb.position.copy(light.position)
    // scene.add(lightBulb)

    // Add a THREE.js light helper to visualize the light's range
    const helper = new THREE.PointLightHelper(light, 0.5)
    // scene.add(helper)

    // Return the lightbulb for reference
    return { light, lightBulb, helper }
  }

  // Add lights inside specific rooms (using room coordinates)
  // Each room is 3x3 units, so we place lights at the center of specific rooms
  // Room (1,1) center is at (1*3+1.5, 1*3+1.5) = (4.5, 4.5)
  const lightBulbs = [
    addPointLight(4.5, 4.5, 0.3, 15), // Room (1,1) - near start
    addPointLight(13.5, 13.5, 1.5, 15), // Room (4,4) - middle
    addPointLight(4.5, 25.5, 1.5, 15), // Room (1,8) - corner
    addPointLight(25.5, 4.5, 1.5, 15) // Room (8,1) - corner
  ]

  // Add a ceiling light in the starting room that blinks
  const blinkingLight = addPointLight(player.x, player.y, 0.2, 8)
  blinkingLight.lightBulb.material.color.set(0xff0000) // Red color

  // Store reference for animation
  window.blinkingLight = blinkingLight.light
  window.blinkingLightBulb = blinkingLight.lightBulb

  // Get the room data for wall positions and floor colors
  const rooms = getRoomData()
  console.log('Room data count:', rooms.length)

  // DETAILED ROOM TYPES ANALYSIS FOR DEBUGGING
  console.log('-------- DETAILED ROOM TYPE ANALYSIS --------')
  const typeCounts = {
    topType: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
    rightType: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
    bottomType: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
    leftType: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  }

  // Analyze the first 10 rooms to understand the data
  for (let i = 0; i < Math.min(10, rooms.length); i++) {
    const room = rooms[i]
    console.log(`Room ${i + 1} wall types:`)
    console.log(`  Top: Type=${room.topType}, Wall=${room.topWall}`)
    console.log(`  Right: Type=${room.rightType}, Wall=${room.rightWall}`)
    console.log(`  Bottom: Type=${room.bottomType}, Wall=${room.bottomWall}`)
    console.log(`  Left: Type=${room.leftType}, Wall=${room.leftWall}`)
  }

  // Count all types
  for (const room of rooms) {
    typeCounts.topType[room.topType] = (typeCounts.topType[room.topType] || 0) + 1
    typeCounts.rightType[room.rightType] = (typeCounts.rightType[room.rightType] || 0) + 1
    typeCounts.bottomType[room.bottomType] = (typeCounts.bottomType[room.bottomType] || 0) + 1
    typeCounts.leftType[room.leftType] = (typeCounts.leftType[room.leftType] || 0) + 1
  }

  console.log('Type distribution across all rooms:')
  console.log('Top wall types:', typeCounts.topType)
  console.log('Right wall types:', typeCounts.rightType)
  console.log('Bottom wall types:', typeCounts.bottomType)
  console.log('Left wall types:', typeCounts.leftType)
  console.log('-------- END DETAILED ROOM TYPE ANALYSIS --------')

  // ADD A FULL DOOR ANALYSIS TO SEE IF ANY DOORS EXIST IN THE MAP
  console.log('-------- DOOR ANALYSIS --------')
  let totalDoors = 0
  let totalExits = 0

  for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
    const room = rooms[roomIndex]
    let hasDoor = false

    // Check for doors in this room
    if (room.topType === 3) {
      console.log(`Room ${roomIndex + 1} has a DOOR on the NORTH side`)
      hasDoor = true
      totalDoors++
    } else if (room.topType === 4) {
      console.log(`Room ${roomIndex + 1} has an EXIT on the NORTH side`)
      hasDoor = true
      totalExits++
    }

    if (room.rightType === 3) {
      console.log(`Room ${roomIndex + 1} has a DOOR on the EAST side`)
      hasDoor = true
      totalDoors++
    } else if (room.rightType === 4) {
      console.log(`Room ${roomIndex + 1} has an EXIT on the EAST side`)
      hasDoor = true
      totalExits++
    }

    if (room.bottomType === 3) {
      console.log(`Room ${roomIndex + 1} has a DOOR on the SOUTH side`)
      hasDoor = true
      totalDoors++
    } else if (room.bottomType === 4) {
      console.log(`Room ${roomIndex + 1} has an EXIT on the SOUTH side`)
      hasDoor = true
      totalExits++
    }

    if (room.leftType === 3) {
      console.log(`Room ${roomIndex + 1} has a DOOR on the WEST side`)
      hasDoor = true
      totalDoors++
    } else if (room.leftType === 4) {
      console.log(`Room ${roomIndex + 1} has an EXIT on the WEST side`)
      hasDoor = true
      totalExits++
    }

    if (!hasDoor) {
      console.log(`Room ${roomIndex + 1} has NO DOORS`)
    }
  }

  console.log(`TOTAL DOORS in map: ${totalDoors}`)
  console.log(`TOTAL EXITS in map: ${totalExits}`)
  console.log('-------- END DOOR ANALYSIS --------')

  // Debug - check first few rooms
  if (rooms.length > 0) {
    console.log('First room structure:', rooms[0])
    if (rooms.length > 1) {
      console.log('Second room structure:', rooms[1])
    }
  } else {
    console.error('No room data available')
    return
  }

  // Add a test cube at the origin to verify the coordinate system
  // Only add debug elements if debug is enabled
  if (debugVisualsEnabled) {
    const testCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    testCube.position.set(0, 0.5, 0)
    scene.add(testCube)
    debugVisualElements.push(testCube)
    console.log('Added test cube at origin (0,0,0)')
  }

  // Add visible grid lines to show room boundaries (for debugging)
  if (debugVisualsEnabled) {
    createRoomGridVisualization()
  }

  // Track created elements
  let floorCount = 0
  let wallCount = 0
  let doorCount = 0
  let exitCount = 0

  // Define grid size
  const GRID_SIZE = 10 // 10x10 grid of rooms
  const ROOM_SIZE = 3 // Each room is 3x3 walkable space

  console.log('Creating floors and walls for each room...')
  console.log(`Door creation is essential - we'll verify each door is created correctly`)

  for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
    // Calculate room grid position (0-9, 0-9)
    const roomGridX = roomIndex % GRID_SIZE
    const roomGridY = Math.floor(roomIndex / GRID_SIZE)

    // Calculate room's world position (the corner of the room)
    const roomWorldX = roomGridX * ROOM_SIZE
    const roomWorldZ = roomGridY * ROOM_SIZE

    console.log(
      `Processing room ${roomIndex + 1} at grid (${roomGridX},${roomGridY}), world pos (${roomWorldX},${roomWorldZ})`
    )

    const room = rooms[roomIndex]

    // STEP 1: CREATE FLOOR FOR ENTIRE 3x3 ROOM
    for (let dx = 0; dx < ROOM_SIZE; dx++) {
      for (let dz = 0; dz < ROOM_SIZE; dz++) {
        // Position of this floor tile
        const floorX = roomWorldX + dx
        const floorZ = roomWorldZ + dz

        // Create floor tile
        createFloorTile(scene, floorX, floorZ, room.floorType)
        floorCount++
      }
    }

    // IMPORTANT: VALIDATE DOOR PROPERTIES BEFORE CREATING DOORS
    console.log(`Room ${roomIndex + 1} door properties: 
      Top: ${room.topWall} (Type: ${room.topType}), 
      Right: ${room.rightWall} (Type: ${room.rightType}), 
      Bottom: ${room.bottomWall} (Type: ${room.bottomType}), 
      Left: ${room.leftWall} (Type: ${room.leftType})`)

    // TOP WALL/DOOR (NORTH)
    if (room.topWall === 1 || room.topType === 3 || room.topType === 4) {
      // North wall spans the entire north edge of the 3x3 room
      for (let dx = 0; dx < ROOM_SIZE; dx++) {
        // Skip middle position if it's a door or exit
        if (dx === 1 && (room.topType === 3 || room.topType === 4)) {
          if (room.topType === 3) {
            // Door exactly in the center of north wall (at x+1, which is the center tile)
            const door = createDoor(scene, roomWorldX + 1, roomWorldZ, 'north', false)
            if (door) {
              doorCount++
              console.log(`Created north door for room ${roomIndex + 1} at (${roomWorldX + 1},${roomWorldZ})`)
            } else {
              console.error(`Failed to create north door for room ${roomIndex + 1}!`)
            }
          } else if (room.topType === 4) {
            // Exit exactly in the center of north wall
            const exitDoor = createDoor(scene, roomWorldX + 1, roomWorldZ, 'north', true)
            if (exitDoor) {
              exitCount++
              console.log(`Created north exit for room ${roomIndex + 1} at (${roomWorldX + 1},${roomWorldZ})`)
            } else {
              console.error(`Failed to create north exit for room ${roomIndex + 1}!`)
            }
          }
        } else {
          // Wall at north edge
          createWallSegment(scene, roomWorldX + dx, roomWorldZ, 'north')
          wallCount++
        }
      }
    }

    // RIGHT WALL/DOOR (EAST)
    if (room.rightWall === 1 || room.rightType === 3 || room.rightType === 4) {
      // East wall spans the entire east edge of the 3x3 room
      for (let dz = 0; dz < ROOM_SIZE; dz++) {
        // Skip middle position if it's a door or exit
        if (dz === 1 && (room.rightType === 3 || room.rightType === 4)) {
          if (room.rightType === 3) {
            // Door exactly in the center of east wall (at z+1, which is the center tile)
            const door = createDoor(scene, roomWorldX + ROOM_SIZE, roomWorldZ + 1, 'east', false)
            if (door) {
              doorCount++
              console.log(
                `Created east door for room ${roomIndex + 1} at (${roomWorldX + ROOM_SIZE},${roomWorldZ + 1})`
              )
            } else {
              console.error(`Failed to create east door for room ${roomIndex + 1}!`)
            }
          } else if (room.rightType === 4) {
            // Exit in the middle of east wall - use exact center position
            const exitDoor = createDoor(scene, roomWorldX + ROOM_SIZE, roomWorldZ + 1, 'east', true)
            if (exitDoor) {
              exitCount++
              console.log(
                `Created east exit for room ${roomIndex + 1} at (${roomWorldX + ROOM_SIZE},${roomWorldZ + 1})`
              )
            } else {
              console.error(`Failed to create east exit for room ${roomIndex + 1}!`)
            }
          }
        } else {
          // Wall exactly at east edge
          createWallSegment(scene, roomWorldX + ROOM_SIZE, roomWorldZ + dz, 'east')
          wallCount++
        }
      }
    }

    // BOTTOM WALL/DOOR (SOUTH)
    if (room.bottomWall === 1 || room.bottomType === 3 || room.bottomType === 4) {
      // South wall spans the entire south edge of the 3x3 room
      for (let dx = 0; dx < ROOM_SIZE; dx++) {
        // Skip middle position if it's a door or exit
        if (dx === 1 && (room.bottomType === 3 || room.bottomType === 4)) {
          if (room.bottomType === 3) {
            // Door in the middle of south wall - use exact center position
            const door = createDoor(scene, roomWorldX + 1, roomWorldZ + ROOM_SIZE, 'south', false)
            if (door) {
              doorCount++
              console.log(
                `Created south door for room ${roomIndex + 1} at (${roomWorldX + 1},${roomWorldZ + ROOM_SIZE})`
              )
            } else {
              console.error(`Failed to create south door for room ${roomIndex + 1}!`)
            }
          } else if (room.bottomType === 4) {
            // Exit in the middle of south wall - use exact center position
            const exitDoor = createDoor(scene, roomWorldX + 1, roomWorldZ + ROOM_SIZE, 'south', true)
            if (exitDoor) {
              exitCount++
              console.log(
                `Created south exit for room ${roomIndex + 1} at (${roomWorldX + 1},${roomWorldZ + ROOM_SIZE})`
              )
            } else {
              console.error(`Failed to create south exit for room ${roomIndex + 1}!`)
            }
          }
        } else {
          // Wall exactly at south edge
          createWallSegment(scene, roomWorldX + dx, roomWorldZ + ROOM_SIZE, 'south')
          wallCount++
        }
      }
    }

    // LEFT WALL/DOOR (WEST)
    if (room.leftWall === 1 || room.leftType === 3 || room.leftType === 4) {
      // West wall spans the entire west edge of the 3x3 room
      for (let dz = 0; dz < ROOM_SIZE; dz++) {
        // Skip middle position if it's a door or exit
        if (dz === 1 && (room.leftType === 3 || room.leftType === 4)) {
          if (room.leftType === 3) {
            // Door in the middle of west wall - use exact center position
            const door = createDoor(scene, roomWorldX, roomWorldZ + 1, 'west', false)
            if (door) {
              doorCount++
              console.log(`Created west door for room ${roomIndex + 1} at (${roomWorldX},${roomWorldZ + 1})`)
            } else {
              console.error(`Failed to create west door for room ${roomIndex + 1}!`)
            }
          } else if (room.leftType === 4) {
            // Exit in the middle of west wall - use exact center position
            const exitDoor = createDoor(scene, roomWorldX, roomWorldZ + 1, 'west', true)
            if (exitDoor) {
              exitCount++
              console.log(`Created west exit for room ${roomIndex + 1} at (${roomWorldX},${roomWorldZ + 1})`)
            } else {
              console.error(`Failed to create west exit for room ${roomIndex + 1}!`)
            }
          }
        } else {
          // Wall exactly at west edge
          createWallSegment(scene, roomWorldX, roomWorldZ + dz, 'west')
          wallCount++
        }
      }
    }

    // Add room number in center of room for debugging
    if (roomIndex < 100 && debugVisualsEnabled) {
      // Create a white circle background for better visibility
      const circleGeo = new THREE.CircleGeometry(0.3, 16)
      circleGeo.rotateX(-Math.PI / 2)
      const circleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
      const circle = new THREE.Mesh(circleGeo, circleMat)
      circle.position.set(roomWorldX + 1, 0.01, roomWorldZ + 1) // Center of room, slightly above floor
      scene.add(circle)
      debugVisualElements.push(circle)

      // Add room number
      const roomNum = roomIndex + 1 // 1-based room numbering

      // Create canvas-based text texture
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'black'
      ctx.font = 'bold 40px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(roomNum, 32, 32)

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas)
      const textMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      // Create text plane in center of room
      const textGeo = new THREE.PlaneGeometry(0.5, 0.5)
      textGeo.rotateX(-Math.PI / 2)
      const textMesh = new THREE.Mesh(textGeo, textMat)
      textMesh.position.set(roomWorldX + 1, 0.02, roomWorldZ + 1) // Center of room, above the circle
      scene.add(textMesh)
      debugVisualElements.push(textMesh)
    }
  }

  // Create ceiling for the entire dungeon (30x30 units)
  createCeiling(scene, GRID_SIZE * ROOM_SIZE)

  // Log creation summary with additional verification for doors
  console.log(`Dungeon created with:
    - ${floorCount} floor tiles
    - ${wallCount} wall segments
    - ${doorCount} doors
    - ${exitCount} exits`)

  // VERIFY DOORS CREATED SUCCESSFULLY - EXTENDED DEBUG
  console.log('-------- DOOR VERIFICATION --------')
  console.log(`Door verification: ${doors.length} doors in the doors array`)
  if (doors.length !== doorCount + exitCount) {
    console.error(
      `CRITICAL ERROR: Door count mismatch! Expected ${doorCount + exitCount} but found ${doors.length} in the array.`
    )
  } else {
    console.log('All doors successfully created and stored!')
  }

  // Check if all doors have the required components
  doors.forEach((door, index) => {
    console.log(
      `Door ${index + 1} at (${door.x}, ${door.y}), facing: ${door.facing}, isExit: ${door.isExit ? 'Yes' : 'No'}`
    )
  })

  // If no doors were created, print a large warning
  if (doors.length === 0) {
    console.error('*********************************************')
    console.error('*       NO DOORS CREATED IN THE SCENE       *')
    console.error('*        CHECK YOUR MAP DATA FILE!          *')
    console.error('*********************************************')
  }

  console.log('-------- END DOOR VERIFICATION --------')

  console.log('Dungeon building complete')

  // Add these lines right after the detailed room type analysis
  // Extra logging to specifically check for doors (type 3)
  console.log('-------- WALL TYPE EXTRACTION --------')
  const doorCandidates = []

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i]

    // Check all four walls for doors (type 3)
    if (room.topType === 3) {
      doorCandidates.push({
        roomIndex: i + 1,
        side: 'top',
        type: room.topType,
        wall: room.topWall
      })
    }

    if (room.rightType === 3) {
      doorCandidates.push({
        roomIndex: i + 1,
        side: 'right',
        type: room.rightType,
        wall: room.rightWall
      })
    }

    if (room.bottomType === 3) {
      doorCandidates.push({
        roomIndex: i + 1,
        side: 'bottom',
        type: room.bottomType,
        wall: room.bottomWall
      })
    }

    if (room.leftType === 3) {
      doorCandidates.push({
        roomIndex: i + 1,
        side: 'left',
        type: room.leftType,
        wall: room.leftWall
      })
    }
  }

  console.log(`Found ${doorCandidates.length} door candidates (type 3)`)
  if (doorCandidates.length > 0) {
    console.log('First 5 door candidates:')
    for (let i = 0; i < Math.min(5, doorCandidates.length); i++) {
      console.log(doorCandidates[i])
    }
  } else {
    console.error('NO DOORS FOUND IN MAP DATA! This is likely the source of the problem.')
    console.error('Checking for walls with type 3 regardless of wall value:')

    // Alternative check - find any type 3 walls regardless of wall value
    let anyType3 = 0
    for (const room of rooms) {
      if (room.topType === 3) anyType3++
      if (room.rightType === 3) anyType3++
      if (room.bottomType === 3) anyType3++
      if (room.leftType === 3) anyType3++
    }

    console.log(`Found ${anyType3} walls with type 3 (regardless of wall value)`)
  }
  console.log('-------- END WALL TYPE EXTRACTION --------')
}

// Update ceiling creation function to accept grid size
function createCeiling(scene, gridSize) {
  const rooms = getRoomData()

  // Create ceiling geometry to cover entire grid - use higher segment count for displacement
  const ceilingGeometry = new THREE.PlaneGeometry(gridSize, gridSize, 100, 100)
  ceilingGeometry.rotateX(Math.PI / 2)

  // Use the first available ceiling type from room data
  let ceilingColor = CEILING_COLORS[1] || { r: 34, g: 34, b: 34 }
  let ceilingType = CEILING_TYPES.STONE
  if (rooms.length > 0 && rooms[0].ceilingType) {
    ceilingType = rooms[0].ceilingType
    ceilingColor = CEILING_COLORS[ceilingType] || CEILING_COLORS[1]
  }

  // Create ceiling material
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: ceilingTexture,
    roughness: 0.3, // Reduce roughness to make it more reflective (was 0.8)
    metalness: 0.7, // Increase metalness slightly (was 0.1)
    color: new THREE.Color(ceilingColor.r / 255, ceilingColor.g / 255, ceilingColor.b / 255),
    emissive: new THREE.Color(0x111111), // Slight emissive to make it visible in low light
    emissiveIntensity: 0.05 // Very low emissive intensity
  })

  // Add displacement map if available
  if (ceilingDisplacementMap) {
    ceilingMaterial.displacementMap = ceilingDisplacementMap
    ceilingMaterial.displacementScale = 0.15 // More pronounced for ceiling
    ceilingMaterial.bumpMap = ceilingDisplacementMap // Use same texture as bump map
    ceilingMaterial.bumpScale = 30
    // ceilingMaterial.normalScale = new THREE.Vector2(1, 1)
  }

  // Set appropriate texture repeat based on dungeon size
  const repeatCount = Math.max(2, Math.ceil(gridSize / 4))
  ceilingTexture.repeat.set(repeatCount, repeatCount)

  // Also set repeat for displacement map if available
  if (ceilingDisplacementMap) {
    ceilingDisplacementMap.repeat.set(repeatCount, repeatCount)
  }

  // Apply ceiling type properties
  if (ceilingType === CEILING_TYPES.WOODEN || ceilingType === CEILING_TYPES.BROKEN_WOODEN) {
    ceilingMaterial.metalness = 0.5
    ceilingMaterial.roughness = 0.7

    if (ceilingType === CEILING_TYPES.BROKEN_WOODEN) {
      ceilingMaterial.roughness = 0.9
      ceilingMaterial.color.multiplyScalar(0.8) // Darker
    }
  } else if (ceilingType === CEILING_TYPES.STONE) {
    ceilingMaterial.metalness = 0.5
    ceilingMaterial.roughness = 0.9
  } else if (ceilingType === CEILING_TYPES.DARK) {
    ceilingMaterial.color.multiplyScalar(0.7) // Make darker
  }

  // Create and position ceiling - center over the entire dungeon (30x30 grid)
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
  ceiling.position.set(gridSize / 2, 1, gridSize / 2)
  // ceiling.receiveShadow = true // Ensure ceiling receives shadows
  scene.add(ceiling)

  return ceiling
}

// Create a door at the specified position and orientation
function createDoor(scene, x, y, facing, isExit) {
  console.log(`DOOR CREATION: Creating door at (${x}, ${y}) facing ${facing}, isExit: ${isExit}`)

  // Create door group container
  const doorGroup = new THREE.Group()

  // Get exact integer grid coordinates
  const gridX = Math.floor(x)
  const gridY = Math.floor(y)

  // Position door exactly at grid coordinates
  // Add exact offsets to center the door in the middle of a wall segment
  if (facing === 'north') {
    doorGroup.position.set(gridX, 0.5, gridY)
    doorGroup.rotation.y = 0
  } else if (facing === 'south') {
    // doorGroup.position.set(gridX + 0.5, 0.5, gridY)
    // doorGroup.rotation.y = Math.PI
  } else if (facing === 'east') {
    // doorGroup.position.set(gridX, 0.5, gridY)
    // doorGroup.rotation.y = Math.PI / 2
  } else {
    // west
    doorGroup.position.set(gridX, 0.5, gridY)
    doorGroup.rotation.y = -Math.PI / 2
  }

  scene.add(doorGroup)

  // Create a pivot for door animation
  const doorPivot = new THREE.Group()
  doorGroup.add(doorPivot)

  // Set the target rotation for animation
  const targetRotation = Math.PI / 2 // 90 degrees
  doorPivot.userData.targetRotation = targetRotation

  // Store metadata in the doorGroup
  doorGroup.userData.doorPivot = doorPivot
  doorGroup.userData.isAnimating = false
  doorGroup.userData.isOpen = false
  doorGroup.userData.isExit = isExit

  // EXACTLY 1/3 of a wall width (wall width is 1.0, so door is 0.33)
  const doorWidth = 1
  const doorHeight = 1.6 // Slightly shorter than wall height (2.0)
  const doorThickness = 0.05

  // Create door geometry with more segments for better bump mapping
  const doorGeometry = new THREE.BoxGeometry(
    doorWidth,
    doorHeight,
    doorThickness,
    1, // width segments
    16, // height segments - more detail along height
    1 // depth segments
  )

  // Create door material
  const doorColor = isExit ? 0xa25e1d : 0x6b4423 // Exit doors slightly different color
  const doorMaterial = new THREE.MeshStandardMaterial({
    map: doorTexture, // Use the rubble texture for the door
    color: doorColor,
    roughness: 0.8,
    metalness: 0.2
  })

  // Add bump map for more realistic door texture
  if (doorTexture && wallDisplacementMap) {
    // We can reuse the rubble displacement map as bump map
    doorMaterial.bumpMap = doorDisplacementMap
    doorMaterial.bumpScale = 6.55 // Subtle bump effect for the door

    // Make sure texture settings match
    doorTexture.wrapS = THREE.RepeatWrapping
    doorTexture.wrapT = THREE.RepeatWrapping
    doorTexture.repeat.set(1, 1.6) // Scale to fit the door dimensions
  }

  const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial)

  // Position door correctly relative to pivot
  // Offset by half the door width (0.165) so the door is centered
  doorMesh.position.set(doorWidth / 2, 0, 0)
  doorPivot.add(doorMesh)

  // Add tiny handle to the door
  const handleGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.06)
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.2
  })
  const handle = new THREE.Mesh(handleGeometry, handleMaterial)
  // Position handle near the edge of the door (away from hinge)
  // handle.position.set(doorWidth * 0.85, 0, doorThickness)
  // doorMesh.add(handle)

  // Add to doors array for interactive use
  doors.push({
    object: doorGroup,
    x: gridX,
    y: gridY,
    facing: facing,
    isExit: isExit,
    isOpen: false,
    isAnimating: false
  })

  // Log door creation
  console.log(`DOOR CREATED: ${isExit ? 'Exit' : 'Regular door'} at (${gridX}, ${gridY}) facing ${facing}`)

  return doorGroup
}

// Create a floor tile at the specified position
function createFloorTile(scene, x, y, floorType) {
  // Safety checks
  if (!floorTexture) {
    console.error('Floor texture not initialized')
    return
  }

  if (!scene) {
    console.error('Scene not initialized')
    return
  }

  // Get floor color based on floor type
  let floorColor = COLORS.FLOOR
  if (floorType) {
    floorColor = FLOOR_COLORS[floorType] || COLORS.FLOOR
  }

  // Create floor material with appropriate texture and color
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.7,
    metalness: 0.1,
    color: new THREE.Color(floorColor.r / 255, floorColor.g / 255, floorColor.b / 255)
  })

  // Add displacement map if available
  if (floorDisplacementMap) {
    floorMaterial.displacementMap = floorDisplacementMap
    floorMaterial.displacementScale = 0.05 // Subtle displacement
    floorMaterial.bumpMap = floorDisplacementMap // Use same texture as bump map
    floorMaterial.bumpScale = 6
  }

  // Create and position the floor mesh - use higher segment count for better displacement
  const floorGeometry = new THREE.PlaneGeometry(1, 1, 32, 32)
  floorGeometry.rotateX(-Math.PI / 2)
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)

  // Enable shadows for floor
  floor.receiveShadow = true

  floor.position.set(x, 0, y)
  scene.add(floor)
}
