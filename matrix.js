
var Matrix = function(data, shape, datatype) {
	this.shape = shape;
	this.size = 1;
	for (var i=0; i<shape.length; i++) {
		this.size *= this.shape[i];
	}
	this.suffix = [];
	var product = 1;
	for (var i=this.shape.length-1; i>=0; i--) {
		this.suffix.unshift(product);
		product *= this.shape[i];
	}
	datatype == undefined ? datatype = Float32Array : true;
	this.data = new datatype(this.size);
	this.datatype = datatype;
	data && this.data.set(data);
}

Matrix.prototype = {

	min: function() {
		var m = this.data[0];
		for (var i=1; i<this.data.length; i++) {
			if (this.data[i] < m) {
				m = this.data[i];
			}
		}
		return m;
	},

	max: function() {
		var m = this.data[0];
		for (var i=1; i<this.data.length; i++) {
			if (this.data[i] > m) {
				m = this.data[i];
			}
		}
		return m;
	},

	_getindex: function(suffix) {
		// for (var i=suffix.length-1; i<this.shape.length; i++) {
		// 	suffix.push(0); //不足部分补充0
		// }
		var product = 1;
		var index = 0;
		// for (var i=this.shape.length-1; i>=0; i--) {
		// 	// if (suffix[i] >= this.shape[i]) {
		// 	// 	throw "index out of limit"
		// 	// }
		// 	index += product*suffix[i];
		// 	product *= this.shape[i];
		// }
		for(var i=0; i<this.shape.length-1; i++) {
			index += this.suffix[i]*suffix[i];
		}
		index += suffix[i];			//this.suffix 最后一位为1， 尽量少做一次乘法
		return index;
	},

	get: function(suffix) {
		var index = this._getindex(suffix);
		// if (isNaN(index)) {
		// 	throw "suffix type is not support";
		// }
		return this.data[index];
	},

	set: function(suffix, value) {
		// if (isNaN(value)) {
		// 	throw "NaN value error";
		// }
		var index = this._getindex(suffix);
		this.data[index] = value;
	},

	abs: function() {
		for (var i=0; i<this.data.length; i++) {
			this.data[i] = Math.abs(this.data[i])
		}
		return this;
	},

	sqrt: function() {
		for (var i=0; i<this.data.length; i++) {
			this.data[i] = Math.sqrt(this.data[i])
		}
		return this;
	},

	sub: function(mat1) {
		if (mat1.size != this.size) {
			throw "size is not equal";
		}

		var mat = new Matrix(null, this.shape, this.datatype);
		for (var i=0; i<this.size;i++) {
			mat.data[i] = this.data[i]-mat1.data[i];
		}
		return mat;
	},

	child: function(rows, cols) {
		rows = rows == undefined ? ["", ""] : rows.split(":");
		cols = cols == undefined ? ["", ""] : cols.split(":");

		if (rows.length < 2 || cols.length < 2) {
			throw "param must a:b";
		}

		var brow = rows[0], erow = rows[1], bcol = cols[0], ecol = cols[1];

		brow = brow == "" ? 0 : parseInt(brow);
		brow = brow < 0 ? this.shape[0] + brow : brow;
		brow = Math.max(0, brow);

		erow = erow == "" ? this.shape[0] : parseInt(erow);
		erow = erow < 0 ? this.shape[0] + erow : erow;
		erow = Math.min(this.shape[0], erow);

		bcol = bcol == "" ? 0 : parseInt(bcol);
		bcol = bcol < 0 ? this.shape[1] + bcol : bcol;
		bcol = Math.max(0, bcol);

		ecol = ecol == "" ? this.shape[1] : parseInt(ecol);
		ecol = ecol < 0 ? this.shape[1] + ecol : ecol;
		ecol = Math.min(this.shape[1], ecol);

		var mat = new Matrix(null, [Math.max(0, erow-brow), Math.max(0, ecol-bcol)], this.datatype)
		for (var i=brow; i<erow; i++) {
			for (var j=bcol; j<ecol; j++) {
				mat.set([i-brow, j-bcol], this.get([i, j]))
			}
		}

		return mat;
	},

	third_slice: function(n) {   //get mat[:, :, n]
		var mat = new Matrix(null, [this.shape[0], this.shape[1]], this.datatype);
		for (var i=0; i<this.shape[0]; i++) {
			for (var j=0; j<this.shape[1]; j++) {
				mat.set([i, j], this.get([i, j, n]));
			}
		}
		return mat;
	},

	argmax: function(axis) {		//暂时只支持3维矩阵
		if (axis == undefined) {

		} 
		else if (!this.shape[axis]) {
			throw "unkonwn axis";
		}
		else {
			var shape = [];
			for (var i=0; i<this.shape.length; i++) {
				if (i != axis) {
					shape.push(this.shape[i]);
				}
			}

			var mat = new Matrix(null, shape, this.datatype);
			for (var i=0; i<mat.shape[0]; i++) {
				for (var j=0; j<mat.shape[1]; j++) {
					var maxI = 0;
					for (var k=1; k<this.shape[axis]; k++) {
						if (this.get([i, j, k]) >= this.get([i, j, maxI])) {
							maxI = k;
						}
					}
					mat.set([i, j], maxI);
				}
			}
			return mat;
		}
	},

	sum: function(axis) {		//暂时只支持3维矩阵
		if (axis == undefined) {

		} 
		else if (!this.shape[axis]) {
			throw "unkonwn axis";
		}
		else {
			var shape = [];
			for (var i=0; i<this.shape.length; i++) {
				if (i != axis) {
					shape.push(this.shape[i]);
				}
			}

			var mat = new Matrix(null, shape, this.datatype);
			for (var i=0; i<mat.shape[0]; i++) {
				for (var j=0; j<mat.shape[1]; j++) {
					var sum = 0;
					for (var k=0; k<this.shape[axis]; k++) {
						sum += this.get([i, j, k]);
					}
					mat.set([i, j], sum);
				}
			}
			return mat;
		}
	}
}

var MatLib = {

	column_stack: function(mat1, mat2) {
		if (mat1.shape[0] != mat2.shape[0]) {
			throw "row not equal";
		}
		var mat = new Matrix(null, [mat1.shape[0], mat1.shape[1] + mat2.shape[1]], mat1.datatype)
		for (var i=0; i<mat1.shape[0]; i++) {
			for (var j=0; j<mat1.shape[1]; j++) {
				mat.set([i, j], mat1.get([i, j]));
			}
			for (var j=0; j<mat2.shape[1]; j++) {
				mat.set([i, j+mat1.shape[1]], mat2.get([i, j]));
			}
		}

		return mat;
	},

	row_stack: function(mat1, mat2) {
		if (mat1.shape[1] != mat2.shape[1]) {
			throw "col not equal";
		}
		var mat = new Matrix(null, [mat1.shape[0] + mat2.shape[0], mat1.shape[1]], mat1.datatype)
		for (var j=0; j<mat1.shape[1]; j++) {
			for (var i=0; i<mat1.shape[0]; i++) {
				mat.set([i, j], mat1.get([i, j]));
			}
			for (var i=0; i<mat2.shape[0]; i++) {
				mat.set([i + mat1.shape[0], j], mat2.get([i, j]));
			}
		}

		return mat;
	},

	sumsqrt: function(mat1, mat2) {
		if (mat1.size != mat2.size) {
			throw "row or col not equal";
		}
		var mat = new Matrix(null, mat1.shape, mat1.datatype)
		for (var i=0; i<mat.size; i++) {
			mat.data[i] = Math.sqrt(mat1.data[i]*mat1.data[i] + mat2.data[i]*mat2.data[i]);
		}

		return mat;
	},


	rot90c: function(mat) {
		//矩阵顺时针旋转90°
		var rmat = new Matrix(mat.data, mat.shape, mat.datatype);

        for (var layer=0; layer<rmat.shape[0]/2; layer++) {  
            var first = layer;                
            var last = rmat.shape[0]-1-layer;
            for (var i=layer; i<last; i++) {  
                var offset = i-layer;  
                var top = rmat.get([first, i]);

                rmat.set([first, i], rmat.get([last-offset, first]));  			//top=left
                rmat.set([last-offset, first], rmat.get([last, last-offset]));  //left=bottom
                rmat.set([last, last-offset], rmat.get([i, last]));  			//bottom=right
                rmat.set([i, last], top);  										//right=top
            }  
        }  
		return rmat;
	},

	rot90: function(mat) {
		//矩阵逆时针旋转90°
		var rmat = new Matrix(mat.data, mat.shape, mat.datatype);
		for (var layer=0; layer<rmat.shape[0]/2; layer++) {  
		    var first = layer;                
		    var last = rmat.shape[0]-1-layer;
		    for (var i=layer; i<last; i++) {  
		        var offset = i-layer;  
		        var top = rmat.get([first, i]);

		        rmat.set([first, i], rmat.get([i, last]));  					//top=right
		        rmat.set([i, last], rmat.get([last, last-offset]));  			//right=bottom
		        rmat.set([last, last-offset], rmat.get([last-offset, first]));  //bottom=left
		        rmat.set([last-offset, first], top);  							//left=top
		    }  
		}  
		return rmat;
	},

	rot180: function(mat) {
		//矩阵旋转180°
		var rmat = new Matrix(mat.data, mat.shape, mat.datatype);
		for (var layer=0; layer<rmat.shape[0]/2; layer++) {  
		    var first = layer;                
		    var last = rmat.shape[0]-1-layer;
		    for (var i=layer; i<last; i++) {  
		        var offset = i-layer;  
		        var top = rmat.get([first, i]);
		        var left = rmat.get([last-offset, first]);

		        rmat.set([first, i], rmat.get([last, last-offset]));  			//top=bottom
		        rmat.set([last, last-offset], top);  							//bottom=top
		        rmat.set([last-offset, first], rmat.get([i, last]));  			//left=right
		        rmat.set([i, last], left);  									//right=left
		    }  
		}  
		return rmat;
	},

	conv2: function(mat1, mat2, shape) {
		//计算mat1与mat2的卷积  shape 只支持same 和 full
		shape = shape == undefined ? "same" : shape;
		var r1 = (mat2.shape[0]-1), c1 = (mat2.shape[1]-1);

		var mat1_ext = new Matrix(null, [mat1.shape[0] + 2*r1, mat1.shape[1] + 2*c1], mat1.datatype);
		for (var i=0; i<mat1.shape[0]; i++) {
			for (var j=0; j<mat1.shape[1]; j++) {
				mat1_ext.set([i+r1, j+c1], mat1.get([i, j]));  //mat1_ext为mat1的扩展
			}
		}

		mat2 = MatLib.rot180(mat2);								//mat2选择180°

		//考虑mat2大部分都是0，因此简化计算量
		var nozeros = [];  //记录mat2中非0元素
		var ones = []; 	   //记录mat2中1的元素
		for (var k=0; k<mat2.shape[0]; k++) {
			for (var l=0; l<mat2.shape[1]; l++) {
				var v = mat2.get([k, l]);
				if(v == 1) {
					ones.push([k, l, v]);
				}
				else if(v!= 0) {
					nozeros.push([k, l, v]);
				}
			}
		}
		console.log("conv2 nozeros length ", nozeros.length, "ones length", ones.length);

		if (shape == "full") {

			var mat = new Matrix(null, [mat1.shape[0] + mat2.shape[0] - 1, mat1.shape[1] + mat2.shape[1] - 1], mat1.datatype);
			for (var i=0; i<mat.shape[0]; i++) {
				for (var j=0; j<mat.shape[1]; j++) {
					var sum = 0;
					// for (var k=0; k<mat2.shape[0]; k++) {
					// 	for (var l=0; l<mat2.shape[1]; l++) {
					// 		sum += mat2.get([k, l])*mat1_ext.get([k+i, l+j]);
					// 	}
					// }
					for(var k=0; k<ones.length; k++) {
						sum += mat1_ext.get([ones[k][0] + i, ones[k][1]+j]);	//去除一个乘法减少计算量
					}
					for(var k=0; k<nozeros.length; k++) {
						sum += nozeros[k][2]*mat1_ext.get([nozeros[k][0] + i, nozeros[k][1]+j]);
					}
					mat.set([i, j], sum);
				}
			}
			return mat;
		}
		else if (shape == "same") {

			r1 = parseInt((mat2.shape[0]-1)/2), c1 = parseInt((mat2.shape[1]-1)/2);
			var mat = new Matrix(null, mat1.shape, mat1.datatype);
			for (var i=0; i<mat.shape[0]; i++) {
				for (var j=0; j<mat.shape[1]; j++) {
					var sum = 0;
					var ri = i + r1, rj = j + c1;
					for(var k=0; k<ones.length; k++) {
						sum += mat1_ext.get([ones[k][0] + ri, ones[k][1] + rj]);	//去除一个乘法减少计算量
					}
					for(var k=0; k<nozeros.length; k++) {
						sum += nozeros[k][2]*mat1_ext.get([nozeros[k][0] + ri, nozeros[k][1] + rj]);
					}
					mat.set([i, j], sum);
				}
			}
			return mat;
		}
		else {
			throw "conv2 unkonwn shape";
		}
	},

	specil_conv2: function(mat1, mat2, out, n) {
		//该函数简化计算步骤，实际为公式   out[:, :, n] = signal.convolve2d(mat1[:, :, n], mat2, "same")

		var r1 = (mat2.shape[0]-1), c1 = (mat2.shape[1]-1);

		mat2 = MatLib.rot180(mat2);								//mat2选择180°

		//考虑mat2大部分都是0，因此简化计算量
		var ones = []; 	   //记录mat2中1的元素, mat2中的元素非0即1
		for (var k=0; k<mat2.shape[0]; k++) {
			for (var l=0; l<mat2.shape[1]; l++) {
				var v = mat2.get([k, l]);
				if(v != 0) {
					ones.push([k, l, v]);
				}
			}
		}
		console.log("conv2 ones length", ones.length);

		var r2 = parseInt((mat2.shape[0]-1)/2) - r1, c2 = parseInt((mat2.shape[1]-1)/2) - c1;
		for (var i=0; i<out.shape[0]; i++) {
			for (var j=0; j<out.shape[1]; j++) {
				var sum = 0;
				var ri = i + r2, rj = j + c2;
				for(var k=0; k<ones.length; k++) {
					var r3 = ones[k][0] + ri, c3 = ones[k][1] + rj;
					if(r3 >= 0 && r3 < mat1.shape[0] && c3 >= 0 && c3 < mat1.shape[1]) {
						sum += mat1.get([r3, c3, n]);
					}
				}
				out.set([i, j, n], sum);
			}
		}
	}
}