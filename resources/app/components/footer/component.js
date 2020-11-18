const path = require( 'path' )
const styles = path.join( __dirname, 'styles.css' )

class Footer extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow( {
      mode: 'open',
    } )
    this.component = document.createElement( 'div' )
    this.component.id = 'footer'
    this.component.innerHTML = `
      <link rel="stylesheet" href="${styles}"></link>
      <div class='column'>
        <span>File:&nbsp;</span>
        <span id='file'>
          ${store.getState().footer.file}
        </span>
      </div>
      <div class='column'>
        <span>Longitude:&nbsp;</span><span id='longitude'>${store.getState().footer.longitude}</span>
      </div>
      <div class='column'>
        <span>Latitude:&nbsp;</span><span id='latitude'>${store.getState().footer.latitude}</span>
      </div>
      <div class='column'>
        <span>Elevation:&nbsp;</span><span id='elevation'>${store.getState().footer.elevation}&nbsp;[m]</span>
      </div>
    `
    root.appendChild( this.component )
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback( name, old, change ) {
  }

  connectedCallback() {
    this.file = this.shadowRoot.getElementById( 'file' )
    this.longitude = this.shadowRoot.getElementById( 'longitude' )
    this.latitude = this.shadowRoot.getElementById( 'latitude' )
    this.elevation = this.shadowRoot.getElementById( 'elevation' )

    this.unsubscribe = store.subscribe( () => {
      const {
        lastAction,
        footer,
      } = store.getState()
      switch ( lastAction.type ) {
        case types.RAYCAST: {
          const {
            file,
            longitude,
            latitude,
            elevation,
          } = footer
          this.file.innerHTML = file
          this.longitude.innerHTML = longitude ? longitude.toFixed( 2 ) : 0
          this.latitude.innerHTML = latitude ? latitude.toFixed( 2 ) : 0
          this.elevation.innerHTML = elevation ? elevation.toFixed( 3 ) + '&nbsp;[m]' : 0 + '&nbsp;[m]'
          break
        }
        default:
      }
    } )
  }

  disconnectedCallback() {
    this.unsubscribe()
  }
}

module.exports = Footer
