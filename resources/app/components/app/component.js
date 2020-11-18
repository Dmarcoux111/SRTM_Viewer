const path = require( 'path' )
const styles = path.join( __dirname, 'styles.css' )

class App extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow( {
      mode: 'open',
    } )
    this.component = document.createElement( 'div' )
    this.component.id = 'app'
    this.component.innerHTML = `
      <link rel="stylesheet" href="${styles}"></link>
      <renderer-component>
      </renderer-component>
      <controls-component></controls-component>
      <footer-component></footer-component>
      <loader-component></loader-component>
    `
    root.appendChild( this.component )
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback( name, old, change ) {
  }

  connectedCallback() {
  }

  disconnectedCallback() {
  }
}

module.exports = App
