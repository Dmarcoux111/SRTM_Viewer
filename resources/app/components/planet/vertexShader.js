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

  void main() {

    vUV = position.xy / 256.;
    vHeight = texture2D( heightmap, vUV ).a;

    float height = vHeight * ( 180. / 6378137. );
    float pixelBounds = bounds / ( pow( 2., d ) );
    float pixelScale = pixelBounds / 256.;

    vec2 imagePosition = vec2( r, s ) + position.xy * pixelScale;
    vLatLng = ( ( imagePosition / bounds ) * 512. ) - 256.;

    #if defined( projection ) && projection == 3
      float longitude = radians( vLatLng.x );
      float latitude = radians( vLatLng.y );
      float radius = 180.;
      float x = ( radius + height ) * cos( latitude ) * cos( longitude );
      float y = ( radius + height ) * cos( latitude ) * sin( longitude );
      float z = ( radius + height ) * sin( latitude );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( x, y, z, 1.0 );
    #endif

    #if defined( projection ) && projection == 1
      gl_Position = projectionMatrix * modelViewMatrix * vec4( vLatLng, height, 1.0 );
    #endif

  }
`
