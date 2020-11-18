const { app, dialog, BrowserWindow, Menu } = require( 'electron' )
const url = require( 'url' )
const path = require( 'path' )
const os = require( 'os' )
const args = process.argv

const types = require( './store/types.js' )

if ( app.requestSingleInstanceLock() && os.platform() === 'win32' ) {
  require( './scripts/ipcMain.js' )
  app.on( 'ready', () => {
    const menuTemplate = [
      {
        label: 'File',
        submenu: [
          {
            id: 0,
            label: 'Developer Tools',
            type: 'checkbox',
            checked: args[ 2 ] === 'dev' ? true : false,
            click: ( item ) => {
              if ( item.checked ) {
                window.webContents.openDevTools()
                window.webContents.send( types.TOGGLE_DEVELOPER_TOOLS )
              } else {
                window.webContents.closeDevTools()
                window.webContents.send( types.TOGGLE_DEVELOPER_TOOLS )
              }
            },
          },
          { type: 'separator' },
          {
            id: 1,
            label: 'Quit',
            click: () => {
              window.close()
            },
          },
        ],
      },
    ]
    const menu = Menu.buildFromTemplate( menuTemplate )
    const window = new BrowserWindow( {
      show: false,
      width: 1080,
      height: 720,
      title: app.name,
      backgroundColor: 'ffffff',
      icon: path.join( __dirname, 'images', 'icon.png' ),
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
      },
    } )
    window.loadURL( url.format( {
      pathname: path.join( __dirname, './index.html' ),
      protocol: 'file:',
      slashes: true,
    } ) )
    window.on( 'close', ( e ) => {
      const quit = dialog.showMessageBoxSync( {
        type: 'question',
        title: 'Quit?',
        message: 'Are you sure?',
        buttons: [ 'yes', 'no' ],
      } )
      if ( quit === 1 ) {
        e.preventDefault()
      }
    } )
    window.on( 'ready-to-show', ( e ) => {
      window.show()
      window.setMenu( menu )
    } )
    window.webContents.on( 'did-finish-load', ( e ) => {
        args[ 2 ] === 'dev' ? window.webContents.openDevTools() : null
    } )
  } )
}
