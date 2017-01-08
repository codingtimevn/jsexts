CT.wait._links.MobileDetect = 'https://cdnjs.cloudflare.com/ajax/libs/mobile-detect/1.3.3/mobile-detect.min.js';
CT.wait(['jQuery','MobileDetect'],function($){
	CT.require('CT.Watch','watch.js',function(Watch){
		CT.Affix = (function ($) {
			var md = new MobileDetect(navigator.userAgent);
			var Affix = function (selector, options) {
				selector = typeof selector == 'string' || selector.tagName ? $(selector) : selector;

				if (selector.length === 0) return false;
				if (selector.length > 1) return selector.each(function () {
					new Affix($(this), options);
				}), false;
				if (selector.data('ct-affix-handler')) return selector.data('ct-affix-handler');
				options = $.extend(true, {}, Affix.options, options, {
					initCss: parseCss(options.initCss),
					startCss: parseCss(options.startCss)
				});
				var
					responsive = (md.tablet() ? options.tablet : true) && (md.phone() ? options.mobile : true),
					node = selector[0],
					This = this,
					watch;
				;
				if (options.watch) {
					watch = new Watch(node);
					watch.watch('clientHeight', function (prop) {
						This.holder.css('height', selector.outerHeight());
					});
					selector.bind({ 'ct-affix-stop ct-affix-out': watch.stop, 'ct-affix-start ct-affix-in': watch.start });
				}
				$.extend(this, {
					setFixed: function (scroll, i) {
						if (!this.active) return;
						var thisTop = 0;
						$.each(this.beforeAffixs, function () {
							var firstBoot = this.atTop + this.rect.height;
							thisTop = firstBoot > thisTop ? firstBoot : thisTop;
						});
						thisTop += this.options.space;
						var isFix = this.rect.top - scroll - thisTop;

						if (this.fixed) {
							if (isFix > 0) {
								this.fixed = false;
								this.atTop = 0;
								selector.css(this.defaultCss);
								this.holder.hide();
								this.setHidden(0);
								selector.triggerHandler('ct-affix-stop');
							} else this.repairFixed(scroll, thisTop);
						} else if (isFix < 0) {
							this.fixed = true;
							this.inAffix = true;
							selector.css(options.startCss).triggerHandler('ct-affix-start');
							this.holder.css({ width: selector.outerWidth(), height: selector.outerHeight(), display: 'block'});
							this.repairFixed(scroll, thisTop);
						}
					},
					repairFixed: function (scroll, space) {
						var add = this.rect.top - scroll - space, fixedTop = space + (add > 0 ? add : 0), more = 0, spaceHeight = this.rect.height + options.space;

						if ((more = scroll - this.hideAt + fixedTop + spaceHeight) > 0) {
							if (more > spaceHeight) {
								more = spaceHeight;
								if (this.inAffix) {
									this.inAffix = false;
									selector.triggerHandler('ct-affix-out');
								}
							} else if (!this.inAffix) {
								this.inAffix = true;
								selector.triggerHandler('ct-affix-in');
							}
						} else { more = 0; }
						this.setHidden(more / spaceHeight);
						this.atTop = fixedTop - more;
						selector.css('top', fixedTop);
					},
					setHidden: function (i) {},
					repairRect: function () {
						this.active = selector.is(':visible') && responsive;
						if (!this.active) return;
						this.hideAt = 999999;
						this.afterAffixs = [];
						var el = this.fixed ? this.holder : this.element;
						var rect = $.extend({
							width: selector.outerWidth(),
							height: selector.outerHeight()
						}, el.offset());
						$.extend(rect, {
							right: rect.left + rect.width,
							bottom: rect.top + rect.height
						});
						$.each(this.hides, function () {
							var hide = this;
							this.element.each(function () {
								var el = $(this), affix = el.data('ct-affix-handler');
								var hideRect = affix && affix.fixed ? affix.holder.offset() : el.offset();
								hideRect.top -= (hide.space || 0);
								hideRect.width = el.outerWidth();
								hideRect.right = hideRect.left + hideRect.width;
								if (!compair(rect, hideRect)) return;
								if (hide.at == 'bottom') hideRect.top += el.outerHeight();
								if (hideRect.top < rect.top + rect.height + This.options.space) return;
								This.hideAt = This.hideAt < hideRect.top ? This.hideAt : hideRect.top;
							});
						});
						this.rect = rect;
					},
					repairhideAfter: function () {
						if (!options.hideAfter || !this.active) return this;
						$.each(this.afterAffixs, function () {
							This.hideAt = This.hideAt < this.rect.top ? This.hideAt : this.rect.top;
						});
						return this;
					},
					repairPush: function () {
						if (!options.push || !this.active) return;
						for (var i in this.beforeAffixs) {
							var f = this.beforeAffixs[i];
							if (!f.element.is(options.push)) return this;
						}
						var newHide = this.hideAt - this.rect.height - options.space;
						$.each(this.beforeAffixs, function () {
							this.hideAt = this.hideAt < newHide ? this.hideAt : newHide;
						});
						return this;
					},
					reset: function () {
						this.fixed = false;
						this.setHidden = Affix.hideEffects[options.hideEffect] || Affix.hideEffects.dropUp;
						this.element.attr('style', this.style).css(options.initCss);
						$.extend(options.startCss, {
							width: this.element.outerWidth(),
							position: 'fixed',
							top: 0
						});
						this.defaultCss = {};
						$.each(options.startCss, function (k) { This.defaultCss[k] = selector.css(k) || ''; });                        
						this.holder.attr('style', this.style).css(options.initCss).css({
							width: selector.outerWidth(),
							height: selector.outerHeight(),
							visibility: 'hidden',
							display: 'none',
							transition: 'none',
							margin: selector.css('margin'),
							marginLeft: selector.css('margin-left'),
							marginRight: selector.css('margin-right'),
							marginTop: selector.css('margin-top'),
							marginBottom: selector.css('margin-bottom'),
							'box-sizing': 'border-box'
						});
						this.hides = [];
						if (options.hideParent.selector) {
							var el = selector.parents(options.hideParent.selector).first();
							el.length && this.hides.push({
								element: el,
								at: 'bottom',
								space: options.hideParent.space || 0
							}); 
						}
						$.each(options.hides, function () {
							var el = $(this.selector).not(selector);
							el.length && This.hides.push({
								element: el,
								at: this.at,
								space: this.space
							});
						});

						This.repairRect();
					},
					rect: { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 },
					active: true,
					space: 0,
					hides: [],
					beforeAffixs: [],
					afterAffixs:[],
					element: selector,
					style: selector.attr('style') || '',
					holder: $('<div>').insertAfter(selector),
					options: options
				});
				this.reset();
				selector.data('ct-affix-handler', this);
				Affix.addAffix(this);
			};
			var
				affixs = [],
				parseCss = function (str) {
					str = str || '';
					var rs = {};
					$.each(str.split(';'), function () {
						var css = this.split(':'), prop = $.trim(css[0]), val = $.trim(css[1]);
						if (!prop || !val) return;
						rs[prop] = val;
					});
					return rs;
				},
				setAffix = function () {
					var scroll = $win.scrollTop();
					$.each(affixs, function (i) {
						this.setFixed(scroll,i);
					});
				}
			$win = $(window),
			compair = function (a, b) { return !(a.left + 0.5 >= b.right || a.right - 0.5 <= b.left); },
			repairRects = function () {
				$.each(affixs, function () { this.repairRect(); });
			},
			repairColumns = function () {
				repairRects();
				var columns = [];
				$.each(affixs, function (i) {
					if (!this.active) return;
					var affix = this, rect = this.rect, top = 0, bg, end;
					for (bg = 0; bg < columns.length; bg ++){
						if (compair(columns[bg], rect)) {
							for (end = bg; end < columns.length; end++) {
								if (compair(columns[end], rect)) {
									var thisTop = columns[end].top;
									top = thisTop > top ? thisTop : top;
									continue;
								};
								break;
							}
							break;
						}
					}
					end--;
					var left = columns[bg];
					if (left && left.left < rect.left) {
						bg++, end++;
						columns.splice(bg, 0, { left: rect.left, right: left.right, top: left.top, affix: left.affix });
						left.right = rect.left
					}
					var right = columns[end];
					if (right && right.right > rect.right) {
						columns.splice(end, 0, { left: right.left, right: rect.right, top: right.top, affix: right.affix });
						right.left = rect.right;
					}
					var newCol = { left: rect.left, right: rect.right, top: top + rect.height, affix: this }                    
					this.beforeAffixs = columns.splice(bg, end - bg + 1, newCol).map(function (col) { return col.affix; });
					$.each(this.beforeAffixs, function () {
						this.afterAffixs.push(affix);
					});
					this.element.css('z-index', 9999 - i);
				});
				for (var i = affixs.length - 1; i > -1; i--) {
					affixs[i].repairhideAfter().repairPush();
				}
			},
			reset = function () {
				$.each(affixs, function (i) {
					this.reset();
				});
				affixs.sort(function (a, b) { return a.rect.top - b.rect.top; });
				repairColumns();
				setAffix();
			}
			;

			$.extend(Affix, {
				affixs: affixs,
				reset: reset,
				repairColumns: repairColumns,
				setAffix: setAffix,
				hideEffects: {
					slideUp: function (i) { this.element.css('transform','translateY(-'+(i*(this.rect.height + this.options.space))+'px)'); },
					dropUp: function (i) {
						this.element.css({
							opacity: 1-i,
							transform: 'translateY(-' + (i * (this.rect.height + this.options.space)) + 'px)'
						});
					},
					dropLeft: function (i) {
						this.element.css({
							opacity: 1 - i,
							transform: 'translateX(-' + (i * (this.rect.width + this.options.space)) + 'px)',							
							clip: 'rect(0px,'+this.rect.right+'px,'+ ((1-i) * (this.rect.height + this.options.space)) +'px,0px)'
						});
					},
					dropRight: function (i) {
						this.element.css({
							opacity: 1 - i,
							transform: 'translateX(' + (i * (this.rect.width + this.options.space)) + 'px)',							
							clip: 'rect(0px,'+this.rect.right+'px,'+ ((1-i) * (this.rect.height + this.options.space)) +'px,0px)'
						});
					},
					scale: function (i) {
						this.element.css({
							transform: 'scale(' + (1 - i) + ')',
							'transform-origin': 'top'
						});
					},
					scaleDrop: function (i) {
						this.element.css({
							opacity: 1 - i,
							transform: 'scale(' + (1 - i) + ')',
							'transform-origin': 'top'
						});
					},
					scaleY: function (i) {						
						this.element.css({
							transform: 'scaleY(' + (1 - i) + ')',
							'transform-origin': 'top'
						});
					},
					scaleYDrop: function (i) {						
						this.element.css({
							opacity: 1 - i,
							transform: 'scaleY(' + (1 - i) + ')',
							'transform-origin': 'top'
						});
					},
					paralax: function (i) {
						var crop = i*(this.rect.height + this.options.space)/2;
						this.element.css({
							'z-index': 0,
							transform:'translateY(-'+crop+'px)',
							clip: 'rect('+ crop +'px,'+this.rect.right+'px,'+ (this.rect.height - crop) +'px,0px)'
						 }); 
					}
				},
				addAffix: function (affix) {
					affixs.push(affix);
					affixs.sort(function (a, b) { return a.rect.top > b.rect.top; });
				},
				options: {
					hideAfter: false,
					hideParent: {},
					hides: [],
					position: 'top',
					space: 0,
					mobile: false,
					tablet: true,
					initCss: '',
					startCss: '',
					hideEffect: 'slideUp'
				}
			});

			$win.resize(reset).scroll(setAffix);
			setTimeout(function(){
				$(function () {
					$('[data-ct-affix]').each(function () {
						new Affix(this, $(this).data('ct-affix'));
					});

					reset();
					new Watch(document.body,60).watch('clientHeight', function () {
						repairColumns();
						setAffix();
					});
				});
			},100);
			Affix.affixs = affixs;
			return Affix;
		})(jQuery);
	});
});
