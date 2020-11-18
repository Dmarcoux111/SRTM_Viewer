const path = require( 'path' )
const styles = path.join( __dirname, 'styles.css' )

class Controls extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow( {
      mode: 'open',
    } )
    this.component = document.createElement( 'div' )
    this.component.id = 'controls'
    this.component.innerHTML = `
      <link rel="stylesheet" href="${styles}"></link>
      <button class='control' id='three-d'>3D</button>
      <button class='control active' id='two-point-5-d'>2.5D</button>
      <select id='shading' class='menu'>
        <option value='ELEVATION'>Elevation</option>
        <option value='DEBUG'>Debug</option>
        <option value='COMPOSITE'>Composite</option>
        <option value='COLOR'>Color</option>
      </select>
    `
    root.appendChild( this.component )
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback( name, old, change ) {
  }

  connectedCallback() {
    this.toggle3D = this.shadowRoot.getElementById( 'three-d' )
    this.toggle3D.addEventListener( 'click', () => {
      this.toggle3D.classList.add( 'active' )
      this.toggle2_5D.classList.remove( 'active' )
      store.dispatch( actions.updateProjection( '3D' ) )
    } )
    this.toggle2_5D = this.shadowRoot.getElementById( 'two-point-5-d' )
    this.toggle2_5D.addEventListener( 'click', () => {
      this.toggle3D.classList.remove( 'active' )
      this.toggle2_5D.classList.add( 'active' )
      store.dispatch( actions.updateProjection( '2.5D' ) )
    } )
    this.shading = this.shadowRoot.getElementById( 'shading' )
    this.shading.addEventListener( 'change', () => {
      store.dispatch( actions.updateShading( this.shading.value ) )
    } )
  }

  disconnectedCallback() {
  }
}

module.exports = Controls
