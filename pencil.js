
var Matrix = function(data, shape, datatype) {
	this.shape = shape;
	this.size = 1;
	for(var i=0; i<shape.length; i++) {
		this.size *= this.shape[i];
	}
	datatype == undefined ? datatype = Float32Array : true;
	this.data = new datatype(this.size);
	this.datatype = datatype;
	data && this.data.set(data);
}

Matrix.prototype = {

	min: function() {
		var m = this.data[0];
		for(var i=1; i<this.data.length; i++) {
			if(this.data[i] < m) {
				m = this.data[i];
			}
		}
		return m;
	},

	max: function() {
		var m = this.data[0];
		for(var i=1; i<this.data.length; i++) {
			if(this.data[i] > m) {
				m = this.data[i];
			}
		}
		return m;
	},

	_getindex: function(suffix) {
		for(var i=suffix.length-1; i<this.shape.length; i++) {
			suffix.push(0); //不足部分补充0
		}
		var product = 1;
		var index = 0;
		for(var i=this.shape.length-1; i>=0; i--) {
			if(suffix[i] >= this.shape[i]) {
				throw "index out of limit"
			}
			index += product*suffix[i];
			product *= this.shape[i];
		}
		return index;
	},

	get: function(suffix) {
		var index = this._getindex(suffix);
		return this.data[index];
	},

	set: function(suffix, value) {
		if(isNaN(value)) {
			throw "NaN value error";
		}
		var index = this._getindex(suffix);
		this.data[index] = value;
	},

	abs: function() {
		for(var i=1; i<this.data.length; i++) {
			this.data[i] = Math.abs(this.data[i])
		}
		return this;
	},

	sqrt: function() {
		for(var i=1; i<this.data.length; i++) {
			this.data[i] = Math.sqrt(this.data[i])
		}
		return this;
	},

	sub: function(mat1) {
		if(mat1.size != this.size) {
			throw "size is not equal";
		}

		var mat = new Matrix(null, this.shape, this.datatype);
		for(var i=0; i<this.size;i++) {
			mat.data[i] = this.data[i]-mat1.data[i];
		}
		return mat;
	},

	child: function(rows, cols) {
		rows = rows == undefined ? ["", ""] : rows.split(":");
		cols = cols == undefined ? ["", ""] : cols.split(":");

		if(rows.length < 2 || cols.length < 2) {
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
		for(var i=brow; i<erow; i++) {
			for(var j=bcol; j<ecol; j++) {
				mat.set([i-brow, j-bcol], this.get([i, j]))
			}
		}

		return mat;
	}
}

var MatLib = {

	column_stack: function(mat1, mat2) {
		if(mat1.shape[0] != mat2.shape[0]) {
			throw "row not equal";
		}
		var mat = new Matrix(null, [mat1.shape[0], mat1.shape[1] + mat2.shape[1]], mat1.datatype)
		for(var i=0; i<mat1.shape[0]; i++) {
			for(var j=0; j<mat1.shape[1]; j++) {
				mat.set([i, j], mat1.get([i, j]));
			}
			for(var j=0; j<mat2.shape[1]; j++) {
				mat.set([i, j+mat1.shape[1]], mat2.get([i, j]));
			}
		}

		return mat;
	},

	row_stack: function(mat1, mat2) {
		if(mat1.shape[1] != mat2.shape[1]) {
			throw "col not equal";
		}
		var mat = new Matrix(null, [mat1.shape[0] + mat2.shape[0], mat1.shape[1]], mat1.datatype)
		for(var j=0; j<mat1.shape[1]; j++) {
			for(var i=0; i<mat1.shape[0]; i++) {
				mat.set([i, j], mat1.get([i, j]));
			}
			for(var i=0; i<mat2.shape[0]; i++) {
				mat.set([i + mat1.shape[0], j], mat2.get([i, j]));
			}
		}

		return mat;
	},

	sumsqrt: function(mat1, mat2) {
		if(mat1.size != mat2.size) {
			throw "row or col not equal";
		}
		var mat = new Matrix(null, mat1.shape, mat1.datatype)
		for(var i=0; i<mat.size; i++) {
			mat.data[i] = Math.sqrt(mat1.data[i]*mat1.data[i] + mat2.data[i]*mat2.data[i]);
		}

		return mat;
	},


	rot90c: function(mat) {
		//矩阵顺时针旋转90°
		var rmat = new Matrix(mat.data, mat.shape, mat.datatype);

        for(var layer=0; layer<rmat.shape[0]/2; layer++)  
        {  
            var first = layer;                
            var last = rmat.shape[0]-1-layer;
            for(var i=layer; i<last; i++)  
            {  
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
		for(var layer=0; layer<rmat.shape[0]/2; layer++)  
		{  
		    var first = layer;                
		    var last = rmat.shape[0]-1-layer;
		    for(var i=layer; i<last; i++)  
		    {  
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
}

var PencilDraw = function(options) {
	this._url = options["url"];
	this._gammaS = options["gammaS"] || 1;
	this._gammaI = options["gammaI"] || 1;
	this._img = new Image();
	this._canvas = document.createElement("canvas");
	this._context = this._canvas.getContext("2d");
    this._img.onload = this._init.bind(this);
	this._img.src = this._url;
}

PencilDraw.prototype = {

	_init: function() {

		this._canvas.width = this._img.naturalWidth;
		this._canvas.height = this._img.naturalHeight;
        this._context.drawImage(this._img, 0, 0);
        var imgdata = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height);

        var J = this._img2gray(imgdata);
        var S = this._getS(J);
	},

	_img2gray: function(imgdata) {
		var channel = imgdata.data.length/imgdata.width/imgdata.height;
		if(channel == 3 || channel == 4) {
			var data = new Uint8ClampedArray(imgdata.width*imgdata.height);
			for(var i=0; i<data.length; i++) {
				data[i] = (imgdata.data[i*channel]*299 + imgdata.data[i*channel+1]*587 + imgdata.data[i*channel+2]*114)/1000
			}
			return new Matrix(data, [imgdata.height, imgdata.width], Uint8ClampedArray);
		}
		else {
			return new Matrix(imgdata.data, [imgdata.height, imgdata.width], Uint8ClampedArray);
		}
	},

	_img2double: function(mat) {
		var min = mat.min();
		var max = mat.max();
		min = 2;
		var dis = max-min;
		var m = mat.shape[0], n = mat.shape[1];
		var J = new  Matrix(null, [m, n]);

		for(var x=0; x<m; x++) {
			for(var y=0; y<n; y++) {
                var b = (mat.get([x, y]) - min) / dis;
                J.set([x, y] ,b);
			}
		}
		return J;
	},

	rotL: function(L, n1, direct, n2) {

		var mat = new Matrix(null, [L.shape[0], L.shape[1]], L.datatype);
		for(var i=0; i<L.shape[0]; i++) {
			for(var j=0; j<L.shape[1]; j++) {
				mat.set([i, j], L.get([i, j, n2]));
			}
		}
		if(direct == "rot90c") {
			mat = MatLib.rot90c(mat);
		}
		else {
			mat = MatLib.rot90(mat);
		}

		for(var i=0; i<L.shape[0]; i++) {
			for(var j=0; j<L.shape[1]; j++) {
				L.set([i, j, n1], mat.get([i, j]));
			}
		}
	},

	_getL: function(line_len) {
		var half_line_len = line_len / 2;
		var L = new Matrix(null, [line_len, line_len, 8]);
		for(var n =0; n<8; n++) {
			if (n == 0 || n == 1 || n == 2 || n == 7) {
				for(var x=0; x<line_len; x++) {
					var y = Math.round(((x+1) - half_line_len) * Math.tan(Math.PI/8*n));
					y = half_line_len - y;
					if (0 < y && y <= line_len){
						L.set([parseInt(y-1), x, n], 1)
					}
					if (n < 7) {
						// L[:, :, n+4] = this._rot90c(L[:, :, n])
						this.rotL(L, n+4, "rot90", n);
					}
				}
			}
		}
		//L[:, :, 3] = rot90(L[:, :, 7])
		this.rotL(L, 3, "rot90c", 7);
		return L;
	},

	_getS: function(J) {
		var line_len_divisor = 40; 	//卷积核大小与图片的倍数关系
		var h = J.shape[0], w = J.shape[1];
		var line_len_double = Math.min(h, w)/line_len_divisor;

		var line_len = parseInt(line_len_double);
		line_len += line_len % 2;

		/*
		计算梯度
		compute the image gradient 'imag'
		*/
		var dJ = this._img2double(J)
		var Ix = MatLib.column_stack(dJ.child(":", "0:-1").sub(dJ.child(":", "1:")).abs(), new Matrix(null, [h, 1]));
		var Iy = MatLib.row_stack(dJ.child("0:-1", ":").sub(dJ.child("1:", ":")).abs(), new Matrix(null, [1, w]));
		// eq.1
		var imag = MatLib.sumsqrt(Ix, Iy);
		// create the 8 directional line segments L
		// L[:, :, index]是一个用来表示第index+1个方向的线段
		// 是一个卷积核
		var L = this._getL(line_len);
		var G = new Matrix(null, [J.shape[0], J.shape[1], 8])
	    // for n in range(8):
	    //     G[:, :, n] = signal.convolve2d(imag, L[:, :, n], "same")    // eq.2

	}
}