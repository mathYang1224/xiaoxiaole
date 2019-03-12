(function(){
	var Game = window.Game = function(params){
		//得到画布
		this.canvas = document.querySelector(params.canvasid);
		//上下文
		this.ctx = this.canvas.getContext("2d");
		//资源文件地址
		this.Rjsonurl = params.Rjsonurl;
		//帧编号
		this.fno = 0;
		//设置画布的宽度和高度，设置为和屏幕一样宽、一样高
		this.init();
		//计算一些数值
		this.basex = 6; 			//最左列的x值
		this.paddingBottom = 70; 	//最下行的y值
		this.spritewh =  (this.canvas.width - this.basex * 2) / 7; //宽度、高度，因为是正方形所以一样
		this.basey = this.canvas.height - this.spritewh * 7 - this.paddingBottom;  //最上行的y值
		//combo数值
		this.combo = 1;
		this.lastEliminateFrame = 0;	//记录一下最后一次消除时候的帧编号
		//回调函数数组，key是帧编号，value是这个帧编号要做的事情
		this.callbacks = {}
		//剩余时间，单位是秒
		this.timing = 40;
		//分数
		this.score = 0;
	
		//事件锁，专门为手机事件设置的
		this.lock = true;

		//读取资源
		var self = this;
		//读取资源是一个异步函数，所以我们不知道什么时候执行完毕。但是其他的事情必须等到他完毕之后再执行，必须用回调函数。
		this.loadAllResource(function(){
			//我们封装的回调函数，这里表示全部资源读取完毕
			self.start();
			//绑定监听
			self.bindEvent();
		});
	}
	//初始化，设置画布的宽度和高度
	Game.prototype.init = function(){
		//读取视口的宽度和高度，
		var windowW = document.documentElement.clientWidth;
		var windowH = document.documentElement.clientHeight;
		//验收
		if(windowW > 414){
			windowW = 414;
		}else if(windowW < 320){
			windowW = 320;
		}
		if(windowH > 736){
			windowH = 736;
		}else if(windowH < 500){
			windowH = 500;
		}
		//让canvas匹配视口
		this.canvas.width = windowW;
		this.canvas.height = windowH;
	}

	//读取资源
	Game.prototype.loadAllResource = function(callback){
		//准备一个R对象
		this.R = {};
		this.Music = {};
		var self = this;	//备份
		//计数器
		var alreadyDoneNumber = 0;
		//发出请求，请求JSON文件。
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4){
				var Robj = JSON.parse(xhr.responseText);
				//遍历数组
				for (var i = 0; i < Robj.images.length; i++) {
					//创建一个同名的key
					self.R[Robj.images[i].name] = new Image();
					//请求
					self.R[Robj.images[i].name].src = Robj.images[i].url;
					//监听
					self.R[Robj.images[i].name].onload = function(){
						alreadyDoneNumber++;
						//清屏
						self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
						//提示文字
						var txt = "正在加载资源" + alreadyDoneNumber + "/" + Robj.images.length + "请稍后";
						//放置居中的位置，屏幕的黄金分割点
						self.ctx.textAlign = "center";
						self.ctx.font = "20px 微软雅黑";
						self.ctx.fillText(txt, self.canvas.width / 2 ,self.canvas.height * (1 - 0.618));
						//判断是否已经全部加载完毕
						if(alreadyDoneNumber == Robj.images.length){
							callback();
						}
					}
				};

				for (var i = 0; i < Robj.music.length; i++) {
					//创建一个同名的key
					self.Music[Robj.music[i].name] = document.createElement("audio");
					//请求
					self.Music[Robj.music[i].name].src = Robj.music[i].url;
				}
			}
		}
		xhr.open("get",this.Rjsonurl,true);
		xhr.send(null);
	}
	//开始游戏
	Game.prototype.start = function(){
		var self = this;
		//状态机
		this.fsm = "B";	//A静稳 B检查 C消除下落补充新的
		//实例化地图
		this.map = new Map();
		//播放音乐
		this.Music["bgm"].loop = true;
		this.Music["bgm"].play();
		//开始游戏的时候的帧编号
		this.startFrame = this.fno;


		//设置定时器，游戏唯一定时器
		this.timer = setInterval(function(){
			//清屏
			self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
			//帧编号
			self.fno ++;
			//绘制背景，背景不在运动，所以它不是一个类，就是直接画上去
			self.ctx.drawImage(self.R["bg1"],0,0,self.canvas.width,self.canvas.height);
			//渲染logo
			self.ctx.drawImage(self.R["logo"],self.canvas.width / 2 - 531 / 4,0,531 / 2,392 / 2);
			//渲染一个半透明的盒子
			self.ctx.fillStyle = "rgba(0,0,0,.5)";
			self.ctx.fillRect(self.basex,self.basey, self.spritewh * 7 , self.spritewh * 7);
			
			//检查当前帧编号是不是回调函数中的帧编号
			if(self.callbacks.hasOwnProperty(self.fno)){
				//执行回调函数
				self.callbacks[self.fno]();
				//当这个事件做完之后，删除这个事件
				delete self.callbacks[self.fno];
			}
			//如果游戏结束，什么也不做
			if(self.isgameover){
				self.fsm = "gameover";
				//渲染你的分数
				self.ctx.font = "60px 微软雅黑";
				self.ctx.textAlign = "center";
				self.ctx.fillStyle = "#333";
				self.ctx.fillText("你的分数" + self.score , self.canvas.width / 2,self.canvas.height / 2);
				self.ctx.fillStyle = "orange";
				self.ctx.fillText("你的分数" + self.score , self.canvas.width / 2 + 2,self.canvas.height / 2 + 2);
				return;
			}

			//渲染地图，这个render里面包括精灵的update和render
			self.map.render();

			//当前的帧编号和开始游戏的差
			self.duringFrame = self.fno - self.startFrame;
			//剩余的帧数，一秒50帧
			self.restFrame = self.timing * 50 - self.duringFrame;
			//渲染一个倒计时条
			self.ctx.fillStyle = "#333";
			self.ctx.fillRect(6,self.canvas.height - 50,self.canvas.width - 12,28);
			self.ctx.fillStyle = "gold";
			self.ctx.fillRect(6,self.canvas.height - 50,(self.canvas.width - 12) * (self.restFrame / (self.timing * 50)),28);
			//判断时间是不是足够
			if(self.restFrame < 0){
				self.gameover();
			}

			

			//根据有限状态机，来决定做什么事情
			switch(self.fsm){
				case "A" :

					break;
				case "B" :
					//B状态表示检查是否能消除
					if(self.map.check().length != 0){
						//如果能的话，就去C状态
						self.fsm = "C";
					}else{
						//如果不能的话，就去A状态
						self.fsm = "A";
					}
					break;
				case "C" :
					self.map.eliminate(function(){
						self.map.dropdown(6,function(){
							self.map.supply(6,function(){
								self.fsm = "B";
							});
						});
					});
					//C这个状态是一个瞬间状态，这一个状态要发出动画指令。
					//而动画执行的时候不能维持C状态的，要不然动画指令会被持续发出。
					self.fsm = "动画状态";
					break;
			}

			//打印帧编号
			self.ctx.font = "16px consolas";
			self.ctx.textAlign = "left";
			self.ctx.fillStyle = "black";
			self.ctx.fillText("FNO:" + self.fno , 10 ,20);
			self.ctx.fillText("FSM:" + self.fsm , 10 ,40);
			self.ctx.fillText("COMBO:" + self.combo , 10 ,60);
			self.ctx.fillText("restFrame:" + self.restFrame , 10 ,80);
			self.ctx.fillText("score:" + self.score , 10 ,100);

		},20);
	}

	//回调函数方法
	Game.prototype.registCallback = function(howmanyframelater,fn){
		this.callbacks[this.fno + howmanyframelater] = fn;
	}
	//游戏结束
	Game.prototype.gameover = function(){
		//打一个标记
		this.isgameover = true;
		
	}
	//游戏重新开始
	Game.prototype.restart = function(){
		//打一个标记
		this.isgameover = false;
		//再给你一些时间
		this.timing = 40;
		//重置地图
		this.map = new Map();
		//重新记录开始游戏的帧数
		this.startFrame = this.fno;
		//改变状态机为B
		this.fsm = "B";
		//重置compo和分数
		this.score = 0;
		this.combo = 0;
	}
	//监听
	Game.prototype.bindEvent = function(){
		var self = this;
		this.canvas.addEventListener("touchstart",function(event){
			//如果是死亡状态，点击会再次进行游戏
			if(self.fsm == "gameover"){
				self.restart();
			}

			//如果当期那的状态机不是A状态，那么点击是无效的
			if(self.fsm != "A") return;

			var x = event.touches[0].clientX;
			var y = event.touches[0].clientY;
 
			//判断当前的鼠标点在了哪个元素身上
			//先根据鼠标的x值来决定点击到了第几列上，两边padding是12，精灵宽度是7分之一的屏幕宽度。
			//看x中蕴含了多少个精灵宽度，就是点击到了第几列
			self.startCol = parseInt(x / self.spritewh);
			self.startRow = parseInt((y - self.basey) / self.spritewh);

			//验收
			if(self.startCol < 0 || self.startCol > 6 || self.startRow < 0 || self.startRow > 6){
				return;
			}
		},true);

		self.canvas.addEventListener("touchmove",function(event){
			touchmovehandler(event);
		},true);

		this.canvas.addEventListener("touchend",function(){
			//开锁
			self.lock = true;
			self.canvas.removeEventListener("touchmove", touchmovehandler, true);
		},true);

		function touchmovehandler(event){
			//观察事件锁
			if(!self.lock) return;

			var x = event.touches[0].clientX;
			var y = event.touches[0].clientY;
			//终点元素
			var targetCol = parseInt(x / self.spritewh);
			var targetRow = parseInt((y - self.basey) / self.spritewh);

			var startCol = self.startCol;
			var startRow = self.startRow;
			//验收
			if(targetCol < 0 || targetCol > 6 || targetRow < 0 || targetRow > 6){
				self.canvas.removeEventListener("touchmove", touchmovehandler, true);
				return;
			}

			//等待鼠标移动到旁边的元素上
			//要么行号一样，列号差1；要么列号一样，行号差1。
			if(
				startRow == targetRow && Math.abs(targetCol - startCol) == 1
				||   //这是一个或者符号
				startCol == targetCol && Math.abs(targetRow - startRow) == 1
			){
				//关锁
				self.lock = false;
				self.canvas.removeEventListener("touchmove", touchmovehandler, true);
				//调用交换函数
				self.map.exchange(startRow,startCol,targetRow,targetCol);
			}
		}
	}
})();