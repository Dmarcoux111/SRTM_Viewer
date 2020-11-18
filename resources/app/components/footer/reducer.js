const types = require( '../../store/types.js' )

const initialState = {
  file: 'https://www.e-education.psu.edu/natureofgeoinfo/c7_p13.html ( Bedrock )',
  longitude: 0,
  latitude: 0,
  elevation: 0,
}

const reducer = ( state=initialState, action ) => {
  switch ( action.type ) {
    case types.RAYCAST:
      return {
        ...state,
        longitude: action.result.r,
        latitude: action.result.g,
        elevation: action.result.b,
      }
    default:
      return state
  }
}

module.exports = reducer
