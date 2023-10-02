varying vec2 vUv;

void main()
{
    precision mediump float; //float = medium precision
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vUv = uv;
}