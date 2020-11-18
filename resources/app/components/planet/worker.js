const fs = require( 'fs' )
const mmap = require( '../../native_node_modules/mmap-io/build/Release/mmap-io.node' )

const BUFFER_SIZE = 2**30

const _getMMAP = ( header ) => {
  const { file } = header
  const size = fs.statSync( file ).size
  const fd = fs.openSync( file, 'r' )
  const pages = []
  const bufferSize = BUFFER_SIZE
  const protection = mmap.PROT_READ
  const privacy = mmap.MAP_PRIVATE
  const advise = mmap.MADV_RANDOM
  for ( let offset = 0; offset < size; offset+=bufferSize ) {
    let pageSize = bufferSize
    if ( ( offset + pageSize ) > size ) {
      pageSize = size % bufferSize
    }
    const buffer = mmap.map( pageSize, protection, privacy, fd, offset, advise )
    pages.push( buffer )
  }
  return pages
}

const _sampleMMAP = ( header, mmap, r, s, d ) => {
  const {
    byteStart,
    width,
    height,
  } = header

  let n = 0
  let m1 = 0
  let m2 = 0
  let min = Infinity
  let max = -Infinity
  const pixels = new Float32Array( 256 * 256 )
  const bounds = header.bounds / 2**d
  const pixelScale = bounds / 256

  let pixelIndex = 0
  for ( let y = s; y < s + bounds; y+=pixelScale ) {
    for ( let x = r; x < r + bounds; x+=pixelScale ) {
      const lat = ( 2 * ( y / 2**header.levels ) ) - 256
      const lon = ( 2 * ( x / 2**header.levels ) ) - 256
      if ( lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ) {
        const row = Math.floor( ( lat + 90 ) * 60 )
        const column = Math.floor( ( lon + 180 ) * 60 )
        const address = byteStart + ( height - 1 - row ) * width * 2 + column * 2
        const page = Math.floor( address / BUFFER_SIZE )
        const offset = address % BUFFER_SIZE
        let elevation
        if ( offset > BUFFER_SIZE - 2 ) {
          const byte0 = mmap[ Math.floor( ( offset + 0 ) / BUFFER_SIZE ) ][ ( offset + 0 ) ]
          const byte1 = mmap[ Math.floor( ( offset + 1 ) / BUFFER_SIZE ) ][ ( offset + 1 ) ]
          elevation = Buffer.from( [ byte0, byte1 ] ).readInt16LE( 0 )
        } else {
          elevation = mmap[ page ].readInt16LE( offset )
        }
        if ( Number( elevation ) ) {
          pixels[ pixelIndex ] = elevation
          n += 1
          min = Math.min( min, elevation )
          max = Math.max( max, elevation )
          m1 += elevation
          m2 += Math.pow( elevation, 2 )
        } else {
          // console.error( lat, lon, y, x )
        }
      }
      pixelIndex += 1
    }
  }
  m1 = m1 / n
  m2 = m2 / n
  const mean = m1
  const sampleVariance = ( m2 - Math.pow( mean, 2 ) ) * n / ( n - 1 )
  const standardDeviation = Math.sqrt( sampleVariance )
  const statistics = {
    mean,
    standardDeviation,
    sampleVariance,
    n,
    m1,
    m2,
    min,
    max,
  }
  return {
    statistics,
    pixels,
  }
}

const _getStatisticsAndRoot = ( header, mmap, r=0, s=0, d=0 ) => {
  console.time( 'getStatisticsAndRoot()' )
  console.log( 'start', 'getStatisticsAndRoot()' )
  const {
    byteStart,
    width,
    height,
  } = header
  let n = 0
  let m1 = 0
  let m2 = 0
  let min = Infinity
  let max = -Infinity
  const root = new Uint16Array( 256 * 256 )

  for ( let i = 0; i < width * height; i++ ) {
    const row = Math.floor( i / width )
    const column = i % width
    const address = byteStart + ( height - 1 - row ) * width * 2 + column * 2
    const page = Math.floor( address / BUFFER_SIZE )
    const offset = address % BUFFER_SIZE
    let elevation
    if ( offset > BUFFER_SIZE - 2 ) {
      const byte0 = mmap[ Math.floor( ( offset + 0 ) / BUFFER_SIZE ) ][ ( offset + 0 ) ]
      const byte1 = mmap[ Math.floor( ( offset + 1 ) / BUFFER_SIZE ) ][ ( offset + 1 ) ]
      elevation = Buffer.from( [ byte0, byte1 ] ).readInt16LE( 0 )
    } else {
      elevation = mmap[ page ].readInt16LE( offset )
    }
    n += 1
    min = Math.min( min, elevation )
    max = Math.max( max, elevation )
    m1 += elevation
    m2 += Math.pow( elevation, 2 )

    const y = Math.round( ( ( row / 60 ) + 166 ) / 2 )
    const x = Math.round( ( ( column / 60 ) + 76 ) / 2 )
    if ( y >= 0 && y < 256 && x >= 0 && x < 256 ) {
      const textureIndex = y * 256 + x
      root[ textureIndex ] = elevation
      i % 250000 === 0 ?
        self.postMessage( { type: 'UPDATE_PROGRESS', progress: ( ( i / ( width * height ) ) * 100 ).toFixed( 2 ) + '%', visible: true } ) :
        null
    }
  }
  console.timeEnd( 'getStatisticsAndRoot()' )
  self.postMessage( { type: 'UPDATE_PROGRESS', progress: 0 + '%', visible: false } )
  m1 = m1 / n
  m2 = m2 / n
  const mean = m1
  const sampleVariance = ( m2 - Math.pow( mean, 2 ) ) * n / ( n - 1 )
  const standardDeviation = Math.sqrt( sampleVariance )
  const statistics = {
    mean,
    standardDeviation,
    sampleVariance,
    n,
    m1,
    m2,
    min,
    max,
  }
  return {
    statistics,
    root,
  }
}

self.addEventListener( 'message', ( event ) => {
  switch ( event.data.type ) {
    case 'INIT': {
      const {
        header,
      } = event.data
      const mmap = _getMMAP( header )
      const {
        statistics,
        root,
      } = _getStatisticsAndRoot( header, mmap )
      self.state = {
        header: header,
        mmap,
        statistics,
      }
      const message = {
        type: 'INIT_RESPONSE',
        header,
        statistics,
        transferrable: root.buffer,
      }
      self.postMessage( message, [ message.transferrable ] )
      if ( message.transferrable.byteLength !== 0 ) {
        console.error( 'Error transferring buffer' )
      }
      break
    }
    case 'REFINE': {
      const request = event.data.request
      const array = request.split( '_' )
      const r = Number( array[ 1 ] )
      const s = Number( array[ 2 ] )
      const d = Number( array[ 3 ] )
      const header = self.state.header
      const childD = d + 1
      const childBounds = header.bounds / 2**childD

      const tiles = [
        `Earth_${r}_${s}_${childD}`,
        `Earth_${r+childBounds}_${s}_${childD}`,
        `Earth_${r}_${s+childBounds}_${childD}`,
        `Earth_${r+childBounds}_${s+childBounds}_${childD}`,
      ]
      const transferrableMatrix = []
      const parent = {
        name: request,
        tiles: [],
      }
      let transferrableMatrixIndex = 0
      for ( let i = 0; i < tiles.length; i++ ) {
        const childIndex = tiles[ i ]
        const array = childIndex.split( '_' )
        const childR = Number( array[ 1 ] )
        const childS = Number( array[ 2 ] )
        const { pixels, statistics } = _sampleMMAP( header, self.state.mmap, childR, childS, childD )
        if ( statistics.n !== 0 ) {
          parent.tiles.push( {
            name: tiles[ i ],
            r: childR,
            s: childS,
            d: childD,
            statistics,
            transferrableIndex: transferrableMatrixIndex,
          } )
          transferrableMatrix.push( pixels.buffer )
          transferrableMatrixIndex += 1
        }
      }

      const message = {
        type: 'REFINE_RESPONSE',
        parent,
        transferrableMatrix,
      }
      self.postMessage( message, transferrableMatrix )
      if ( message.transferrableMatrix[ 0 ].byteLength !== 0 ) {
        console.error( 'Error transferring buffer' )
      }
      break
    }
    default:
      console.error( event.data )
  }
} )
