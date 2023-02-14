const MAX_SUBATOMS = 16;
const sensorScale = 200000;

const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec2 position;

void main() {
    gl_Position = vec4(position.x, position.y, 0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag
#define WIDTH 500.0
#define HEIGHT 500.0
#define MAX_SUBATOMS ${MAX_SUBATOMS}

precision mediump float;

uniform int numProtons;
uniform int numElectrons;
uniform vec2[MAX_SUBATOMS] protons;
uniform vec2[MAX_SUBATOMS] electrons;
uniform float fluxScale;

out vec4 fragColor;

float scaleToRGB(in float val) {
    return (val + 1.0) / 2.0;
}

void main() {

    vec2 pos = vec2(gl_FragCoord.x, gl_FragCoord.y);

    vec2 fieldVec = vec2(0,0);
    for (int i = 0; i < numProtons; i++) {
        vec2 subatom = protons[i];
        vec2 diff = pos - subatom;
        float dist = length(diff);
        float strength = 1.0/(dist*dist);
        
        fieldVec += (vec2(diff.x, diff.y) / dist) * strength;
    }

    for (int i = 0; i < numElectrons; i++) {
        vec2 subatom = electrons[i];
        vec2 diff = pos - subatom;
        float dist = length(diff);
        float strength = 1.0/(dist * dist);
        
        fieldVec -= (vec2(diff.x/dist, diff.y/dist) * strength);
    }
    
    float finalStrength = length(fieldVec);

    float val1 = scaleToRGB(fieldVec.x/finalStrength);
    float val2 = scaleToRGB(fieldVec.y/finalStrength);
    float val3 = 1.0 - length(vec2(val1,val2));

    fragColor = vec4(val1, val2, 1, finalStrength * fluxScale);
}
`

const fieldCanvas = document.getElementById("fluxCanvas");

const gl = fieldCanvas.getContext("webgl2");
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

if (!gl) {
    alert("webgl2 is not supported in this web browser!");
}
const program = gl.createProgram();

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);
gl.attachShader(program, vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
}

gl.useProgram(program);


const quadData = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1
]);

const arrayVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, arrayVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

gl.vertexAttrib4f(1, 1, 0, 0, 1);

gl.enableVertexAttribArray(0);

const protonsNumUniform = gl.getUniformLocation(program, "numProtons");
const electronsNumUniform = gl.getUniformLocation(program, "numElectrons");
const electronsUniform = gl.getUniformLocation(program, "electrons");
const protonsUniform = gl.getUniformLocation(program, "protons");
const fluxScaleUniform = gl.getUniformLocation(program, "fluxScale");

var protons = new Float32Array(MAX_SUBATOMS * 2);
var protonsLength = 0;
var electrons = new Float32Array(MAX_SUBATOMS * 2);
var electronsLength = 0;
var sensors = new Float32Array(MAX_SUBATOMS * 2);
var sensorsLength = 0;




const electronImage = new Image();
const electronCanvas = new OffscreenCanvas(50, 50);
electronImage.onload = function () { electronCanvas.getContext('2d').drawImage(electronImage, 0, 0, 50, 50); };
electronImage.src = "electron.png";

const protonImage = new Image();
const protonCanvas = new OffscreenCanvas(50, 50);
protonImage.onload = function () { protonCanvas.getContext('2d').drawImage(protonImage, 0, 0, 50, 50); };
protonImage.src = "proton.png";


const canvasContainer = document.getElementById("canvasContainer");
const subatomCanvas = document.getElementById("subatomCanvas");
const sensorCanvas = document.getElementById("sensorCanvas");

if (!subatomCanvas.getContext) {
    alert("canvas context not supported in this browser!");
}

const ctx = subatomCanvas.getContext("2d");
const sctx = sensorCanvas.getContext("2d");

function drawSubatoms() {

    ctx.clearRect(0, 0, 500, 500);

    for (var i = 0; i < protonsLength; i++) {
        const proton = [protons[i * 2], protons[i * 2 + 1]];

        ctx.drawImage(protonCanvas, proton[0] - 25, 500 - proton[1] - 25);
    }
    for (var i = 0; i < electronsLength; i++) {
        const electron = [electrons[i * 2], electrons[i * 2 + 1]];

        ctx.drawImage(electronCanvas, electron[0] - 25, 500 - electron[1] - 25);
    }
}

function drawSensors() {

    sctx.clearRect(0, 0, 500, 500);
    console.log("eeeee");

    for (var u = 0; u < sensorsLength; u++) {
        const sensor = [sensors[u * 2], sensors[u * 2 + 1]];
        sctx.beginPath();
        sctx.arc(sensor[0], 500 - sensor[1], 8, 0, 2 * Math.PI);
        sctx.fillStyle = "#eda655";
        sctx.fill();

        var fieldVec = [0, 0];

        for (var i = 0; i < protonsLength; i++) {
            const proton = [protons[i * 2], protons[i * 2 + 1]];
            const distx = sensor[0] - proton[0];
            const disty = sensor[1] - proton[1];
            const dist = Math.sqrt(distx * distx + disty * disty);
            const strength = 1 / (dist * dist);

            fieldVec[0] -= strength * (distx / dist);
            fieldVec[1] += strength * (disty / dist);
        };

        for (var i = 0; i < electronsLength; i++) {
            const electron = [electrons[i * 2], electrons[i * 2 + 1]];
            const distx = sensor[0] - electron[0];
            const disty = sensor[1] - electron[1];
            const dist = Math.sqrt(distx * distx + disty * disty);
            const strength = 1 / (dist * dist);

            fieldVec[0] += strength * (distx / dist);
            fieldVec[1] -= strength * (disty / dist);
        };


        fieldVec[0] *= sensorScale;
        fieldVec[1] *= sensorScale;
        sctx.beginPath();
        sctx.moveTo(sensor[0], 500 - sensor[1]);
        sctx.lineTo(sensor[0] + (fieldVec[0] || 0), 500 - sensor[1] + (fieldVec[1]) || 0);
        sctx.strokeStyle = "red";
        sctx.lineWidth = 5;
        sctx.stroke();
    };
}

function render() {
    gl.uniform1i(protonsNumUniform, protonsLength);
    gl.uniform1i(electronsNumUniform, electronsLength);
    gl.uniform2fv(electronsUniform, electrons);
    gl.uniform2fv(protonsUniform, protons);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    drawSubatoms();
    drawSensors();
}

var hovering = {
    object: "none",
    index: 0,
    grabbing: false,
}

canvasContainer.addEventListener("mouseup", function (e) {
    hovering.grabbing = false;
    hovering.object = "none";
    hovering.index = -1;
});


canvasContainer.addEventListener("mousemove", function (e) {
    var x = e.offsetX;
    var y = 500 - e.offsetY;

    //intersection test to see if any objects are being hovered over while not already grabbing an object
    //chooses the closest object
    if (!hovering.grabbing) {
        var obj = "none";
        var index = -1;
        var dist = -1.0;
        for (var i = 0; i < electronsLength; i++) {
            const electron = [electrons[i * 2], electrons[i * 2 + 1]];
            const diff = [x - electron[0], y - electron[1]];
            const sqdist = (diff[0] * diff[0]) + (diff[1] * diff[1]);
            if (sqdist < 625 && (sqdist < dist || dist < 0)) {
                obj = "electron";
                index = i;
                dist = sqdist;
            }
        }
        for (var i = 0; i < protonsLength; i++) {
            const proton = [protons[i * 2], protons[i * 2 + 1]];
            const diff = [x - proton[0], y - proton[1]];
            const sqdist = (diff[0] * diff[0]) + (diff[1] * diff[1]);
            if (sqdist < 625 && (sqdist < dist || dist < 0)) {
                obj = "proton";
                index = i;
                dist = sqdist;
            }
        }
        for (var i = 0; i < sensorsLength; i++) {
            const sensor = [sensors[i * 2], sensors[i * 2 + 1]];
            const diff = [x - sensor[0], y - sensor[1]];
            const sqdist = (diff[0] * diff[0]) + (diff[1] * diff[1]);
            if (sqdist < 64 && (sqdist < dist || dist < 0)) {
                obj = "sensor";
                index = i;
                dist = sqdist;
            }
        }
        if (obj == "none") {
            canvasContainer.style.cursor = 'default';
            hovering.object = "none";
            hovering.index = -1;
        }
        else {
            canvasContainer.style.cursor = 'pointer';
            hovering.object = obj;
            hovering.index = index;
        }
        return;
    }

    //if already grabbing, move the corresponding subatomic particle
    if (hovering.object == "electron") {
        if (electronsLength < 1) return;
        electrons[(hovering.index) * 2] = x;
        electrons[(hovering.index) * 2 + 1] = y;
        render();
    }
    else if (hovering.object == "proton") {
        if (protonsLength < 1) return;
        protons[(hovering.index) * 2] = x;
        protons[(hovering.index) * 2 + 1] = y;
        render();
    }
    else if (hovering.object == "sensor") {
        if (sensorsLength < 1) return;
        sensors[(hovering.index) * 2] = x;
        sensors[(hovering.index) * 2 + 1] = y;
        drawSensors();
    }
});



canvasContainer.addEventListener("mousedown", function (e) {


    //if you're hovering over an object, grab it instead of creating a new object
    if (hovering.object != "none") {
        hovering.grabbing = true;
        return;
    }

    var x = e.offsetX;
    var y = 500 - e.offsetY;

    //get which object is currently selected to place
    var options = document.getElementsByName('object');
    var selected;
    for (var i = 0; i < options.length; i++) {
        if (options[i].checked) {
            selected = options[i].value;
        }
    }

    if (selected == "electron") {
        if (electronsLength >= MAX_SUBATOMS) { console.log("at capacity"); return };
        electrons[electronsLength * 2] = x;
        electrons[electronsLength * 2 + 1] = y;
        electronsLength++;

        hovering.object = "electron";
        hovering.index = electronsLength - 1;
        hovering.grabbing = true;
        canvasContainer.style.cursor = 'pointer';
        render();
    }
    else if (selected == "proton") {
        if (protonsLength >= MAX_SUBATOMS) { console.log("at capacity"); return };
        protons[protonsLength * 2] = x;
        protons[protonsLength * 2 + 1] = y;
        protonsLength++;

        hovering.object = "proton";
        hovering.index = protonsLength - 1;
        hovering.grabbing = true;
        canvasContainer.style.cursor = 'pointer';
        render();
    }
    else if (selected == "sensor") {
        if (sensorsLength >= MAX_SUBATOMS) { console.log("at capacity"); return };
        sensors[sensorsLength * 2] = x;
        sensors[sensorsLength * 2 + 1] = y;
        sensorsLength++;

        hovering.object = "sensor";
        hovering.index = sensorsLength - 1;
        hovering.grabbing = true;
        canvasContainer.style.cursor = 'pointer';
        drawSensors(); //save a little bit of computation by only having to draw the sensors
    }
});


gl.uniform1f(fluxScaleUniform, document.getElementById("fluxScale").value);
function setScale() {
    gl.uniform1f(fluxScaleUniform, document.getElementById("fluxScale").value);
    render();
}

