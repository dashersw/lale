// Map legend:
// 0 = Empty space/wall
// 1 = Floor
// 2 = Wall with potential door/exit
// 3 = Door (regular door)
// 4 = Exit (special door)

// This new implementation loads maps from the format used in 1.txt

// Room structure based on the map format:
// Each room has:
// - Wall information (type and existence) for all four sides (top, right, bottom, left)
// - Floor type
// - Ceiling type

// Constants for tile types
export const TILE_TYPES = {
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  EXIT: 4
}

// Constants for floor types
export const FLOOR_TYPES = {
  BLACK: 1,
  BLUE: 2,
  GREEN: 3,
  RED: 4
}

// Constants for ceiling types
export const CEILING_TYPES = {
  STONE: 1,
  WOODEN: 2,
  DARK: 3,
  BROKEN_WOODEN: 4
}

// The loaded dungeon map
let dungeonMap = []
// The original 10x10 room data (100 rooms in a square)
let roomData = []
// Metadata from the map
let mapMetadata = {}

// Load map data from the specified path
export const loadMapFromFile = async mapFilePath => {
  try {
    const response = await fetch(mapFilePath)
    if (!response.ok) {
      throw new Error(`Failed to load map: ${response.status} ${response.statusText}`)
    }
    const data = await response.text()
    parseMapData(data)
    return true
  } catch (error) {
    console.error('Error loading map:', error)
    return false
  }
}

// Parse the map data from the file content
export const parseMapData = content => {
  // Split the content into lines
  const lines = content.split('\n')

  // First line contains metadata
  const metadataLine = lines[0].trim()
  const metadataValues = metadataLine.split(' ').filter(val => val !== '')

  console.log('Raw metadata:', metadataValues)
  console.log('15th element (index 14):', metadataValues[14])

  parseMetadata(metadataValues)

  // Reset room data
  roomData = []

  // Parse the room data (each line after the first is a room)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    // Parse the line (space-separated values)
    const values = line.split(' ').filter(val => val !== '')

    if (values.length >= 19) {
      const room = {
        // Wall data - format aligns with the map viewer in the HTML example
        topType: Number.parseInt(values[4]),
        topWall: Number.parseInt(values[5]),
        rightType: Number.parseInt(values[6]),
        rightWall: Number.parseInt(values[7]),
        bottomType: Number.parseInt(values[8]),
        bottomWall: Number.parseInt(values[9]),
        leftType: Number.parseInt(values[10]),
        leftWall: Number.parseInt(values[11]),
        floorType: Number.parseInt(values[12]),
        ceilingType: Number.parseInt(values[13]),

        // Store additional data if available
        special: values.length > 14 ? values.slice(14) : []
      }

      roomData.push(room)
    }
  }

  // Convert the room data to a tile-based map the engine can use
  convertRoomDataToTileMap()

  console.log(`Loaded ${roomData.length} rooms successfully.`)
}

// Parse the metadata from the first line
const parseMetadata = values => {
  // Check if the array is large enough to contain the starting room index
  if (values.length < 15) {
    console.warn(`Metadata array too short (${values.length}), missing starting room index`)
  }

  // Log each element of the first row with its index for debugging
  console.log('Metadata values with indices:')
  for (let i = 0; i < values.length; i++) {
    console.log(`  Index ${i}: ${values[i]}`)
  }

  mapMetadata = {
    // Parse any relevant metadata values here
    // The 15th element (index 14) is the starting room
    startRoomIndex: values.length >= 15 ? Number.parseInt(values[14]) : 1,
    raw: values
  }

  console.log(`Starting room from metadata: ${mapMetadata.startRoomIndex} (parsed from ${values[14]})`)
}

// Convert the room-based data to a tile-based map
const convertRoomDataToTileMap = () => {
  // Create a map where each room is a single tile
  const mapSize = Math.ceil(Math.sqrt(roomData.length))

  console.log(`Map size: ${mapSize}x${mapSize} (1x1 rooms, no expansion)`)
  console.log(`Total rooms loaded: ${roomData.length}`)

  // Print the first few rooms for debugging
  if (roomData.length > 0) {
    console.log('First room:', roomData[0])

    // Count doors in map data for debugging
    let doorCount = 0
    let exitCount = 0

    for (const room of roomData) {
      if (room.topType === 3 && room.topWall === 1) doorCount++
      if (room.rightType === 3 && room.rightWall === 1) doorCount++
      if (room.bottomType === 3 && room.bottomWall === 1) doorCount++
      if (room.leftType === 3 && room.leftWall === 1) doorCount++

      if (room.topType === 4 && room.topWall === 1) exitCount++
      if (room.rightType === 4 && room.rightWall === 1) exitCount++
      if (room.bottomType === 4 && room.bottomWall === 1) exitCount++
      if (room.leftType === 4 && room.leftWall === 1) exitCount++
    }

    console.log(`DOOR COUNT FROM MAP DATA: ${doorCount} doors, ${exitCount} exits`)
  }

  // Handle case where there are no rooms
  if (roomData.length === 0) {
    console.warn('No room data found, creating a minimal default map')
    // Create a minimal map with one room
    dungeonMap = [
      [4] // Single start tile
    ]
    return
  }

  // Initialize the map with empty space
  dungeonMap = Array(mapSize)
    .fill()
    .map(() => Array(mapSize).fill(0))

  // Populate the map based on room data - each room is a single tile
  for (let roomIndex = 0; roomIndex < roomData.length; roomIndex++) {
    const room = roomData[roomIndex]

    // Calculate the room's position in the grid
    const roomY = Math.floor(roomIndex / mapSize)
    const roomX = roomIndex % mapSize

    // Make every room a floor tile by default
    dungeonMap[roomY][roomX] = 1

    // FIX: Create doors more directly based on room data
    // This part of the previous code isn't correctly representing doors:
    // It's only marking a door if there's another room beyond the door
    // Instead, we should just use the door or exit type information directly
  }

  // Set start position based on metadata
  const startRoomIndex = mapMetadata.startRoomIndex - 1 // Convert from 1-indexed to 0-indexed

  console.log(`Start room index (0-based): ${startRoomIndex}`)

  // Debug check for values that might cause issues
  if (startRoomIndex < 0) {
    console.error(`Invalid negative start room index: ${startRoomIndex}, original value: ${mapMetadata.startRoomIndex}`)
  }
  if (startRoomIndex >= roomData.length) {
    console.error(`Start room index (${startRoomIndex}) is out of bounds, max room index is ${roomData.length - 1}`)
  }

  if (startRoomIndex >= 0 && startRoomIndex < roomData.length) {
    // Valid start room index
    const roomY = Math.floor(startRoomIndex / mapSize)
    const roomX = startRoomIndex % mapSize

    console.log(`Start room coordinates: (${roomX}, ${roomY})`)

    // Clear any previous start positions (important!)
    for (let y = 0; y < dungeonMap.length; y++) {
      for (let x = 0; x < dungeonMap[y].length; x++) {
        if (dungeonMap[y][x] === 4) {
          console.log(`Clearing previous start position at (${x}, ${y})`)
          dungeonMap[y][x] = 1 // Convert back to regular floor
        }
      }
    }

    // Set the new start position
    dungeonMap[roomY][roomX] = 4
    console.log(`Set start position at (${roomX}, ${roomY})`)
  } else {
    // Fallback to the first room if the start room is invalid
    console.error(`Invalid start room, defaulting to first room`)
    dungeonMap[0][0] = 4
  }

  // For debugging: Log the dungeon map
  console.log('Generated dungeon map grid (single tile per room):')
  for (let y = 0; y < dungeonMap.length; y++) {
    console.log(dungeonMap[y].join(' '))
  }

  // Log roomData for debugging
  console.log('ROOM DATA FOR FIRST 5 ROOMS:')
  for (let i = 0; i < Math.min(5, roomData.length); i++) {
    const room = roomData[i]
    console.log(`Room ${i + 1}:
      Top: Wall=${room.topWall}, Type=${room.topType}
      Right: Wall=${room.rightWall}, Type=${room.rightType}
      Bottom: Wall=${room.bottomWall}, Type=${room.bottomType}
      Left: Wall=${room.leftWall}, Type=${room.leftType}
      Floor: ${room.floorType}, Ceiling: ${room.ceilingType}
    `)
  }
}

// Find the starting position (current compatible with the engine)
export const findStartPosition = () => {
  let startX = 1
  let startY = 1
  let found = false

  console.log('Finding start position in dungeonMap...')
  console.log('DungeonMap size:', dungeonMap.length, 'x', dungeonMap[0]?.length)

  // Loop through the dungeon map to find the start position tile (type 4)
  for (let y = 0; y < dungeonMap.length; y++) {
    for (let x = 0; x < dungeonMap[y].length; x++) {
      if (dungeonMap[y][x] === 4) {
        console.log(`Found start position at tile (${x}, ${y})`)

        // Calculate which room this is
        const roomX = Math.floor(x / 3)
        const roomY = Math.floor(y / 3)
        const roomIndex = roomY * 10 + roomX + 1 // Assuming 10x10 grid

        console.log(`This corresponds to room ${roomIndex} at grid position (${roomX}, ${roomY})`)

        startX = x
        startY = y
        found = true
        break
      }
    }
    if (found) break
  }

  if (!found) {
    console.warn('No start position (tile type 4) found in dungeonMap, using default (1,1)')
  }

  // Return the start position with default direction
  const result = { x: startX, y: startY, direction: 0 } // direction: 0=North, 1=East, 2=South, 3=West
  console.log('Returning start position:', result)
  return result
}

// Get the tile at a specific position (compatible with the engine)
export const getTile = (x, y) => {
  if (y >= 0 && y < dungeonMap.length && x >= 0 && x < dungeonMap[y].length) {
    return dungeonMap[y][x]
  }
  return 0 // Return wall if out of bounds
}

// Check if a position is walkable (compatible with the engine)
export const isWalkable = (x, y) => {
  const tile = getTile(x, y)
  // Floor tiles, door tiles, and start position are walkable
  return tile === 1 || tile === TILE_TYPES.DOOR || tile === 4
}

// Check if a position is a door (compatible with the engine)
export const isDoor = (x, y) => {
  return getTile(x, y) === TILE_TYPES.DOOR
}

// Logic to open a door (compatible with the engine)
export const openDoor = (x, y) => {
  // Ensure we're working with integer coordinates
  const doorX = Math.floor(x)
  const doorY = Math.floor(y)

  if (doorY >= 0 && doorY < dungeonMap.length && doorX >= 0 && doorX < dungeonMap[doorY].length) {
    // Check if it's a door tile
    if (dungeonMap[doorY][doorX] === TILE_TYPES.DOOR) {
      // Convert the door to a floor tile (open door is just floor)
      dungeonMap[doorY][doorX] = TILE_TYPES.FLOOR
      console.log('Opened door at position:', doorX, doorY)
      return true
    }
  }
  return false
}

// Get the room data for the full map
export const getRoomData = () => {
  return roomData
}

// Export the dungeon map
export { dungeonMap }
