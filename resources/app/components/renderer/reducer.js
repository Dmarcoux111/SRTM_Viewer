const types = require( '../../store/types.js' )
const { remote } = require( 'electron' )

const initialState = {
  developerTools: remote.process.argv[ 2 ] === 'dev' ? true : false,
}

const reducer = ( state=initialState, action ) => {
  switch ( action.type ) {
    case types.TOGGLE_DEVELOPER_TOOLS:
      return {
        ...state,
        developerTools: !state.developerTools,
      }
    default:
      return state
  }
}

module.exports = reducer
