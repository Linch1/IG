
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    var rz = 0; 
    var trans = [
        Math.cos(rz) * Math.cos(rotationY), Math.cos(rz) * Math.sin(rotationY) * Math.sin(rotationX) - Math.sin(rz) * Math.cos(rotationX), Math.cos(rz) * Math.sin(rotationY) * Math.cos(rotationX) + Math.sin(rz) * Math.sin(rotationX), 0,
        Math.sin(rz) * Math.cos(rotationY), Math.sin(rz) * Math.sin(rotationY) * Math.sin(rotationX) + Math.cos(rz) * Math.cos(rotationX), Math.sin(rz) * Math.sin(rotationY) * Math.cos(rotationX) - Math.cos(rz) * Math.sin(rotationX), 0,
        -Math.sin(rotationY), Math.cos(rotationY) * Math.sin(rotationX), Math.cos(rotationY) * Math.cos(rotationX), 0,
        translationX, translationY, translationZ, 1
    ];
    return trans;
}


class MeshDrawer
{
    constructor()
    {
        this.prog = InitShaderProgram(objVS, objFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.mv = gl.getUniformLocation(this.prog, 'mv');
        this.normTrans = gl.getUniformLocation(this.prog, 'normTrans');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.txc = gl.getAttribLocation(this.prog, 'txc');
        this.normal = gl.getAttribLocation(this.prog, 'normal');
        this.vertbuffer = gl.createBuffer();
        this.texcoordbuffer = gl.createBuffer();
        this.normalbuffer = gl.createBuffer();
        this.usingTexture = gl.getUniformLocation(this.prog, 'usingTexture');
        this.isswapYZ = gl.getUniformLocation(this.prog, 'swapYZ');
        this.lightDir = gl.getUniformLocation(this.prog, 'lightDir');
        this.shiny = gl.getUniformLocation(this.prog, 'shininess');
    }

    setMesh(vertPos, texCoords, normals)
    {
        this.numTriangles = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    swapYZ(swap)
    {
        gl.useProgram(this.prog);
        gl.uniform1f(this.isswapYZ, swap ? 1.0 : 0.0);
    }

    draw(matrixMVP, matrixMV, matrixNormal)
    {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        gl.uniformMatrix4fv(this.mv, false, matrixMV);
        gl.uniformMatrix3fv(this.normTrans, false, matrixNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPos);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordbuffer);
        gl.vertexAttribPointer(this.txc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.txc);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normal);

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
        gl.uniform1f(this.usingTexture, show ? 1.0 : 0.0);
    }

    setLightDir(x, y, z)
    {
        gl.useProgram(this.prog);
        gl.uniform3f(this.lightDir, x, y, z);
    }

    setShininess(shininess)
    {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shiny, shininess);
    }
}

var objVS = `
    attribute vec3 pos;
    attribute vec2 txc;
    attribute vec3 normal;
    uniform mat4 mvp;
    uniform mat4 mv;
    uniform mat3 normTrans;
    uniform float swapYZ;
    varying vec2 texCoord;
    varying vec3 fragNormal;
    varying vec3 fragPos;

    void main()
    {
        vec3 p = pos;
        if (swapYZ > 0.5) {
            p = vec3(p.x, p.z, p.y);
        }
        gl_Position = mvp * vec4(p, 1.0);
        texCoord = txc;
        fragNormal = normalize(normTrans * normal);
        fragPos = (mv * vec4(p, 1.0)).xyz;
    }
`;

var objFS = `
    precision mediump float;
    uniform sampler2D tex;
    uniform float usingTexture;
    uniform vec3 lightDir;
    uniform float shininess;
    varying vec2 texCoord;
    varying vec3 fragNormal;
    varying vec3 fragPos;

    void main()
    {
        vec3 N = normalize(fragNormal);
        vec3 L = normalize(lightDir);
        vec3 V = normalize(-fragPos);
        vec3 H = normalize(L + V);

        float diff = max(dot(N, L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), shininess);

        vec3 color;
        if (usingTexture > 0.5) {
            color = texture2D(tex, texCoord).rgb;
        } else {
            color = vec3(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0);
        }

        vec3 finalColor = (0.1 + diff + spec) * color;
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;
