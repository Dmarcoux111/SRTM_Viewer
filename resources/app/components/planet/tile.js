const THREE = require( 'three' )

// const BoundsHelper = require( './boundsHelper.js' )
const vertexShader = require( './vertexShader.js' )
const fragmentShader = require( './fragmentShader.js' )

const shading_dictionary = require( './shadingDictionary.js' )

class Tile extends THREE.Mesh {
  constructor( parent, statistics, heightmap, r, s, d ) {
    super(
        parent.geometry,
        new THREE.ShaderMaterial( {
          vertexShader,
          fragmentShader,
          defines: {
            projection: store.getState().planet.projection === '3D' ? 3 : 1,
            shading: shading_dictionary[ store.getState().planet.shading ],
            raycasting: false,
          },
          uniforms: Object.assign( {}, parent.uniforms, {
            heightmap: {
              type: 't',
              value: new THREE.DataTexture(
                  new Float32Array( heightmap ),
                  256, 256, THREE.AlphaFormat, THREE.FloatType,
              ),
            },
            r: {
              type: 'f',
              value: r,
            },
            s: {
              type: 'f',
              value: s,
            },
            d: {
              type: 'f',
              value: d,
            },
          } ),
          side: THREE.DoubleSide,
          wireframe: false,
        } ),
    )
    this.statistics = statistics
    this.frustumCulled = false
    this.drawMode = THREE.TriangleStripDrawMode
    this.name = `${parent.name}_${r}_${s}_${d}`
    this.tiles = []
    this.bounds = parent.header.bounds / 2**d
    this.d = d
    this.r = r
    this.s = s

    //  TODO ( VALIDATE )  /////////////////////////////////////////////////////
    const imageCenter = {
      x: r + ( this.bounds / 2 ),
      y: s + ( this.bounds / 2 ),
    }
    const length = ( ( this.bounds / parent.header.bounds ) * 512 ) / 2
    const radius = Math.sqrt( length**2 + length**2 )
    const center = new THREE.Vector3(
        ( imageCenter.x / parent.header.bounds ) * 512 - 256,
        ( imageCenter.y / parent.header.bounds ) * 512 - 256,
        0 + ( statistics.mean * ( 180. / 6378137. ) ),
    )
    this.boundingSphere = new THREE.Sphere(
        center,
        radius,
    )
    // const centerHelper = new THREE.Mesh(
    //     new THREE.SphereBufferGeometry( radius, 8, 8 ),
    //     // new THREE.SphereBufferGeometry( 1, 8, 8 ),
    //     new THREE.MeshBasicMaterial( {
    //       color: 0xffffff,
    //       wireframe: true,
    //     } ),
    // )
    // centerHelper.position.set( center.x, center.y, center.z )
    // centerHelper.name = this.name + '_centerHelper'
    // centerHelper.visible = false
    // parent.add( centerHelper )
    // const boundsHelper = new BoundsHelper( radius, center )
    // boundsHelper.name = this.name + '_boundsHelper'
    // boundsHelper.visible = false
    // parent.add( boundsHelper )
    //  ////////////////////////////////////////////////////////////////////////
    this.visible = false
  }
}

module.exports = Tile
