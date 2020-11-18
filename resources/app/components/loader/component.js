const path = require( 'path' )
const styles = path.join( __dirname, 'styles.css' )

class Loader extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow( {
      mode: 'open',
    } )
    this.component = document.createElement( 'div' )
    this.component.id = 'loader'
    this.component.innerHTML = `
      <link rel="stylesheet" href="${styles}"></link>
    `
    root.appendChild( this.component )
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback( name, old, change ) {
  }

  connectedCallback() {
    this.unsubscribe = store.subscribe( () => {
      const {
        lastAction,
        loader,
      } = store.getState()
      if ( lastAction.type === types.UPDATE_PROGRESS ) {
        this.component.style.width = loader.progress
        loader.visible ? this.component.style.display = 'block' : this.component.style.display = 'none'
      }
    } )
  }

  disconnectedCallback() {
    this.unsubscribe()
  }
}

module.exports = Loader
