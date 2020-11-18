const THREE = require( 'three' )
const LRU = require( 'lru-cache' )
const path = require( 'path' )
const generateGradientTexture = require( './generateGradientTexture.js' )
const { ipcRenderer } = require( 'electron' )
const shading_dictionary = require( './shadingDictionary.js' )

const Tile = require( './tile.js' )

class Planet extends THREE.Group {
  constructor( renderer, scene, camera, controls ) {
    super()
    this.shading = store.getState().planet.shading
    this.projection = store.getState().planet.projection
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.frustum = new THREE.Frustum()
    this.frustumCulled = false
    this.busy = false
    this.name = 'Earth'
    this.queue = []
    this.tiles = {}
    this.root = null
    this.geometry = this._generateGeometry( 256 )
    //  Raycasting
    const { width, height } = document.body.getBoundingClientRect( new THREE.Vector2() )
    this.renderBuffer = new THREE.WebGLRenderTarget( width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    } )
    this.raycastBuffer = new Float32Array( width * height * 4 )
    this.unsubscribe = store.subscribe( () => {
      const {
        lastAction,
        planet,
      } = store.getState()

      switch ( lastAction.type ) {
        case 'UPDATE_PROJECTION':
        case 'UPDATE_SHADING': {
          this._updateDefines( planet )
          break
        }
        default:
      }
    } )
    this.uniforms = {
      landGradient: {
        type: 't',
        value: generateGradientTexture( 'EARTH_TONES' ),
      },
      seaGradient: {
        type: 't',
        value: generateGradientTexture( 'ICE' ),
      },
      lodGradient: {
        type: 't',
        value: generateGradientTexture( 'RAINBOW' ),
      },
      colorTexture: {
        type: 't',
        value: new THREE.TextureLoader().load( path.join( __dirname, './maps', 'color.jpg' ) ),
      },
    }
    this.cache = new LRU( {
      max: 25, //  * 4 children
      noDisposeOnSet: true,
      dispose: ( key, tiles ) => {
        this._deleteTiles( key, tiles )
      },
    } )

    this.worker = new Worker( './components/planet/worker.js' )

    const handleWorkerResponse = this._handleWorkerResponse.bind( this )
    this.worker.onmessage = handleWorkerResponse

    const updateRaycastingTexture = this._updateRaycastingTexture.bind( this )
    this.controls.addEventListener( 'end', updateRaycastingTexture )

    this._render()

    this.load( store.getState().planet.map )
  }

  load( file ) {
    ipcRenderer.send( 'GET_MAP_HEADER', file )
    ipcRenderer.once( 'GET_MAP_HEADER', ( event, result ) => {
      this.header = result
      this.uniforms.lodRange = {
        type: 'v2',
        value: new THREE.Vector2(
            0,
            result.levels,
        ),
      }
      this.uniforms.bounds = {
        type: 'f',
        value: result.bounds,
      }
      const job = {
        type: 'INIT',
        header: this.header,
      }
      this.queue.push( job )
    } )
  }

  raycast( clientX, clientY ) {
    const width = Math.floor( document.body.getBoundingClientRect().width )
    const height = Math.floor( document.body.getBoundingClientRect().height )
    const r = this.raycastBuffer[ ( ( height - clientY ) * width * 4 ) + ( clientX * 4 ) + 0 ]
    const g = this.raycastBuffer[ ( ( height - clientY ) * width * 4 ) + ( clientX * 4 ) + 1 ]
    const b = this.raycastBuffer[ ( ( height - clientY ) * width * 4 ) + ( clientX * 4 ) + 2 ]
    const a = Math.round( this.raycastBuffer[ ( ( height - clientY ) * width * 4 ) + ( clientX * 4 ) + 3 ] )
    return { r, g, b, a }
  }

  _updateRaycastingTexture() {
    const { width, height } = document.body.getBoundingClientRect()

    this.renderBuffer.dispose()
    this.renderBuffer = new THREE.WebGLRenderTarget( width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    } )

    this.raycastBuffer = new Float32Array( width * height * 4 )
    for ( const name in this.tiles ) {
      const tile = this.tiles[ name ]
      tile.material.defines.raycasting = true
      tile.material.needsUpdate = true
    }

    this.renderer.setRenderTarget( this.renderBuffer )
    this.renderer.render( this.scene, this.camera )
    this.renderer.readRenderTargetPixels( this.renderBuffer, 0, 0, width, height, this.raycastBuffer )
    this.renderer.setRenderTarget( null )

    for ( const name in this.tiles ) {
      const tile = this.tiles[ name ]
      tile.material.defines.raycasting = false
      tile.material.needsUpdate = true
    }
  }

  _updateDefines( planet ) {
    this.projection = planet.projection
    this.shading = planet.shading
    for ( const key in this.tiles ) {
      const tile = this.tiles[ key ]
      tile.material.defines[ 'projection' ] = this.projection === '2.5D' ? 1 : 3
      tile.material.defines[ 'shading' ] = shading_dictionary[ planet.shading ]
      tile.material.needsUpdate = true
    }
    this.cache.forEach( ( children, key ) => {
      for ( const tile of children ) {
        tile.material.defines[ 'projection' ] = this.projection === '2.5D' ? 1 : 3
        tile.material.defines[ 'shading' ] = shading_dictionary[ planet.shading ]
        tile.material.needsUpdate = true
      }
    } )
  }

  _deleteTiles( key, tiles ) {
    if ( tiles ) {
      for ( let i = 0; i < tiles.length; i++ ) {
        const tile = tiles[ i ]
        tile.material.uniforms.heightmap.value.dispose()
        tile.material.dispose()
        tile.geometry.dispose()
        this.remove( tile )
        // const boundsHelper = this.getObjectByName( tile.name + '_boundsHelper' )
        // boundsHelper.material.dispose()
        // boundsHelper.geometry.dispose()
        // this.remove( boundsHelper )
        // const centerHelper = this.getObjectByName( tile.name + '_centerHelper' )
        // centerHelper.material.dispose()
        // centerHelper.geometry.dispose()
        // this.remove( centerHelper )
        console.log( 'delete:', tile.name )
      }
    }
  }

  _handleWorkerResponse( event ) {
    switch ( event.data.type ) {
      case types.UPDATE_PROGRESS: {
        store.dispatch( actions.updateProgress( event.data ) )
        break
      }
      case types.INIT_RESPONSE: {
        this.statistics = event.data.statistics
        this.uniforms.elevationRange = {
          type: 't',
          value: new THREE.Vector2(
              this.statistics.mean - 1.5 * this.statistics.standardDeviation,
              this.statistics.mean + 2 * this.statistics.standardDeviation,
          ),
        }
        this.uniforms.minZ = {
          type: 'f',
          value: this.statistics.min,
        }
        const heightmap = new Int16Array( event.data.transferrable )
        const r = 0
        const s = 0
        const d = 0
        const name = `${this.name}_${r}_${s}_${d}`
        console.log( 'Initialized Map:', this )
        console.log( 'Add:', name )
        this.tiles[ name ] = new Tile( this, this.statistics, heightmap, r, s, d )
        this.add( this.tiles[ name ] )
        this.root = this.tiles[ name ]
        this.busy = false
        this._render()
        this._updateRaycastingTexture()
        break
      }
      case types.REFINE_RESPONSE: {
        const {
          parent,
          transferrableMatrix,
        } = event.data
        const tiles = []
        for ( const child of parent.tiles ) {
          const {
            name,
            transferrableIndex,
            statistics,
            r,
            s,
            d,
          } = child
          tiles.push( name )
          const heightmap = new Float32Array( transferrableMatrix[ transferrableIndex ] )
          console.log( 'Add:', name )
          this.tiles[ name ] = new Tile( this, statistics, heightmap, r, s, d )
          this.add( this.tiles[ name ] )
        }
        this.tiles[ parent.name ].tiles = tiles
        this.busy = false
        this._render()
        break
      }
      default:
        console.error( event.data )
    }
  }

  _cacheTiles( parent ) {
    if ( !this.cache.has( parent.name ) ) {
      const children = []
      for ( const name of parent.tiles ) {
        const child = this.tiles[ name ]
        this._cacheTiles( child )
        child.visible = false
        // this.getObjectByName( child.name + '_boundsHelper' ).visible = false
        // this.getObjectByName( child.name + '_centerHelper' ).visible = false
        delete this.tiles[ child.name ]
        console.log( 'cache:', child.name )
        children.push( child )
      }
      parent.tiles = []
      this.cache.set( parent.name, children )
    }
  }

  _getScreenSpaceError( d, bounds, distance, camera ) {
    const pixels = ( bounds / 2**d ) * 2 //  512 pixels
    const fovRadians = camera.fov * Math.PI / 180
    const error = ( pixels / 2**d ) / ( 2 * distance * Math.tan( fovRadians / 2 ) )
    return error
  }

  _getRequest( name ) {
    const tile = this.tiles[ name ]
    let boundingSphere = tile.boundingSphere
    // this.getObjectByName( tile.name + '_boundsHelper' ).position.set(
    //     boundingSphere.center.x,
    //     boundingSphere.center.y,
    //     boundingSphere.center.z,
    // )
    // this.getObjectByName( tile.name + '_centerHelper' ).position.set(
    //     boundingSphere.center.x,
    //     boundingSphere.center.y,
    //     boundingSphere.center.z,
    // )
    if ( this.projection === '3D' ) {
      const height = tile.statistics.mean * ( 180. / 6378137. )
      const longitude = ( tile.boundingSphere.center.x ) * Math.PI / 180
      const latitude = ( tile.boundingSphere.center.y ) * Math.PI / 180
      const radius = 180
      const x = ( radius + height ) * Math.cos( latitude ) * Math.cos( longitude )
      const y = ( radius + height ) * Math.cos( latitude ) * Math.sin( longitude )
      const z = ( radius + height ) * Math.sin( latitude )
      const center = new THREE.Vector3( x, y, z )
      boundingSphere = new THREE.Sphere(
          center,
          tile.boundingSphere.radius * 4,
      )
      // this.getObjectByName( tile.name + '_boundsHelper' ).position.set(
      //     boundingSphere.center.x,
      //     boundingSphere.center.y,
      //     boundingSphere.center.z,
      // )
      // this.getObjectByName( tile.name + '_centerHelper' ).position.set(
      //     boundingSphere.center.x,
      //     boundingSphere.center.y,
      //     boundingSphere.center.z,
      // )
    }
    if ( this.frustum.intersectsSphere( boundingSphere ) ) {
      let distance = Math.abs( this.camera.position.distanceTo(
          boundingSphere.center,
      ) ) - boundingSphere.radius
      if ( distance < 0 ) {
        distance = 1
      }
      const error = this._getScreenSpaceError( tile.d, this.header.bounds, distance, this.camera )
      if ( error < 5 || tile.d === this.header.levels ) {
      // if ( error < 5 || tile.d === 4 ) {
        tile.visible = true
        // this.getObjectByName( tile.name + '_boundsHelper' ).visible = true
        // this.getObjectByName( tile.name + '_centerHelper' ).visible = true
        if ( tile.tiles.length > 0 ) {
          this._cacheTiles( tile )
        }
        return null
      } else if ( tile.tiles.length === 0 ) {
        if ( this.cache.has( tile.name ) ) {
          const children = this.cache.get( tile.name )
          for ( let i = 0; i < children.length; i++ ) {
            const child = children[ i ]
            child.visible = true
            // this.getObjectByName( child.name + '_boundsHelper' ).visible = true
            // this.getObjectByName( child.name + '_centerHelper' ).visible = true
            tile.tiles.push( child.name )
            this.tiles[ child.name ] = child
            console.log( 'add from cache:', child.name )
          }
          this.cache.set( tile.name, null )
          this.cache.del( tile.name, null )
          tile.visible = false
          // this.getObjectByName( tile.name + '_boundsHelper' ).visible = false
          // this.getObjectByName( tile.name + '_centerHelper' ).visible = false
          return null
        } else {
          tile.visible = true
          // this.getObjectByName( tile.name + '_boundsHelper' ).visible = true
          // this.getObjectByName( tile.name + '_centerHelper' ).visible = true
          return tile.name
        }
      } else {
        tile.visible = false
        // this.getObjectByName( tile.name + '_boundsHelper' ).visible = false
        // this.getObjectByName( tile.name + '_centerHelper' ).visible = false
        for ( let i = 0; i < tile.tiles.length; i++ ) {
          const request = this._getRequest( tile.tiles[ i ] )
          if ( request ) {
            return request
          }
        }
        return null
      }
    } else {
      tile.visible = false
      // this.getObjectByName( tile.name + '_boundsHelper' ).visible = false
      // this.getObjectByName( tile.name + '_centerHelper' ).visible = false
      if ( tile.tiles.length > 0 ) {
        this._cacheTiles( tile )
      }
      return null
    }
  }

  _render() {
    this.frustum.setFromMatrix(
        new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse,
        ),
    )
    if ( !this.busy ) {
      if ( this.queue.length > 0 ) {
        this.busy = true
        const job = this.queue.shift()
        this.worker.postMessage( job )
      } else if ( this.visible && this.root ) {
        const request = this._getRequest( 'Earth_0_0_0' )
        if ( request ) {
          this.busy = true
          this.worker.postMessage( {
            type: 'REFINE',
            request,
          } )
        } else {
          requestAnimationFrame( () => {
            this._render()
          } )
        }
      } else {
        requestAnimationFrame( () => {
          this._render()
        } )
      }
    }
  }

  _generateGeometry( length ) {
    const geometry = new THREE.BufferGeometry()
    const positions = this._getPositions( length )
    const indices = this._getIndices( length )
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) )
    geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) )
    return geometry
  }

  _getPositions( length ) {
    const positions = []
    for ( let y = length; y >= 0; y-- ) {
      for ( let x = 0; x <= length; x++ ) {
        positions.push( x, y, 0 )
      }
    }
    return new Uint16Array( positions )
  }

  _getIndices( length ) {
    const indices = []
    for ( let j = 0; j < length; j++ ) {
      for ( let i = 0; i < length + 1; i++ ) {
        const triangle1 = j * ( length + 1 ) + i
        const triangle2 = ( j + 1 ) * ( length + 1 ) + i
        indices.push( triangle1 )
        indices.push( triangle2 )
        if ( i === length && j !== length - 1 ) {
          const degenerateTriangle = ( j + 1 ) * ( length + 1 ) + i
          indices.push( degenerateTriangle )
        }
      }
      if ( j !== length - 1 ) {
        const degenerateTriangle = ( j + 1 ) * ( length + 1 )
        indices.push( degenerateTriangle )
      }
    }
    return new Uint32Array( indices )
  }
}

module.exports = Planet
