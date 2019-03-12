(function(){
	//精灵类，行号0~6，列号0~6，type表示类型0~7。
	var Sprite = window.Sprite = function(row,col,imageName){
		this.row = row;	//所在行
		this.col = col;	//所在的列
 		this.x = calcXYbyRowCol(this.row,this.col).x;   //自己的位置
 		this.y = calcXYbyRowCol(this.row,this.col).y;	//自己的位置
 		this.w = calcXYbyRowCol(this.row,this.col).w;	//自己的宽度、高度
		this.imageName = imageName;  //图片名字
		this.isMove = false;		//自己是不是在动
		this.moveFno = 0;	//小帧号
		this.isBomb = false;
		this.bombStep = 0;	//0~7
		this.isHide = false;
	}
	//更新
	Sprite.prototype.update = function(){
		if(this.isHide) return;

		//isMove属性只要为true此时就会让元素移动
		if(this.isMove){
			this.x += this.dx;
			this.y += this.dy;
			//帧编号变小
			this.moveFno--;
		}

		//当小帧号减到0了，此时就停止运动
		if(this.moveFno <= 0){
			this.isMove = false;
		}

		//如果在爆炸，此时改变爆炸步骤属性，加1
		if(this.isBomb){
			game.fno % 2 == 0 && this.bombStep++;
			//验收
			if(this.bombStep > 7){
				//让自己隐藏
				this.isHide = true;
			}

			
		}
	}
	//渲染
	Sprite.prototype.render = function(){
		//如果这个精灵在隐藏，此时什么都不渲染
		if(this.isHide) return;
		//使用图片的时候，希望图片稍微小一点，但是不能影响自己的x、y，不影响的原因是一会儿精灵要移动
		//就是一个小的修正，图片宽度高度减去4，此时图片渲染的位置x、y移动2。
		//但是属性还是原来的属性
		if(!this.isBomb){
			game.ctx.drawImage(game.R[this.imageName],this.x + 2,this.y + 2,this.w - 4,this.w - 4);
		}else{
			game.ctx.drawImage(game.R["bomb"],200 * this.bombStep,0,200,200,this.x,this.y,this.w,this.w);
		}
	}
	//运动
	Sprite.prototype.moveTo = function(targetRow,targetCol,duringFrames){
		this.isMove = true;

		//计算目标的x、y值：
		var targetX = calcXYbyRowCol(targetRow,targetCol).x;
		var targetY = calcXYbyRowCol(targetRow,targetCol).y;

		//看看差多少
		var distanceX = targetX - this.x;
		var distanceY = targetY - this.y;

		//平均分配到那么多帧里面
		this.dx = distanceX / duringFrames;
		this.dy = distanceY / duringFrames;

		// //console.log("你现在命令第",this.row,"行，第",this.col,"列元素运动到第",targetRow,"行第",targetCol,"列。我计算出了x差了",distanceX,"，y差了",distanceY,"，所以每帧x要变化",this.dx,
		// 	",y要变化",this.dy);

		//设置moveFno的值为你要求的帧数
		this.moveFno = duringFrames;
	}
	//爆炸函数
	Sprite.prototype.bomb = function(){
		this.isBomb = true;
	}

	//来一个辅助函数，计算通过行号、列号，计算x和y和w
	function calcXYbyRowCol(row,col){

		//计算出自己的位置
		return {
			"x" : game.basex + game.spritewh * col,
			"y" : game.basey + game.spritewh * row,
			"w" : game.spritewh
		}
	}
})();