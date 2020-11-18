module.exports = `
  //  Tile
  uniform sampler2D heightmap;
  uniform float r;
  uniform float s;
  uniform float d;

  //  Planet
  uniform sampler2D landGradient;
  uniform sampler2D seaGradient;
  uniform sampler2D lodGradient;
  uniform sampler2D colorTexture;
  uniform vec2 elevationRange;
  uniform vec2 lodRange;
  uniform float bounds;

  //  Varying
  varying vec2 vUV;
  varying vec2 vLatLng;
  varying float vHeight;

  vec3 getElevationGradientColor( float z ) {
    if ( z < 0.0 ) {
      float w = ( z - elevationRange.x ) / ( 0.0 - elevationRange.x );
      return texture2D ( seaGradient, vec2( w, 1.0 - w ) ).rgb;
    } else {
      float w = ( z - 0.0 ) / ( ( elevationRange.y ) - 0.0 );
      return texture2D( landGradient, vec2( w, 1.0 - w ) ).rgb;
    }
  }

  vec3 getLODGradientColor( float depth ) {
    float w = ( depth - lodRange.x ) / ( ( lodRange.y ) - lodRange.x );
    vec3 cLOD = texture2D ( lodGradient, vec2( w, 1.0 - w ) ).rgb;
    return cLOD;
  }

  vec3 getColor( vec2 vLatLng ) {
    vec2 uv = vec2( vLatLng + vec2( 180., 90. ) ) / vec2( 360., 180. );
    return texture2D( colorTexture, uv ).rgb;
  }

  void main() {
    if ( vLatLng.x > -180. && vLatLng.x < 180. && vLatLng.y > -90. && vLatLng.y < 90.0 ) {
      #if defined( shading ) && shading == 1
        vec3 gradient = getElevationGradientColor( vHeight );
        gl_FragColor = vec4( gradient, 1.0 );
      #endif
      #if defined( shading ) && shading == 2
        vec3 gradient = mix( getLODGradientColor( d ), getElevationGradientColor( vHeight ), 0.5 );
        gl_FragColor = vec4( gradient, 1.0 );
      #endif
      #if defined( shading ) && shading == 3
        vec3 diffuse = getColor( vLatLng );
        gl_FragColor = vec4( diffuse, 1.0 );
      #endif
      #if defined( shading ) && shading == 4
        vec3 diffuse = getColor( vLatLng );
        vec3 gradient = getElevationGradientColor( vHeight );
        gl_FragColor = vec4( mix( diffuse, gradient, 0.5 ), 1.0 );
      #endif
      #ifdef raycasting
        gl_FragColor = vec4( vLatLng, vHeight, 1.0 );
      #endif
    } else {
      discard;
    }
  }
`
