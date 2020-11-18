const path = require( 'path' )
const types = require( '../../store/types.js' )

const initialState = {
  projection: '2.5D',
  shading: 'ELEVATION',
  map: path.join( __dirname, 'maps', 'ETOPO1_Bedrock_grid_registered_geotiff.tif' ),
}

const reducer = ( state=initialState, action ) => {
  switch ( action.type ) {
    case types.UPDATE_PROJECTION:
      return {
        ...state,
        projection: action.projection,
      }
    case types.UPDATE_SHADING:
      return {
        ...state,
        shading: action.shading,
      }
    default:
      return state
  }
}

module.exports = reducer
