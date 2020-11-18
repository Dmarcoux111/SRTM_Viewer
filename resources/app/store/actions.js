const types = require( './types.js' )

module.exports = {
  toggleDeveloperTools: () => {
    return {
      type: types.TOGGLE_DEVELOPER_TOOLS,
    }
  },
  updateProjection: ( projection ) => {
    return {
      type: types.UPDATE_PROJECTION,
      projection,
    }
  },
  updateShading: ( shading ) => {
    return {
      type: types.UPDATE_SHADING,
      shading,
    }
  },
  updateProgress: ( action ) => {
    return action
  },
  raycast: ( result ) => {
    return {
      type: types.RAYCAST,
      result,
    }
  },
}
