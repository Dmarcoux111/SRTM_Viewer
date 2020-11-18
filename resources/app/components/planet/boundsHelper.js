const THREE = require( 'three' )

class BoundsHelper extends THREE.AxesHelper {
  constructor( bounds, origin ) {
    super( bounds )
    const positions = this._getPositions( bounds )
    const colors = this._getColors( bounds )
    this.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) )
    this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
    this.position.set( origin.x, origin.y, origin.z )
    this.frustumCulled = false
  }

  _getPositions( bounds ) {
    return [
      //  x
      -bounds, 0, 0, bounds, 0, 0,
      // 0, bounds, 0, bounds, bounds, 0,
      // 0, bounds, bounds, bounds, bounds, bounds,
      // 0, 0, bounds, bounds, 0, bounds,

      //  y
      0, -bounds, 0, 0, bounds, 0,
      // 0, 0, bounds, 0, bounds, bounds,
      // bounds, 0, 0, bounds, bounds, 0,
      // bounds, 0, bounds, bounds, bounds, bounds,

      //  z
      0, 0, -bounds, 0, 0, bounds,
      // bounds, 0, 0, bounds, 0, bounds,
      // 0, bounds, 0, 0, bounds, bounds,
      // bounds, bounds, 0, bounds, bounds, bounds,
    ]
  }

  _getColors() {
    return [
      //  x
      1, 0.26, 0.26, 1, 0.26, 0.26,
      // 1, 0.26, 0.26, 1, 0.26, 0.26,
      // 1, 0.26, 0.26, 1, 0.26, 0.26,
      // 1, 0.26, 0.26, 1, 0.26, 0.26,

      //  y
      0, 0.78, 0.32, 0, 0.78, 0.32,
      // 0, 0.78, 0.32, 0, 0.78, 0.32,
      // 0, 0.78, 0.32, 0, 0.78, 0.32,
      // 0, 0.78, 0.32, 0, 0.78, 0.32,

      //  z
      0.25, .60, 1, 0.25, .60, 1,
      // 0.25, .60, 1, 0.25, .60, 1,
      // 0.25, .60, 1, 0.25, .60, 1,
      // 0.25, .60, 1, 0.25, .60, 1,
    ]
  }
}

module.exports = BoundsHelper
