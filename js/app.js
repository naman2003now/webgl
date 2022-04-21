var canvas = document.getElementById("canvas");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

var gl = canvas.getContext("webgl");

canvas.style.height = window.innerHeight + "px";
canvas.style.width = window.innerWidth + "px";

if (!gl) {
	alert(`WebGL not supported`);
}

const vertexData = [
	-1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, -1, -1, 0, 0, 0, 1, 1, -1, 0, 1, 1, 0,
];

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const ebo = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
gl.bufferData(
	gl.ELEMENT_ARRAY_BUFFER,
	new Uint16Array([0, 1, 2, 1, 3, 2]),
	gl.STATIC_DRAW
);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(
	vertexShader,
	`
    attribute vec3 aPosition;

    void main(){
        gl_Position = vec4(aPosition, 1.0);
    }
`
);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(
	fragmentShader,
	`
    precision mediump float;

	#define PI 3.1415926535897932384626433832795

	uniform vec2 uResolution;
	uniform vec3 uSpherePos;
	uniform float uRadius;
	uniform vec4 uCamera;
	uniform vec3 uLightDirection;

	uniform float uBumps;

	const int MAX_ITER = 1000;
	const float HIT_SIZE = 0.0001;
	const float MAX_DISTANCE = 10.0;

	float distance_from_plane(vec3 _coordinates){
		return _coordinates.y + 1.0;
	}

	float distance_from_sphere(vec3 _coordinates, vec3 _origin, float _radius){
		// vec3 point_on_sphere = normalize(_coordinates-uSpherePos);
		// float bumps = sin(asin(point_on_sphere.y)*25.0 ) + cos(acos(point_on_sphere.x)*25.0 );
		// bumps/=uBumps;
		return length(_coordinates - _origin) - _radius;
	}

	float minimum_distance(vec3 _coordinates){

		return min(distance_from_plane(_coordinates), distance_from_sphere(_coordinates, uSpherePos, uRadius));
	}

	vec3 march(vec3 _coordinates, vec3 _camera, vec3 _frag, float _distance){
		return _coordinates - _distance*normalize(_camera - _frag);
	}

	vec3 normal(vec3 _coordinates){
		float d = minimum_distance(_coordinates);
		float x = d - minimum_distance(_coordinates + vec3(0.00001, 0, 0));
		float y = d - minimum_distance(_coordinates + vec3(0, 0.00001, 0));
		float z = d - minimum_distance(_coordinates + vec3(0, 0, 0.00001));
		return normalize(vec3(x, y, z));
	}

	int march_shadow(vec3 _coordinates){
		float marchDistance;
		vec3 camera = _coordinates;
		if(_coordinates.y + 1.0 > 0.01){
			return 0;
		}
		for(int iter = 0; iter < MAX_ITER; iter++){
			marchDistance = distance_from_sphere(_coordinates, uSpherePos, uRadius);
			if(marchDistance < HIT_SIZE){
				return 1;
			}
			else if(marchDistance > MAX_DISTANCE){
				return 0;
			}
			_coordinates = march(_coordinates, vec3(0, 0, 0) , uLightDirection , marchDistance);
		}
		return 0;
	}

    void main(){
		vec2 uv = (gl_FragCoord.xy- 0.5*uResolution)/min(uResolution.y, uResolution.x);
		gl_FragColor = vec4(minimum_distance(vec3(uv, 0))*vec3(1, 1, 1), 1);

		float marchDistance = 0.0;
		int hit = 0;
		vec3 coordinates = uCamera.xyz;
		vec3 frag = vec3(uv, uCamera.w);

		for(int iter = 0; iter < MAX_ITER; iter++){
			marchDistance = minimum_distance(coordinates);
			if(marchDistance < HIT_SIZE){
				hit = 1;
				break;
			}
			else if(marchDistance > MAX_DISTANCE){
				break;
			}
			coordinates = march(coordinates, uCamera.xyz, frag, marchDistance);
		}
		if(hit == 1){
			float intensity = dot(-normalize(uLightDirection), normal(coordinates))/1.2;
			gl_FragColor = vec4(intensity*vec3(1, 1, 1) + vec3(0.1, 0.1, 0.1), 1);
			if(march_shadow(coordinates) == 1){
				gl_FragColor = vec4(0.1, 0.1, 0.1, 1);
			}
		}else{
			gl_FragColor = vec4(0.2, 0.2, 0.2 ,1);
		}
    }
`
);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const positionAttribute = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(positionAttribute);
gl.vertexAttribPointer(
	positionAttribute,
	3,
	gl.FLOAT,
	false,
	6 * Float32Array.BYTES_PER_ELEMENT,
	0
);

gl.useProgram(program);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
console.log(gl.getShaderInfoLog(fragmentShader));

//Getting Uniform Locations
const uResolution = gl.getUniformLocation(program, "uResolution");
const uSpherePos = gl.getUniformLocation(program, "uSpherePos");
const uRadius = gl.getUniformLocation(program, "uRadius");
const uCamera = gl.getUniformLocation(program, "uCamera");
const uLightDirection = gl.getUniformLocation(program, "uLightDirection");
const uBumps = gl.getUniformLocation(program, "uBumps");

//Setting Uniform Locations
gl.uniform1f(uRadius, 0.85);
gl.uniform2f(uResolution, canvas.width, canvas.height);
gl.uniform3f(uSpherePos, 0, 0, 3);
gl.uniform4f(uCamera, 0, 0, -1, 0);
gl.uniform3f(uLightDirection, 1, 1, 0);
gl.uniform1f(uBumps, 1050.0);

pos = { x: 0, y: 0, z: 3 };

keys = {};

window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

var speed = 0.025;
var frameTime = Date.now();

setInterval(() => {
	let collision = document.getElementById("collision");
	let distance = Math.sqrt(
		Math.pow(pos.x, 2) + Math.pow(pos.y, 2) + Math.pow(pos.z + 1, 2)
	);
	console.log(distance);

	if (distance < 1.5) {
		collision.style.display = "flex";
	} else {
		collision.style.display = "none";
	}
}, 0);

var renderLoop = setInterval(() => {
	let deltaTime = Date.now() - frameTime;
	frameTime = Date.now();
	if (keys["w"]) {
		pos.z += (deltaTime * speed) / 4;
	}
	if (keys["s"]) {
		pos.z -= (deltaTime * speed) / 4;
	}
	if (keys["d"]) {
		pos.x += (deltaTime * speed) / 4;
	}
	if (keys["a"]) {
		pos.x -= (deltaTime * speed) / 4;
	}
	if (keys["q"]) {
		pos.y -= (deltaTime * speed) / 4;
	}
	if (keys["e"]) {
		pos.y += (deltaTime * speed) / 4;
	}
	gl.uniform3f(uSpherePos, pos.x, pos.y, pos.z);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}, 1000 / 60);
