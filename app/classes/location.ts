import * as THREE from 'three'

export type LonLat = { latitude: number; longitude: number }

export type GeoPosition = {
  lonlat: LonLat
  pos: THREE.Vector3
}

const zero = () => ({ lonlat: { latitude: 0, longitude: 9 }, pos: new THREE.Vector3() })

export class GeoLocation {
  id: number
  location: LonLat
  pos1: GeoPosition
  pos2: GeoPosition
  scale: number
  constructor() {
    this.location = { latitude: 0, longitude: 0 }
    this.pos1 = zero()
    this.pos2 = zero()
    this.scale = 2.0
    this.id = 0
  }

  setLocation(latitude: number | null, longitude: number | null) {
    if (latitude == null || longitude == null) {
      return
    }
    this.location.latitude = latitude
    this.location.longitude = longitude
  }

  calcCurrentPosition() {
    const { latitude, longitude } = this.location
    if (latitude == null || longitude == null) {
      console.log('Failed to calc position:Latitude or Longitude is Null')
      return new THREE.Vector3(-1, -1, -1)
    }
    const latLength = this.pos1.lonlat.latitude - this.pos2.lonlat.latitude
    const longLength = this.pos1.lonlat.longitude - this.pos2.lonlat.longitude
    const xLength = this.pos1.pos.x - this.pos2.pos.x
    const zLength = this.pos1.pos.z - this.pos2.pos.z
    const w11lat = this.pos2.lonlat.latitude
    const w11long = this.pos2.lonlat.longitude
    const w11x = this.pos2.pos.x
    const w11z = this.pos2.pos.z
    let position = new THREE.Vector3()
    // position.y = (this.pos2.pos.y + this.pos1.pos.y) / 2
    position.y = this.scale / 2.0
    position.z = ((latitude - w11lat) / latLength) * zLength + w11z
    position.x = ((longitude - w11long) / longLength) * xLength + w11x
    return position
  }
}
