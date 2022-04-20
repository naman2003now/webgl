var canvas = document.getElementById("canvas");
canvas.height = 2000;
canvas.width = 2000;
var gl = canvas.getContext("webgl");

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
    attribute vec3 aColor;

    varying vec4 vColor;

    void main(){
        vColor = vec4(aColor, 1);
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

    varying vec4 vColor;

    uniform vec2 uMouse;
    uniform float uTime;

    void main(){
        if(length(gl_FragCoord.xy - uMouse) < sin(2.0*uTime)*sin(gl_FragCoord.x/7.0)*cos(gl_FragCoord.y/7.0)*250.0){
            gl_FragColor = vec4(0.9, 0.1, 0.1,1);
        }else{
            gl_FragColor = vec4(0, 0, 0, 0);
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
const colorAttribute = gl.getAttribLocation(program, "aColor");
gl.enableVertexAttribArray(colorAttribute);
gl.vertexAttribPointer(
	colorAttribute,
	3,
	gl.FLOAT,
	false,
	6 * Float32Array.BYTES_PER_ELEMENT,
	3 * Float32Array.BYTES_PER_ELEMENT
);

gl.useProgram(program);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

var x;
var y;
window.addEventListener("mousemove", function (e) {
	x = e.clientX;
	y = e.clientY;

	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	x *= canvas.width / canvas.clientWidth;
	y *= canvas.height / canvas.clientHeight;
	y = canvas.height - y;
});

const mouseUniformLocation = gl.getUniformLocation(program, "uMouse");
const timeUniformLocation = gl.getUniformLocation(program, "uTime");

var renderLoop = setInterval(() => {
	gl.uniform1f(timeUniformLocation, performance.now() / 1000);
	gl.uniform2f(mouseUniformLocation, x, y);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}, 1000 / 60);
