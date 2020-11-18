const path = require( 'path' )
const styles = path.join( __dirname, 'styles.css' )
const Stats = require( 'three/examples/js/libs/stats.min.js' )
const Planet = require( '../planet/planet.js' )
// const BoundsHelper = require( './boundsHelper.js' )
const THREE = require( 'three' )
require( './orbitControls.js' )( THREE )

class Renderer extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow( {
      mode: 'open',
    } )
    this.component = document.createElement( 'div' )
    this.component.id = 'renderer'
    this.component.innerHTML = `
      <link rel="stylesheet" href="${styles}"></link>
      <debug-component id='debug-component'></debug-component>

    `
    root.appendChild( this.component )
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback( name, old, change ) {
  }

  connectedCallback() {
    this.debugComponent = this.shadowRoot.getElementById( 'debug-component' )
    const state = store.getState().renderer
    this.frustum = new THREE.Frustum()
    this.renderer = new THREE.WebGLRenderer( {
      antialias: true,
      logarithmicDepthBuffer: true,
    } )
    const { width, height } = document.body.getBoundingClientRect()
    this.renderer.setSize( width, height )
    this.renderer.setPixelRatio( window.devicePixelRatio )
    this.renderer.setClearColor( 0x000000, 1.0 )
    this.component.appendChild( this.renderer.domElement )
    this.scene = new THREE.Scene()
    this.perspectiveCamera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        4096,
    )
    this.perspectiveCamera.up.set( 0, 0, 1 )
    this.perspectiveCamera.position.set(
        0,
        -180,
        -180 + 360,
    )
    this.perspectiveCamera.updateProjectionMatrix()

    this.orbitControls = new THREE.OrbitControls( this.perspectiveCamera, this.renderer.domElement )
    this.orbitControls.enableRotate = true
    this.orbitControls.screenSpacePanning = false
    this.orbitControls.zoomSpeed = 2
    this.orbitControls.target.set(
        0,
        0,
        0,
    )
    this.orbitControls.update()
    this.stats = new Stats()
    this.stats.dom.style.display = state.developerTools ? 'block' : 'none'
    this.component.appendChild( this.stats.dom )

    const handleResize = this._handleResize.bind( this )
    window.addEventListener( 'resize', handleResize )

    // this.boundsHelper = new BoundsHelper( 512, { x: 0, y: 0, z: 0 } )
    // this.scene.add( this.boundsHelper )
    this.planet = new Planet( this.renderer, this.scene, this.perspectiveCamera, this.orbitControls )
    window.planet = this.planet
    this.scene.add( this.planet )

    const handleRaycast = this._handleRaycast.bind( this )
    document.body.addEventListener( 'click', handleRaycast )

    this._render()

    this.unsubscribe = store.subscribe( () => {
      const {
        lastAction,
        renderer,
      } = store.getState()

      switch ( lastAction.type ) {
        case types.TOGGLE_DEVELOPER_TOOLS:
          this.stats.dom.style.display = renderer.developerTools ? 'block' : 'none'
          break
        default:
      }
    } )

    this.intervalID = setInterval( () => {
      // console.log( this.planet )
      const { geometries, textures } = this.renderer.info.memory
      const { triangles } = this.renderer.info.render
      const shaders = this.renderer.info.programs.length
      const cached = this.planet.cache.keys().length
      const tiles = this.planet.children.length

      this.debugComponent.update( {
        geometries,
        textures,
        triangles,
        shaders,
        cached,
        tiles,
      } )
    }, 1000 )
  }

  disconnectedCallback() {
    window.removeEventListener( 'resize', this._handleResize )
    document.body.removeEventListener( 'click', this._handleRaycast )
    clearInterval( this.intervalID )
  }

  _handleRaycast( event ) {
    store.dispatch( actions.raycast( this.planet.raycast( event.clientX, event.clientY ) ) )
  }

  _handleResize() {
    const { width, height } = document.body.getBoundingClientRect()
    this.perspectiveCamera.aspect = width / height
    this.perspectiveCamera.updateProjectionMatrix()
    this.renderer.setSize( width, height )
  }

  _render() {
    requestAnimationFrame( () => {
      this._render()
    } )
    this.frustum.setFromMatrix(
        new THREE.Matrix4().multiplyMatrices(
            this.perspectiveCamera.projectionMatrix,
            this.perspectiveCamera.matrixWorldInverse,
        ),
    )
    this.renderer.render( this.scene, this.perspectiveCamera )
    this.stats.update()
  }
}

module.exports = Renderer
