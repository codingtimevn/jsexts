(function(window){
	Array.prototype.forEach = Array.prototype.forEach || function(fn){
		for (var i = 0, j = this.length; i < j; i++) if(fn.call(this,this[i],i) === false) return false;
	}
	Object.forEach = function(obj, fn){
		for(var i in obj) if(fn.call(obj,obj[i],i) === false) return false;
	}
	
	var CT = window.CoddingTime = window.CT = function(){}
	
	
	var Exitst = CT.exists = function(name,obj){
		var name = name.split('.'), obj = obj || window;
		while(name.length) if(!(obj = obj[name.shift()])) return false;
		return obj;
	}
	
	
	var Wait = CT.wait = function(name,callback){
		if(!name) return;
		if(typeof name === 'string'){
			name = name.split(',');
		}else if(typeof name === 'object' && name.length === undefined){
			for(var x in name){ Wait(x,name[x]); }
			return
		}
		Wait._waits.push({
			names: name,
			handle: callback
		});
		
		name.forEach(function(name){
			if(Wait._delayLinks[name] || !Wait._links[name]) return;
			Wait._delayLinks[name] = setTimeout(function(){
				if(Wait._handlers[name] = Exitst(name)) return;
				Require(name,Wait._links[name]);
			},Wait._delay);
		});
		
		clearTimeout(Wait._interval);
		Wait._interval = setTimeout(function(){
			for(var name in Wait._handlers) if(Wait._handlers[name] === false) delete Wait._handlers[name];
			var readys = [];
			Wait._waits.forEach(function(obj,index){
				var args = [];
				for(var i in obj.names){
					name = obj.names[i];
					if(Wait._handlers[name] === false || Wait._handlers[name] === undefined && !(Wait._handlers[name] = Exitst(name))) return;
					args.push(Wait._handlers[name]);
				}
				readys.push(index);
				try{					
					obj.handle.apply(CT,args);
				}catch(e){console.warn(e)}
			});
			while(readys.length) Wait._waits.splice(readys.pop(),1); 
			
			if(Wait._waits.length) Wait._interval = setTimeout(arguments.callee);
		});
	}
	Wait._waits = [];
	Wait._handlers = {};
	Wait._delay = 500;
	Wait._delayLinks = {};
	Wait._links = {
		jQuery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.min.js'
	};
	
	
	
	var Require = CT.require = function(name, callback){
		if(name instanceof Array){
			var last = {onDone:function(fn){fn();}},xhrs=[];
			name.forEach(function(script){				
				var xhr = Require._loaded[script.name] = Require._loaded[script.name] || Exitst(script.name) || (function(){
						if(!Require._regUrl.test(script.url)) script.url = Require._rootUrl + script.url;
						return new Require._xhr({url: script.url});
					})();
				if(xhr instanceof Require._xhr){
					xhrs.push(xhr);
					last.onDone(function(){xhr.start();});
					last = xhr;
				}
			});
			
			callback && Require._done(xhrs,function(){
				Wait(name.map(function(s){ return s.name}),callback)
			});
		}else if(name instanceof Object){
			var rqs = [];
			Object.forEach(name,function(url,name){
				rqs.push({name: name, url: url});
			});
			Require(rqs,callback);
		}else {
			Require([{name: name, url: callback}],arguments[2]);
		}
	}
	Require._rootUrl = '//cdn.rawgit.com/codingtimevn/jsexts/master/';
	Require._regUrl = /^http|^\/\//;
	Require._loaded = {};
	Require._xhr = function(opts){
		var dones = [],This = this, done = function(){
			if(!This._done) return;
			while(dones.length) dones.shift()()
		};
		this._done = false;
		this.start = function(){
			Require._addScript(opts.url,{
				success: function(){
					This._done = true;
					done();
				},
				error: function(){
					This._done = true;
					done();
				}
			});
			return this;
		}
		
		this.onDone = function(fn){
			dones.push(fn);
			done();
			return this;
		}		
	}
	Require._done = function(objects, callback){
		for(var i = 0, j = objects.length; i < j; i ++){
			var obj = objects[i];
			if(obj.onDone && obj._done !== false) continue;
			new function(){
				var call = callback;
				callback = function(){ call.apply(this,arguments); }
				obj.onDone(callback);
			}			
		}
	}
	Require._addScript = (function(){
		var head = document.getElementsByTagName("head")[0];
		return function(file,opts){
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = file;
			script.onload = function(){
				delete script.onreadystatechange;
				delete script.onload;
				opts.success && opts.success();
			};
			script.onerror = function(){
				delete script.onreadystatechange;
				delete script.onerror;
				opts.error && opts.error();
			}
			script.onreadystatechange = function() {
				if (this.readyState == 'complete') {
					script.onload();
				}else if(this.readyState == 'loaded'){
					script.onerror();
				}
			}
			head.appendChild(script);
			return script;
		}
	})()
	
	return CT;
})(window);