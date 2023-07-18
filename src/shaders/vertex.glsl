attribute vec4 aPosition;
attribute vec4 aColor;

varying vec4 vColor;
    
uniform mat4 uCameraMatrix;

void main() {
    gl_Position = uCameraMatrix * aPosition;
    vColor = aColor;
}