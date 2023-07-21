attribute vec4 aPosition;
attribute vec4 aColor;
attribute vec3 aNormal;

varying vec4 vColor;
    
uniform mat4 uCameraMatrix;

void main() {
    gl_Position = uCameraMatrix * aPosition;
    vec3 lightDirection = normalize(vec3(1.0, 3.0, 2.0));
    float shade = dot(aNormal, lightDirection) * 0.5 + 0.6;
    vColor = vec4(aColor.rgb * shade, aColor.a); 
}