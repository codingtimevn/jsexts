CT.wait('jQuery',function($){
	CT.Watch = (function ($) {
		var Watch = function (obj,fps) {
			obj = obj || this;
			if (obj instanceof jQuery) return new Watch(obj[0]);
			var $obj = $(obj);
			if ($obj.data('ct-watch-handler')) return $obj.data('ct-watch-handler');
			$obj.data('ct-watch-handler', this);
			fps = fps || 60;
			var This = this, watchs = [], props = {}, rsProps = {};

			var find = function () {
				var changed = {};
				$.each(props, function (k, fn) {
					var rs = fn();
					if (rsProps[k] === rs) return;
					changed[k] = [rsProps[k], rs];
					rsProps[k] = rs;
				});
				$.isEmptyObject(changed) || $.each(watchs, function () {
					var thisChanged = {};
					$.each(this.prop, function () {
						if (changed[this]) thisChanged[this] = changed[this];
					});
					$.isEmptyObject(thisChanged) || this.callback.call(obj, thisChanged);
				});
			}

			var buildWatch = function (prop) {
				var watch = function () { }, val = obj[prop];
				if (val === undefined) {
					val = $.fn[prop];
					if (val) return function () { return $obj[prop](); };
					return function () { return obj[prop]; }
				}

				if ($.isFunction(val)) {
					return function () { return val.call(obj); }
				} else if (typeof val === 'object') {
					return function () { }
				} else {
					return function () { return obj[prop]; }
				}
				return watch;
			}

			var interval;
			$.extend(this, {
				watch: function (prop, fn) {
					if ($.isPlainObject(prop)) return $.each(prop, function (prop, fn) { This.watch(prop, fn); });
					if (typeof prop == 'string') prop = prop.split(/ +/).filter(function (a) { return a });
					$.each(prop, function () {
						if (!props[this]) {
							props[this] = buildWatch(this);
							rsProps[this] = props[this]();
						}
					});

					watchs.push({
						prop: prop,
						callback: fn
					});
					return this;
				},
				unWatch: function (prop, fn) {
					prop = prop.split(/ +/).filter(function (a) { return a });
					if ($.isFunction(fn)) {
						for (var i = watchs.length - 1; i > -1; i--) {
							var w = watchs[i];
							if (fn === w.callback) {
								for (var j = w.prop.length - 1; j > -1; j--) {
									if ($.inArray(w.prop[j], prop) > -1) w.prop.splice(j, 1);
								}
								if (!w.prop.length) watchs.splice(i, 1);
							}
						}
					} else {
						for (var i = watchs.length - 1; i > -1; i--) {
							var w = watchs[i];
							for (var j = w.prop.length - 1; j > -1; j--) {
								if ($.inArray(w.prop[j], prop) > -1) w.prop.splice(j, 1);
							}
							if (!w.prop.length) watchs.splice(i, 1);
						}
					}
					return this;
				},
				clear: function () {
					clearInterval(interval);
					delete $obj.data()['ct-watch-handler'];
					return this;
				},
				start: function () {
					$.each(props, function (k) { rsProps[k] = this(); });
					clearInterval(interval);
					interval = setInterval(find, 1000 / fps);
					return this;
				},
				stop: function () {
					clearInterval(interval);
					return this;
				}
			});
			this.start();
		}

		$.fn.watch = function (prop, fn) {
			var watch = $(this).data('ct-watch-handler') || new CT.Watch(this);
			watch.watch(prop, fn);
			return watch;
		}
		$.fn.unwatch = function (prop, fn) {
			var watch = $(this).data('ct-watch-handler');
			if (!watch) return this;
			watch.unwatch(prop, fn);
			return watch;
		}
		$.fn.clearwatch = function () {
			var watch = $(this).data('ct-watch-handler');
			if (!watch) return this;
			watch.clear();
			return this;
		}
		return Watch;
	})(jQuery);
});