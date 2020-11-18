const { ipcRenderer } = require( 'electron' )
const types = require( '../store/types.js' )

ipcRenderer.on( types.TOGGLE_DEVELOPER_TOOLS, () => {
  store.dispatch( actions.toggleDeveloperTools() )
} )
