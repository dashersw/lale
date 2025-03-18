<!-- MapViewer.vue - Component for viewing the map data -->
<template>
  <div class="map-viewer">
    <h2>Lale Map Viewer</h2>

    <div class="container">
      <div class="controls">
        <button @click="loadMap" class="button">Reload Map</button>
        <p class="status">{{ status }}</p>

        <h3>Room List</h3>
        <select v-model="selectedRoomIndex" size="15" class="room-list">
          <option v-for="(room, index) in roomData" :key="index" :value="index">Room {{ index + 1 }}</option>
        </select>

        <div v-if="selectedRoom" class="room-details">
          <h3>Room Details</h3>
          <div>Top Wall: {{ getWallDescription(selectedRoom.topType, selectedRoom.topWall) }}</div>
          <div>Right Wall: {{ getWallDescription(selectedRoom.rightType, selectedRoom.rightWall) }}</div>
          <div>Bottom Wall: {{ getWallDescription(selectedRoom.bottomType, selectedRoom.bottomWall) }}</div>
          <div>Left Wall: {{ getWallDescription(selectedRoom.leftType, selectedRoom.leftWall) }}</div>
          <div>Floor Type: {{ getFloorDescription(selectedRoom.floorType) }}</div>
          <div>Ceiling Type: {{ getCeilingDescription(selectedRoom.ceilingType) }}</div>
        </div>
      </div>

      <div class="display">
        <canvas ref="canvas" width="500" height="500" class="map-canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { loadMapFromFile, getRoomData } from '../game/map.js'

export default {
  name: 'MapViewer',
  data() {
    return {
      roomData: [],
      selectedRoomIndex: -1,
      status: 'Map not loaded',
      canvasCtx: null
    }
  },
  computed: {
    selectedRoom() {
      if (this.selectedRoomIndex >= 0 && this.selectedRoomIndex < this.roomData.length) {
        return this.roomData[this.selectedRoomIndex]
      }
      return null
    }
  },
  mounted() {
    this.initCanvas()
    this.loadMap()
  },
  methods: {
    async loadMap() {
      this.status = 'Loading map data...'
      try {
        const success = await loadMapFromFile('/1.txt')
        if (success) {
          this.roomData = getRoomData()
          this.status = `Loaded ${this.roomData.length} rooms from map`
          this.drawDungeon()
          if (this.roomData.length > 0) {
            this.selectedRoomIndex = 0
          }
        } else {
          this.status = 'Failed to load map'
        }
      } catch (error) {
        console.error('Error loading map:', error)
        this.status = `Error: ${error.message}`
      }
    },
    initCanvas() {
      const canvas = this.$refs.canvas
      if (canvas) {
        this.canvasCtx = canvas.getContext('2d')
      }
    },
    drawDungeon() {
      if (!this.canvasCtx) return // Don't try to draw if no canvas context

      // Clear canvas
      this.canvasCtx.clearRect(0, 0, 500, 500)

      if (this.roomData.length === 0) {
        // Draw a message that no rooms were found
        this.canvasCtx.fillStyle = 'black'
        this.canvasCtx.font = 'bold 14px Arial'
        this.canvasCtx.textAlign = 'center'
        this.canvasCtx.textBaseline = 'middle'
        this.canvasCtx.fillText('No room data available', 250, 250)
        return
      }

      // Dungeon is always 10x10
      const dungeonSize = 10
      const canvasWidth = 500
      const canvasHeight = 500

      // Calculate room size to fill the canvas
      const roomSize = Math.floor(Math.min(canvasWidth, canvasHeight) / dungeonSize) - 1
      const margin = 1

      // Calculate starting position to center the grid
      const startX = (canvasWidth - dungeonSize * (roomSize + margin)) / 2
      const startY = (canvasHeight - dungeonSize * (roomSize + margin)) / 2

      console.log(`Drawing map with ${this.roomData.length} rooms, grid size: ${dungeonSize}x${dungeonSize}`)

      // Draw all 100 positions in the 10x10 grid
      for (let i = 0; i < dungeonSize; i++) {
        for (let j = 0; j < dungeonSize; j++) {
          const roomIndex = i * dungeonSize + j

          // Room coordinates on the canvas
          const x = startX + j * (roomSize + margin)
          const y = startY + i * (roomSize + margin)

          // Always draw the room space
          this.canvasCtx.fillStyle = 'rgb(50, 50, 50)' // Default background for all cells
          this.canvasCtx.fillRect(x, y, roomSize, roomSize)

          // Always draw the room number
          this.canvasCtx.fillStyle = 'white'
          this.canvasCtx.font = 'bold 10px Arial'
          this.canvasCtx.textAlign = 'center'
          this.canvasCtx.textBaseline = 'middle'
          this.canvasCtx.fillText((roomIndex + 1).toString(), x + roomSize / 2, y + roomSize / 2)

          // If we have data for this room, draw its details
          if (roomIndex < this.roomData.length) {
            const room = this.roomData[roomIndex]

            // Fill with the ceiling color (but ensure we can still see the room number)
            const ceilingColor = this.getCeilingColor(room.ceilingType)
            this.canvasCtx.fillStyle = ceilingColor
            this.canvasCtx.fillRect(x, y, roomSize, roomSize)

            // Draw walls if they exist
            this.drawWall(x, y, x + roomSize, y, room.topWall, room.topType)
            this.drawWall(x + roomSize, y, x + roomSize, y + roomSize, room.rightWall, room.rightType)
            this.drawWall(x, y + roomSize, x + roomSize, y + roomSize, room.bottomWall, room.bottomType)
            this.drawWall(x, y, x, y + roomSize, room.leftWall, room.leftType)

            // Redraw the room number with the floor color for better visibility
            this.canvasCtx.fillStyle = this.getFloorColor(room.floorType)
            this.canvasCtx.fillText((roomIndex + 1).toString(), x + roomSize / 2, y + roomSize / 2)
          }

          // Highlight the selected room if applicable
          if (roomIndex === this.selectedRoomIndex) {
            this.canvasCtx.strokeStyle = 'yellow'
            this.canvasCtx.lineWidth = 2
            this.canvasCtx.strokeRect(x, y, roomSize, roomSize)
          }
        }
      }
    },
    drawWall(x1, y1, x2, y2, wallExists, wallType) {
      if (!wallExists) return

      this.canvasCtx.lineWidth = 2

      switch (wallType) {
        case 2:
          this.canvasCtx.strokeStyle = 'black' // Wall
          break
        case 3:
          this.canvasCtx.strokeStyle = 'green' // Door
          break
        case 4:
          this.canvasCtx.strokeStyle = 'red' // Main Exit
          break
        default:
          this.canvasCtx.strokeStyle = 'blue' // Unknown
          break
      }

      this.canvasCtx.beginPath()
      this.canvasCtx.moveTo(x1, y1)
      this.canvasCtx.lineTo(x2, y2)
      this.canvasCtx.stroke()
    },
    getFloorColor(floorType) {
      switch (floorType) {
        case 1:
          return 'black'
        case 2:
          return 'blue'
        case 3:
          return 'green'
        case 4:
          return 'red'
        default:
          return 'darkslategray'
      }
    },
    getCeilingColor(ceilingType) {
      switch (ceilingType) {
        case 1:
          return 'lightgray' // Stone Floor
        case 2:
          return 'brown' // Wooden Floor
        case 3:
          return 'darkgray' // Unknown Floor
        case 4:
          return 'sandybrown' // Broken Wooden Floor
        default:
          return 'white' // Empty
      }
    },
    getWallDescription(type, exists) {
      if (!exists) return 'None (Open)'

      switch (type) {
        case 2:
          return 'Wall'
        case 3:
          return 'Door'
        case 4:
          return 'Main Exit'
        default:
          return `Unknown (${type})`
      }
    },
    getFloorDescription(type) {
      switch (type) {
        case 1:
          return 'Black'
        case 2:
          return 'Blue'
        case 3:
          return 'Green'
        case 4:
          return 'Red'
        default:
          return `Unknown (${type})`
      }
    },
    getCeilingDescription(type) {
      switch (type) {
        case 1:
          return 'Stone'
        case 2:
          return 'Wooden'
        case 3:
          return 'Dark'
        case 4:
          return 'Broken Wooden'
        default:
          return `Unknown (${type})`
      }
    }
  },
  watch: {
    selectedRoomIndex() {
      this.drawDungeon()
    }
  }
}
</script>

<style scoped>
.map-viewer {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.controls {
  flex: 1;
  min-width: 300px;
}

.display {
  flex: 2;
  min-width: 400px;
}

.room-list {
  width: 100%;
  height: 300px;
  margin-top: 10px;
}

.map-canvas {
  border: 1px solid #ccc;
  background-color: white;
}

.button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 10px;
}

.button:hover {
  background-color: #45a049;
}

.status {
  margin-top: 10px;
  color: #555;
  font-style: italic;
}

.room-details {
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
}
</style>
