const path = require( 'path' )
const styles = path.join( __dirname, 'styles.css' )

class Debug extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow( {
      mode: 'open',
    } )
    this.component = document.createElement( 'div' )
    this.component.id = 'debug'
    this.component.innerHTML = `
      <link rel="stylesheet" href="${styles}"></link>
      <div class='row'>Geometries:&nbsp;<span id='geometries' style='color: var( --text )'>0</span></div>
      <div class='row'>Textures:&nbsp;<span id='textures' style='color: var( --text )'>0</span></div>
      <div class='row'>Shaders:&nbsp;<span id='shaders' style='color: var( --text )'>0</span></div>
      <div class='row'>Triangles:&nbsp;<span id='triangles' style='color: var( --text )'>0</span></div>
      <div class='row'>Cached:&nbsp;<span id='cached' style='color: var( --text )'>0</span></div>
      <div class='row'>Tiles:&nbsp;<span id='tiles' style='color: var( --text )'>0</span></div>
    `
    root.appendChild( this.component )
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback( name, old, change ) {
  }

  connectedCallback() {
    this.component.style.display = store.getState().renderer.developerTools ? 'block' : 'none'
    this.geometries = this.shadowRoot.getElementById( 'geometries' )
    this.textures = this.shadowRoot.getElementById( 'textures' )
    this.shaders = this.shadowRoot.getElementById( 'shaders' )
    this.triangles = this.shadowRoot.getElementById( 'triangles' )
    this.cached = this.shadowRoot.getElementById( 'cached' )
    this.tiles = this.shadowRoot.getElementById( 'tiles' )

    this.unsubscribe = store.subscribe( () => {
      const {
        lastAction,
        renderer,
      } = store.getState()

      switch ( lastAction.type ) {
        case types.TOGGLE_DEVELOPER_TOOLS:
          console.log( renderer )
          this.component.style.display = renderer.developerTools ? 'block' : 'none'
          break
        default:
      }
    } )
  }

  disconnectedCallback() {
  }

  update( data ) {
    const {
      geometries,
      textures,
      triangles,
      shaders,
      cached,
      tiles,
    } = data

    this.geometries.innerText = geometries
    this.textures.innerText = textures
    this.shaders.innerText = shaders
    this.triangles.innerText = triangles
    this.cached.innerText = cached * 4
    this.tiles.innerText = tiles
  }
}

module.exports = Debug
