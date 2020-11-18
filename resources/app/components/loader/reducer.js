const types = require( '../../store/types.js' )

const initialState = {
  progress: 0,
  visible: false,
}

const reducer = ( state=initialState, action ) => {
  switch ( action.type ) {
    case types.UPDATE_PROGRESS:
      return {
        ...state,
        progress: action.progress,
        visible: action.visible,
      }
    default:
      return state
  }
}

module.exports = reducer
