var canvas = document.getElementById("canvas");
canvas.height = 3000;
canvas.width = 3000;
var gl = canvas.getContext("webgl");
canvas.height = 1000;
canvas.width = 1000;

canvas.style.height = Math.min(window.innerHeight, window.innerWidth) + "px";
canvas.style.width = Math.min(window.innerHeight, window.innerWidth) + "px";

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
    precision lowp int;
    precision highp float;

    uniform float x_min;
    uniform float x_max;
    uniform float y_min;
    uniform float y_max;

    uniform vec2 u_resolution;

    void main(){
        float x0 = x_min + (x_max - x_min)*(gl_FragCoord.x / u_resolution.x);
        float y0 = y_min + (y_max - y_min)*(gl_FragCoord.y / u_resolution.y);
        float x = 0.0;
        float y = 0.0;
        int found = 0;
        const int max_iteration = 100;
        for(int k = 0; k < max_iteration; k++){
            float x_new = x*x - y*y + x0;
            float y_new = 2.0*x*y + y0;
            if(x_new*x_new + y_new*y_new > 4.0){
                found = 1;
                gl_FragColor = vec4(k, k, 0.1, 100)/100.0;
                break;
            }
            x = x_new;
            y = y_new;
        }
        if(found == 0){
            gl_FragColor = vec4(0, 0, 0, 1);
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

const mouseUniformLocation = gl.getUniformLocation(program, "uMouse");
const timeUniformLocation = gl.getUniformLocation(program, "uTime");

const x_min = gl.getUniformLocation(program, "x_min");
const x_max = gl.getUniformLocation(program, "x_max");
const y_min = gl.getUniformLocation(program, "y_min");
const y_max = gl.getUniformLocation(program, "y_max");

const resolutionUniformLocation = gl.getUniformLocation(
	program,
	"u_resolution"
);

gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

document.getElementById("resolution").addEventListener("change", (e) => {
	const resolution = e.target.value;
	document.getElementById("resolutionDisplay").innerHTML = resolution;
	canvas.height = resolution;
	canvas.width = resolution;
	gl.uniform2f(resolutionUniformLocation, resolution, resolution);
});

var moveDelta = 0.1;

window.addEventListener("keydown", (e) => {
	if (e.key === "ArrowLeft" || e.key === "a") {
		x_min_value -= moveDelta;
		x_max_value -= moveDelta;
	} else if (e.key === "ArrowRight" || e.key === "d") {
		x_min_value += moveDelta;
		x_max_value += moveDelta;
	} else if (e.key === "ArrowUp" || e.key === "w") {
		y_min_value += moveDelta;
		y_max_value += moveDelta;
	} else if (e.key === "ArrowDown" || e.key === "s") {
		y_min_value -= moveDelta;
		y_max_value -= moveDelta;
	} else if (e.key === "q") {
		let scalex = (x_max_value - x_min_value) * 0.8;
		let scaley = (y_max_value - y_min_value) * 0.8;

		moveDelta *= 0.8;

		let temp_x = x_max_value;
		let temp_y = y_max_value;

		x_max_value = x_min_value + scalex;
		x_min_value = temp_x - scalex;

		y_max_value = y_min_value + scaley;
		y_min_value = temp_y - scaley;
	} else if (e.key === "e") {
		let scalex = (x_max_value - x_min_value) * 1.2;
		let scaley = (y_max_value - y_min_value) * 1.2;

		moveDelta *= 1.2;

		let temp_x = x_max_value;
		let temp_y = y_max_value;

		x_max_value = x_min_value + scalex;
		x_min_value = temp_x - scalex;

		y_max_value = y_min_value + scaley;
		y_min_value = temp_y - scaley;
	}
});
var x_min_value = -2.0;
var x_max_value = 0.47;
var y_min_value = -1.12;
var y_max_value = 1.12;

var renderLoop = setInterval(() => {
	gl.uniform1f(x_min, x_min_value);
	gl.uniform1f(x_max, x_max_value);
	gl.uniform1f(y_min, y_min_value);
	gl.uniform1f(y_max, y_max_value);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}, 1000 / 60);
