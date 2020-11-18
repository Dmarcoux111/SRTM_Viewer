const fs = require( 'fs' )
const path = require( 'path' )
const componentsDirectory = path.join( __dirname, '../components' )
const componentFolders = fs.readdirSync( componentsDirectory )
for ( const folder of componentFolders ) {
  const file = path.join( componentsDirectory, folder, 'component.js' )
  if ( fs.existsSync( file ) ) {
    customElements.define( `${ folder }-component`,
        require( file ),
    )
  }
}
