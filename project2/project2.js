// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	let rad = rotation * (Math.PI / 180);
	let cos_theta = Math.cos(rad);
	let sin_theta = Math.sin(rad);
	let cos_scaled = cos_theta * scale;
    let sin_scaled = sin_theta * scale;
	
	return Array( 
		cos_scaled, sin_scaled, 0, 
		-sin_scaled, cos_scaled, 0, 
		positionX, positionY, 1 );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies t1 and then t2.
function multiplyMatrix(M1,M2){
	//M1 x M2
	let res = [];
	for( let row = 0; row < 3; row ++){
		for( let col = 0; col < 3; col ++ ){
			let index = (row * 3) + col
			res[index] = 
				M1[(row * 3)] 	* M2[col] +
				M1[(row * 3)+1] * M2[3+col] +
				M1[(row * 3)+2] * M2[6+col]
				
		}
	}
	return res;
}
function trasposeMatrix(m){
	return [
		m[0], m[3], m[6],
		m[1], m[4], m[7],
		m[2], m[5], m[8],
	]
}
function ApplyTransform( t1, t2 )
{
	let m2 = trasposeMatrix(t2)
	let m1 = trasposeMatrix(t1)
	let newMatrix = trasposeMatrix(multiplyMatrix(m2,m1));
	return newMatrix;
}
