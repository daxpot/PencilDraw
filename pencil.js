
var PencilDraw = function(options) {
	this._url = options["url"];
	this._gammaS = options["gammaS"] || 1;
	this._gammaI = options["gammaI"] || 1;
	this._img = new Image();
	this._canvas = document.createElement("canvas");
	this._context = this._canvas.getContext("2d");
	this._loaded = false;
	this._drawcanvas = options["canvas"] || null;
	this._drawing = false
    this._img.onload = function(){
    	this._loaded = true;
    	if(this._drawcanvas) {
    		this.draw(this._drawcanvas);
    	}

    }.bind(this);
    this._img.onerror = function() {

    }.bind(this);
	this._img.src = this._url;
}

PencilDraw.prototype = {

	_img2gray: function(imgdata) {
		var channel = imgdata.data.length/imgdata.width/imgdata.height;
		if (channel == 3 || channel == 4) {
			var data = new Uint8ClampedArray(imgdata.width*imgdata.height);
			for (var i=0; i<data.length; i++) {
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
		min = 2;
		var max = mat.max();
		var dis = max-min;
		var m = mat.shape[0], n = mat.shape[1];
		var J = new  Matrix(null, [m, n]);

		for (var x=0; x<m; x++) {
			for (var y=0; y<n; y++) {
                var b = (mat.get([x, y]) - min) / dis;
                J.set([x, y] ,b);
			}
		}
		return J;
	},

	_rotS_L: function(L, n1, direct, n2) {

		var mat = L.third_slice(n2);

		if (direct == "rot90c") {
			mat = MatLib.rot90c(mat);
		}
		else {
			mat = MatLib.rot90(mat);
		}

		for (var i=0; i<L.shape[0]; i++) {
			for (var j=0; j<L.shape[1]; j++) {
				L.set([i, j, n1], mat.get([i, j]));
			}
		}
	},

	_getS_L: function(line_len) {
		var half_line_len = line_len / 2;
		var L = new Matrix(null, [line_len, line_len, 8]);
		for (var n =0; n<8; n++) {
			if (n == 0 || n == 1 || n == 2 || n == 7) {
				for (var x=0; x<line_len; x++) {
					var y = Math.round(((x+1) - half_line_len) * Math.tan(Math.PI/8*n));
					y = half_line_len - y;
					if (0 < y && y <= line_len){
						L.set([parseInt(y-1), x, n], 1)
					}
					if (n < 7) {
						// L[:, :, n+4] = this._rot90c(L[:, :, n])
						this._rotS_L(L, n+4, "rot90", n);
					}
				}
			}
		}
		//L[:, :, 3] = rot90(L[:, :, 7])
		this._rotS_L(L, 3, "rot90c", 7);
		return L;
	},

	_getS_G: function(imag, L) {
		var G = new Matrix(null, [imag.shape[0], imag.shape[1], 8]);
	    for (var n=0; n<8; n++) {
	    	//G[:, :, n] = signal.convolve2d(Imag, L[:, :, n], "same")    # eq.2
	    	var Ln = L.third_slice(n);
	    	// var Gn = MatLib.conv2(imag, Ln, "same")    // eq.2
	    	// for (var i=0; i<Gn.shape[0]; i++) {
	    	// 	for (var j=0; j<Gn.shape[1]; j++) {
	    	// 		G.set([i, j, n], Gn.get([i, j]))
	    	// 	}
	    	// }
	    	MatLib.specil_conv2(imag, Ln, G, n);
	    }
	    return G;
	},

	_getS_C: function(imag, Gindex) {
		var C = new Matrix(null, [imag.shape[0], imag.shape[1], 8]);
		for (var n=0; n<8; n++) {
	    	for (var i=0; i<C.shape[0]; i++) {
	    		for (var j=0; j<C.shape[1]; j++) {
	    			var v = 0;
	    			if(Gindex.get([i, j]) == n) {
	    				v = imag.get([i, j]);
	    			}
	    			C.set([i, j, n], v);
    			}
    		}
		}
		return C;
	},

	_getS_Spn: function(C, L) {
		var Spn = new Matrix(null, C.shape);
		for (var n=0; n<8; n++) {
			//Spn[:, :, n] = signal.convolve2d(C[:, :, n], L[:, :, n], "same")
			var Ln = L.third_slice(n);
			// var Cn = C.third_slice(n);
			// var Spnn = MatLib.conv2(Cn, Ln, "same")    // eq.2
			// for (var i=0; i<Spnn.shape[0]; i++) {
			// 	for (var j=0; j<Spnn.shape[1]; j++) {
			// 		Spn.set([i, j, n], Spnn.get([i, j]))
			// 	}
			// }
			MatLib.specil_conv2(C, Ln, Spn, n);
		}
		return Spn;
	},

	_getS_S: function(Sp) {
		var max = Sp.data[0], min = max;
		var S = new Matrix(null, Sp.shape, Sp.datatype);
		for (var i=0;i<Sp.size;i++) {
			if(Sp.data[i] > max) {
				max = Sp.data[i];
			}
			if(Sp.data[i] < min) {
				min = Sp.data[i];
			}
		}
		var dis = max - min;
		var per = max/dis;
		for (var i=0;i<Sp.size;i++) {
			S.data[i] = per-Sp.data[i]/dis;
		}
		return S;
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
		var L = this._getS_L(line_len);
		var G = this._getS_G(imag, L);
		var Gindex = G.argmax(2);		//获取最大值元素所在的下标 axis表示维度
		var C = this._getS_C(imag, Gindex);
		var Spn = this._getS_Spn(C, L);
		var Sp = Spn.sum(2);			//八个方向的求和, 并执行归一化操作
		var S = this._getS_S(Sp);
		return S;
	},

	draw: function(canvas) {
		if(this._drawing) {
			return;
		}
		if(this._loaded == false) {
			this._drawcanvas = canvas;
			return;
		}
 		var st = new Date().getTime();
		var w = this._img.naturalWidth;
		var h = this._img.naturalHeight;
		this._canvas.width = w;
		this._canvas.height = h;
        this._context.drawImage(this._img, 0, 0);
        var imgdata = this._context.getImageData(0, 0, w, h);

        var J = this._img2gray(imgdata);
        var S = this._getS(J);
        for(var i=0; i<S.shape[0]; i++) {
        	for(var j=0; j<S.shape[1]; j++) {
        		var index = i*S.shape[1] + j;
        		var index2 = 4*index;
        		imgdata.data[index2] = S.data[index]*255;
        		imgdata.data[index2 + 1] = S.data[index]*255;
        		imgdata.data[index2 + 2] = S.data[index]*255; 
        		imgdata.data[index2 + 4] = 255;
        	}
        }
        var context = canvas.getContext("2d");
        canvas.width = w;
        canvas.height = h;
        context.putImageData(imgdata, 0, 0, 0, 0, w, h);
 		var et = new Date().getTime();
 		console.log("time", (et-st)/1000, "seconds");
	}
}