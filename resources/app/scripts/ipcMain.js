const { ipcMain } = require( 'electron' )
const GeoTIFF = require( 'geotiff' )

async function loadMap( file, callback ) {
  const tiff = await GeoTIFF.fromFile( file )
  const image = await tiff.getImage()
  const {
    StripOffsets,
    ImageWidth,
    ImageLength,
  } = image.fileDirectory
  const size = Math.max( ImageWidth, ImageLength )
  const bounds = 2 ** Math.ceil( Math.log2( size ) )
  callback( {
    file,
    byteStart: StripOffsets[ 0 ],
    width: ImageWidth,
    height: ImageLength,
    bounds,
    levels: Math.log2( bounds ) - 8,
  } )
}

ipcMain.on( 'GET_MAP_HEADER', ( event, file ) => {
  loadMap( file, ( result ) => {
    event.reply( 'GET_MAP_HEADER', result )
  } )
} )
