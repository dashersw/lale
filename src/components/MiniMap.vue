<template>
  <div class="minimap-container">
    <canvas ref="minimapCanvas" :width="canvasSize" :height="canvasSize" class="minimap-canvas"></canvas>
    <div v-if="error" class="minimap-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { dungeonMap, getRoomData } from '../game/map.js'

const props = defineProps({
  playerX: {
    type: Number,
    required: true
  },
  playerY: {
    type: Number,
    required: true
  },
  playerDirection: {
    type: Number,
    required: true
  }
})

const minimapCanvas = ref(null)
const isMobile = ref(false)

// Compute canvas size based on device type
const canvasSize = computed(() => (isMobile.value ? 120 : 180))

const error = ref('')

// Colors for different tile types
const COLORS = {
  WALL: '#555555',
  FLOOR: '#999999',
  DOOR: '#8B4513',
  SPECIAL_FLOOR: '#FFD700',
  PLAYER: '#FF0000',
  BACKGROUND: '#000000'
}

// Check if device is mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// Draw the minimap
const drawMinimap = () => {
  try {
    const canvas = minimapCanvas.value
    if (!canvas) {
      error.value = 'Canvas element not found'
      console.error('MiniMap: Canvas element not found')
      return
    }

    // Update canvas size based on mobile status
    canvas.width = canvasSize.value
    canvas.height = canvasSize.value

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      error.value = 'Failed to get canvas context'
      console.error('MiniMap: Failed to get canvas context')
      return
    }

    // Clear the canvas
    ctx.fillStyle = COLORS.BACKGROUND
    ctx.fillRect(0, 0, canvasSize.value, canvasSize.value)

    // Get room data from the map.js
    const rooms = getRoomData()

    // Dungeon is always 10x10 rooms
    const dungeonSize = 10

    // Check if we have room data
    if (!rooms || rooms.length === 0) {
      error.value = 'No room data available'
      return
    }

    // Calculate room size to fit the canvas
    const roomSize = Math.floor(canvasSize.value / dungeonSize)
    const margin = 1

    // Calculate starting position to center the grid
    const startX = (canvasSize.value - dungeonSize * roomSize) / 2
    const startY = (canvasSize.value - dungeonSize * roomSize) / 2

    // Draw all 100 positions in the 10x10 grid
    for (let i = 0; i < dungeonSize; i++) {
      for (let j = 0; j < dungeonSize; j++) {
        const roomIndex = i * dungeonSize + j

        // Room coordinates on the canvas
        const x = startX + j * roomSize
        const y = startY + i * roomSize

        // Always draw the room space with default background
        ctx.fillStyle = COLORS.BACKGROUND // Black background for empty rooms
        ctx.fillRect(x, y, roomSize, roomSize)

        // If we have data for this room, draw its details
        if (roomIndex < rooms.length) {
          const room = rooms[roomIndex]

          // Fill based on floor type
          if (room.floorType === 3) {
            ctx.fillStyle = COLORS.SPECIAL_FLOOR // Special floors (gold)
          } else {
            ctx.fillStyle = COLORS.FLOOR // Regular floor (gray)
          }
          ctx.fillRect(x, y, roomSize, roomSize)

          // Wall thickness
          const wallThickness = Math.max(1, Math.floor(roomSize / 10))

          // Draw walls if they exist
          // Top wall
          if (room.topWall) {
            ctx.fillStyle = room.topType === 3 ? COLORS.DOOR : COLORS.WALL
            ctx.fillRect(x, y, roomSize, wallThickness)
          }

          // Right wall
          if (room.rightWall) {
            ctx.fillStyle = room.rightType === 3 ? COLORS.DOOR : COLORS.WALL
            ctx.fillRect(x + roomSize - wallThickness, y, wallThickness, roomSize)
          }

          // Bottom wall
          if (room.bottomWall) {
            ctx.fillStyle = room.bottomType === 3 ? COLORS.DOOR : COLORS.WALL
            ctx.fillRect(x, y + roomSize - wallThickness, roomSize, wallThickness)
          }

          // Left wall
          if (room.leftWall) {
            ctx.fillStyle = room.leftType === 3 ? COLORS.DOOR : COLORS.WALL
            ctx.fillRect(x, y, wallThickness, roomSize)
          }
        }
      }
    }

    // Calculate player's room and position
    // Get the actual tile size (each room is 3x3 tiles)
    const tileSize = 3
    const playerRoomX = Math.floor(props.playerX / tileSize)
    const playerRoomY = Math.floor(props.playerY / tileSize)

    // Calculate position within the room (0-1 range)
    const playerInRoomX = (props.playerX % tileSize) / tileSize
    const playerInRoomY = (props.playerY % tileSize) / tileSize

    // Calculate pixel position in the minimap
    const playerPixelX = startX + (playerRoomX + playerInRoomX) * roomSize
    const playerPixelY = startY + (playerRoomY + playerInRoomY) * roomSize

    // Draw the player
    ctx.fillStyle = COLORS.PLAYER
    const playerSize = Math.max(3, roomSize / 6)
    ctx.beginPath()
    ctx.arc(playerPixelX, playerPixelY, playerSize, 0, Math.PI * 2)
    ctx.fill()

    // Draw direction indicator
    ctx.strokeStyle = COLORS.PLAYER
    ctx.lineWidth = Math.max(2, roomSize / 12)
    ctx.beginPath()
    ctx.moveTo(playerPixelX, playerPixelY)

    const directionLength = roomSize / 2

    // Convert continuous direction value to a vector
    const directionAngle = props.playerDirection * (Math.PI / 2)
    const endX = playerPixelX + Math.sin(directionAngle) * directionLength
    const endY = playerPixelY - Math.cos(directionAngle) * directionLength

    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Clear any previous error
    error.value = ''
  } catch (err) {
    error.value = `Error rendering minimap: ${err.message}`
    console.error('MiniMap: Error rendering minimap:', err)
  }
}

// Watch for player position changes and redraw the minimap
watch(() => [props.playerX, props.playerY, props.playerDirection, isMobile.value], drawMinimap, { immediate: true })

// Draw the initial minimap when the component is mounted
onMounted(() => {
  console.log('MiniMap component mounted')

  // Check if device is mobile
  checkMobile()

  // Add resize listener to update mobile status
  window.addEventListener('resize', () => {
    checkMobile()
    drawMinimap()
  })

  drawMinimap()
})
</script>

<style scoped>
.minimap-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border: 2px solid #555;
  border-radius: 5px;
  padding: 5px;
  z-index: 5;
}

/* Mobile styles for minimap */
@media (max-width: 768px) {
  .minimap-container {
    top: 15px; /* Position at top right */
    right: 15px;
    bottom: auto;
    padding: 3px;
    border-width: 1px;
  }
}

/* Smaller phones */
@media (max-width: 480px) {
  .minimap-container {
    top: 10px;
    right: 10px;
    bottom: auto;
  }
}

.minimap-canvas {
  display: block;
  background-color: #000;
}

.minimap-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 5px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  text-align: center;
  z-index: 6;
}

/* Mobile error message */
@media (max-width: 768px) {
  .minimap-error {
    padding: 3px;
    font-size: 8px;
  }
}
</style>
