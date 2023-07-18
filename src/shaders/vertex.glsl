attribute vec4 aPosition;
    
uniform mat4 uCameraMatrix;

void main() {
    gl_Position = uCameraMatrix * aPosition;
}