(function(){
	//地图类
	var Map = window.Map = function(row,col,type){
		//存储一个数字（精灵的类型）的标志性的地图状态，并不是真的精灵
		this.code = [
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
			[]
		];
		//这个矩阵也是7*7的，是存放真实精灵的
		this.sprites = [[],[],[],[],[],[],[]];
		//应该下落多少行
		this.needToBeDropDown = [[],[],[],[],[],[],[]];
		//实例化地图的时候，就要随机7个参演选手，从14个人中选一个
		var sArr = ["i0","i1","i2","i3","i4","i5","i6","i7","i8","i9","i10","i11","i12","i13","i14"];
		//随机7个样本
		this.imageNameArr = _.sample(sArr,7);
		//调用函数
		this.createSpritesByCode();
	}
	//根据code矩阵来创建sprites数组
	Map.prototype.createSpritesByCode = function(){
		for (var i = 0; i < 7; i++) {
			for (var j = 0; j < 7; j++) {
				//让真实元素的矩阵，重新按照代码矩阵new出来
				this.sprites[i][j] = new Sprite(i,j,this.imageNameArr[this.code[i][j]]); 
			}
		}
	}
	//渲染
	Map.prototype.render = function(){
		for (var i = 0; i < 7; i++) {
			for (var j = 0; j < 7; j++) {
				this.sprites[i][j].update(); 
				this.sprites[i][j].render(); 
			}
		}
	}
	//检查是否能消除，返回一个可以消除的位置数组，形如:
	//[{"row":0,"col":0}...]
	Map.prototype.check = function(){
		var arr = this.code;
		var result1 = [];

		for(row = 0 ; row < 7 ; row++){
			var i = 0;
			var j = 1;

			while(i < 7){
				if(arr[row][i] != arr[row][j]){
					if(j - i >= 3){
						for(var m = i ; m <= j - 1 ; m++){
							result1.push({"row" : row , "col" : m});
						}
					}
					i = j;
				}
				j++;
			}
		}
		 
		var result2 = [];

		for(col = 0 ; col < 7 ; col++){
			var i = 0;
			var j = 1;

			while(i < 7){
				if(arr[i][col] != arr[j][col]){
					if(j - i >= 3){
						for(var m = i ; m <= j - 1 ; m++){
							var isExist = false;
							//再次遍历result1数组，看看我要放置的(m,col)是不是已经存在
							_.each(result1,function(item){
								if(item.row == m && item.col == col){
									isExist = true;
								}
							});
							!isExist && result2.push({"row" : m , "col" : col});
						}
					}
					i = j;
				}
				j++;
			}
		}
		var allresult = result1.concat(result2);
		return allresult;
	}
	//消除，接受一个形如[{"row":0,"col":0}...]的一个数组当做参数
	Map.prototype.eliminate = function(callback){
		//验证是不是达到combo，我们认为如果间隔150帧（3秒）以内发生消除，我们视作compo
		if(game.fno - game.lastEliminateFrame <= 150){
			game.combo ++;
		}else{
			game.combo = 1;
		}
		//指定消除音效，小于等于8的时候，用他们的数字，否则恒定为8。
		var xiaochuyinxiao = game.combo < 8 ? "e" + game.combo : "e8";
		game.Music[xiaochuyinxiao].load();	//如果有重合，再次加载一次
		game.Music[xiaochuyinxiao].play();
		//把这一帧的编号存入
		game.lastEliminateFrame = game.fno;
		//加分
		game.score += 2 * game.combo;

		var self = this;
		_.each(this.check(),function(item){
			//爆炸
			self.sprites[item.row][item.col].bomb();
			//在code中设置这个位置为-1
			self.code[item.row][item.col] = "";
		});

		//执行回调函数
		game.registCallback(16,callback);
	}
	//下落方法
	Map.prototype.dropdown = function(frames,callback){
		//统计所有0到5行的元素应该下落多少行
		for(var row = 0 ; row <= 5 ; row++){
			for(var col = 0 ; col <= 6 ; col++){
				//看看这个元素是不是空，如果是空了，此时不需要下落
				if(this.code[row][col] === ""){
					this.needToBeDropDown[row][col] = 0;
				}else{
					//统计这个元素下面有多少个空
					var count = 0;
					for(var _row = row + 1 ; _row <= 6 ; _row++){
						if(this.code[_row][col] === ""){
							count ++;
						}
					}
					this.needToBeDropDown[row][col] = count;
				}
			}	
		}
		//至此，我们已经统计完毕每一个人应该下落多少行。接下来要发出命令，让他们下落即可。
		for(var row = 5 ; row >= 0 ; row--){
			for(var col = 0 ; col <= 6 ; col++){
				//应该下落的行数
				var needDown = this.needToBeDropDown[row][col];
				//精灵移动
				this.sprites[row][col].moveTo(row + needDown , col , frames);
				//让数字矩阵也变化
				this.code[row + needDown][col] = this.code[row][col];
				if(this.needToBeDropDown[row][col] !=0) this.code[row][col] = "";
			}
		}

		game.registCallback(frames,callback);
	}

	//补齐方法
	Map.prototype.supply = function(frames,callback){
		var supplyNumberArr = [0,0,0,0,0,0,0];
		//遍历当前的矩阵，看看矩阵中每列缺多少个，准备new出来
		for(var col = 0 ; col < 7 ; col++){
			for(var row = 0 ; row < 7 ; row++){
				if(this.code[row][col] === ""){
					supplyNumberArr[col]++;
					this.code[row][col] = _.random(0,6);
				}
			}
		}

		//此时我们要先补足code阵
		this.createSpritesByCode();

		//此时我们命令刚才添加的这些元素，瞬间移动到一个位置
		for(var col = 0 ; col < 7 ; col++){
			for(var row = 0 ; row < supplyNumberArr[col] ; row++){
				this.sprites[row][col].y = 10;
				this.sprites[row][col].moveTo(row,col,frames);
			}
		}

		game.registCallback(frames,callback);
	}

	//交换元素
	Map.prototype.exchange = function(startRow,startCol,targetRow,targetCol){
		console.log("我是exchange函数，你试图" + startRow + ","+ startCol + "←→" + targetRow + "," + targetCol);

		//命令两个元素向彼此的位置运动
		this.sprites[startRow][startCol].moveTo(targetRow,targetCol,6);
		this.sprites[targetRow][targetCol].moveTo(startRow,startCol,6);
		//改变FSM为“动画状态”目的是防止用户再次点击元素
		game.fsm = "动画中";

		var self = this;
		//6帧之后，改变矩阵
		game.registCallback(6,function(){
			//改变矩阵中两个元素的位置，用第三方来周转。和a、b变量交换值一个意思。
			var temp = self.code[startRow][startCol];
			self.code[startRow][startCol] = self.code[targetRow][targetCol];
			self.code[targetRow][targetCol] = temp;
			//此时check一下！check是检查能否消行的
			if(self.check().length == 0){
				//滑动是失败的，是不能消除的
				//再做一个动画，交换回来的动画
				self.sprites[startRow][startCol].moveTo(startRow,startCol,6);
				self.sprites[targetRow][targetCol].moveTo(targetRow,targetCol,6);
				//同时刚刚6帧之前的矩阵的交换，也要再次交换回来，相当于一个撤销。
				var temp = self.code[startRow][startCol];
				self.code[startRow][startCol] = self.code[targetRow][targetCol];
				self.code[targetRow][targetCol] = temp;
				//6帧之后仍然是A
				game.registCallback(6,function(){
					game.fsm = "A";
				});
			}else{
				//如果能够消除，要在物理sprites矩阵上交换两个元素位置
				var temp = self.sprites[startRow][startCol];
				self.sprites[startRow][startCol] = self.sprites[targetRow][targetCol];
				self.sprites[targetRow][targetCol] = temp;
				//改变状态机为C，奇迹就会发生，系统就会给你做消除动画、下落动画、补充元素动画。如此反复下去了。
				game.fsm = "C";
			}
		});
	}
})();