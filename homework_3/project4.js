function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    var rz = 0; // rotazione su z che teniamo a zero
    var trans = [
        Math.cos(rz) * Math.cos(rotationY), Math.cos(rz) * Math.sin(rotationY) * Math.sin(rotationX) - Math.sin(rz) * Math.cos(rotationX), Math.cos(rz) * Math.sin(rotationY) * Math.cos(rotationX) + Math.sin(rz) * Math.sin(rotationX), 0,
        Math.sin(rz) * Math.cos(rotationY), Math.sin(rz) * Math.sin(rotationY) * Math.sin(rotationX) + Math.cos(rz) * Math.cos(rotationX), Math.sin(rz) * Math.sin(rotationY) * Math.cos(rotationX) - Math.cos(rz) * Math.sin(rotationX), 0,
        -Math.sin(rotationY), Math.cos(rotationY) * Math.sin(rotationX), Math.cos(rotationY) * Math.cos(rotationX), 0,
        translationX, translationY, translationZ, 1
    ];
    var mvp = MatrixMult(projectionMatrix, trans);
    return mvp;
}

class MeshDrawer
{
    // costruttore inizializza tutto quello che serve
    constructor()
    {
        this.prog = InitShaderProgram(objVS, objFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.txc = gl.getAttribLocation(this.prog, 'txc');
        this.vertbuffer = gl.createBuffer();
        this.texcoordbuffer = gl.createBuffer();
        this.usingTexture = gl.getUniformLocation(this.prog, 'usingTexture');
        this.isswapYZ = gl.getUniformLocation(this.prog, 'swapYZ');
    }

    // chiamato ogni volta che si carica un nuovo file obj
    setMesh(vertPos, texCoords)
    {
        this.numTriangles = vertPos.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    }

    swapYZ(swap)
    {
        gl.useProgram(this.prog);
        if (swap) {
            gl.uniform1f(this.isswapYZ, 1.0);
        } else {
            gl.uniform1f(this.isswapYZ, 0.0);
        }
    }

    // disegna la mesh
    draw(trans)
    {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp, false, trans);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPos);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordbuffer);
        gl.vertexAttribPointer(this.txc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.txc);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img)
    {
        console.log(img);
        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        var loc = gl.getUniformLocation(this.prog, 'tex');
        gl.uniform1i(loc, 0);
    }

    showTexture(show)
    {
        gl.useProgram(this.prog);
        if (show) {
            gl.uniform1f(this.usingTexture, 1.0);
        } else {
            gl.uniform1f(this.usingTexture, 0.0);
        }
    }
}

// vertici
var objVS = `
    attribute vec3 pos;
    attribute vec2 txc;
    uniform mat4 mvp;
    varying vec2 texCoord;
    uniform float swapYZ;

    void main()
    {
        if (swapYZ > 0.5) {
            gl_Position = mvp * vec4(pos.x, pos.z, pos.y, 1.0);
        } else {
            gl_Position = mvp * vec4(pos, 1.0);
        }
        texCoord = txc;
    }
`;

// frammenti
var objFS = `
    precision mediump float;
    uniform sampler2D tex;
    varying vec2 texCoord;
    uniform float usingTexture;

    void main()
    {
        if (usingTexture > 0.5) {
            gl_FragColor = texture2D(tex, texCoord);
        } else {
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        }
    }
`;
