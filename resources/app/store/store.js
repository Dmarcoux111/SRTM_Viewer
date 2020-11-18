const { combineReducers, createStore } = require( 'redux' )
const fs = require( 'fs' )
const path = require( 'path' )
const componentsDirectory = path.join( __dirname, '../components' )
const componentFolders = fs.readdirSync( componentsDirectory )
const reducers = {}

for ( const folder of componentFolders ) {
  const file = path.join( componentsDirectory, folder, 'reducer.js' )
  if ( fs.existsSync( file ) ) {
    reducers[ folder ] = require( file )
  }
}

reducers[ 'lastAction' ] = ( state, action ) => {
  return action
}

module.exports = createStore( combineReducers( reducers ) )
