;(function($, window) {

	//PRIVATE Methods
	var priv = {
		isImageLoaded: function(img) {
			if(!img.complete) return false;
			if (typeof img.naturalWidth != 'undefined' && img.naturalWidth === 0) { return false; }
			return true;
		},
		assignImgVariables: function(img) {
			var $this = this;
			//Use natural if available. Natural known to work in IE9+
			if('naturalWidth' in new Image()) {
				$this.set.zoomSizeX = img.naturalWidth;
				$this.set.zoomSizeY = img.naturalHeight;
			} else {
				var nImg = new Image();
				nImg.src = img.src;
				$this.set.zoomSizeX = nImg.width;
				$this.set.zoomSizeY = nImg.height;
			}

			if($this.set.mgBehaviour !== 'none') {
				$this.set.$zoomMG.css({
					'background-image': 'url(' + img.src + ')',
					'background-color': '#fff',
					'background-size': $this.set.zoomSizeX + 'px ' + $this.set.zoomSizeY + 'px'
				});
			}

		},
		testIfLoaded: function(zoomImgSrc) {
			var $this = this,
				$img = $('#' + $this.set.zoomID);

			(function imgLoaded() {
				if(priv.isImageLoaded($img[0])) {
					
					priv.assignImgVariables.apply($this, [$img[0]]);

					$this.set.$zoomImgCont.find('img').hide();
					$img.fadeIn(200,function() {
						priv.manipulateZoomImg.apply($this);
					});
					priv.manipulateZoomImg.apply($this);
					$(window).trigger('remooz.imgLoaded');
					$this.set.$zoomCont.find($this.set.preloader).hide();

				} else {
					requestAnimFrame(imgLoaded);
				}
			})();
		},
		initZoomImg: function($zoomImg, imgPos) {
			var $this = this,
				zoomImgSrc = '',
				imgReg = /\.(jpg|jpeg|png|gif)$/i,
				imgIndex = null; //The image that the zoom image is based on.



			if(imgPos === undefined) {
				//Can be set in changeZoomedImage.
				if($this.set.single === false) {
					//Can handle being a grandchild in a list but no deeper.
					imgIndex = ($this.set.mgBehaviour !== 'none') ? $zoomImg.index() - 1 : $zoomImg.index();
					if(imgIndex === 0 && !$zoomImg.parent().is($this.set.zoomPool)) imgIndex = $zoomImg.parent().index();
					if($this.set.debug === true) console.info('Zoom Image = ',$zoomImg);
					$this.set.currImg = {'pos': imgIndex, 'len': $this.find($this.set.zoomPool + ' img').length};
					if($this.set.currImg.len === 1) {
						$this.set.$zoomImgCont.parent().find($this.set.prev + ',' + $this.set.next).hide();
					} else {
						$this.set.$zoomImgCont.parent().find($this.set.prev + ',' + $this.set.next).show();
					}
				}
				if($this.set.zoomTrigger !== false || $this.set.mgBehaviour === 'none') {
					if($this.set.single !== false) {
						$this.set.currImg = {'pos': $this.set.singleIndex, 'len': $($this.set.single).find('img').length};
					}
				}
			}

			if($this.set.debug === true && $zoomImg.length === 0) console.warn('No "zoomImg" found check your settings - default img.current');

			zoomImgSrc = $zoomImg.attr('src');
			if(imgReg.test(zoomImgSrc)) {
				$this.set.zoomID = 'js-remooz-' + zoomImgSrc.split('/').pop().replace(imgReg, '');
			} else {
				$this.set.zoomID = 'js-remooz-' + zoomImgSrc.split('/').pop();
			}

			if($('#' + $this.set.zoomID).length === 0 || !priv.isImageLoaded($('#' + $this.set.zoomID)[0])) {
				$this.set.$zoomCont.find($this.set.preloader).show();

				//Carry on with loading image and instantiang it's variables.
				$this.set.sizeX = $zoomImg.width();
				$this.set.sizeY = $zoomImg.height();

				//Create new image with new source.
				if($zoomImg.data('remooz-zoom-url') !== undefined) {
					zoomImgSrc = $zoomImg.data('remooz-zoom-url');
				} else {
					zoomImgSrc = $zoomImg.attr('src').replace($this.set.srcRegexp, $this.set.srcStrReplace);
				}
				$this.set.$zoomImgCont.append('<img id="' + $this.set.zoomID + '" src="' + zoomImgSrc + '" style="z-index: ' + $this.set.zoomZIndex + '; width: 0; height: 0;" />');

				//Test to see when it is loaded
				priv.testIfLoaded.apply($this, [zoomImgSrc]);
			} else {
				//Update the existing image.
				$this.set.$zoomImgCont.find('img').hide();
				priv.assignImgVariables.apply($this, [$('#' + $this.set.zoomID)[0]]);
				$('#' + $this.set.zoomID).css('z-index', $this.set.zoomZIndex).fadeIn(200,function() {
					priv.manipulateZoomImg.apply($this);
				});
				priv.manipulateZoomImg.apply($this);
			}

		},
		changeZoomedImage: function(imgIndex) {
			//Changes images when zoom is already up.
			var $this = this,
				$nextImg,
				numbReg = /\D/;

			$this.set.zoomZIndex++;

			//Work out which image is to be opened.
			switch (imgIndex) {
				case 'next':
					$this.set.currImg.pos++;
					break;
				case 'prev':
					$this.set.currImg.pos--;
					break;
				default:
					if(!numbReg.test(imgIndex)) {
						$this.set.currImg.pos = imgIndex;
					}
					break;
			}
			
			$this.set.currImg.pos = $this.set.currImg.pos % $this.set.currImg.len;

			if($this.set.single !== false) {
				$nextImg = $($this.set.single).eq($this.set.currImg.pos).find('img');
			} else {
				$nextImg = $($this.set.zoomPool).find('img:eq(' + $this.set.currImg.pos + ')');
				if($nextImg.hasClass($this.set.skipSlide)) {
					//Skip certain images
					priv.changeZoomedImage.apply($this, [imgIndex]);
				}
			}

			priv.initZoomImg.apply($this, [$nextImg, $this.set.currImg.pos]);
			
		},
		manipulateZoomImg: function() {
			var $this = this;
			var css = {};
			var mouseMoveInit = false;
			var $img = $('#' + $this.set.zoomID);
			var scaleX = 1;
			var scaleY = 1;
			var mousePostitionY = 0;

			//Container's size
			$this.set.img.contX = $this.set.$zoomImgCont.width();
			$this.set.img.contY = $(window).height();
			$this.set.img.offsetY = $this.set.$zoomCont.parent().offset().top;
			
			//Fit image to container
			if($this.set.fitX) {
				$this.set.img.contX = $this.set.img.contX - ($this.set.imgOffset[1] + $this.set.imgOffset[3]);
				scaleX = $this.set.img.contX / $this.set.zoomSizeX; 
			}
			if($this.set.fitY) {
				$this.set.img.contY = $this.set.img.contY - ($this.set.imgOffset[0] + $this.set.imgOffset[2]);
				$this.set.img.offsetY = $this.set.imgOffset[0];
				scaleY = $this.set.img.contY / $this.set.zoomSizeY;
			} else {
				$this.set.img.contY = $this.set.img.contY - ($this.set.imgOffset[0] + $this.set.imgOffset[2]);
			}

			//we want the smallest scale to determine what to scale the pictures to.
			$this.set.img.scale = (scaleX < scaleY) ? scaleX : scaleY;

			if($this.set.img.scale >= 1) { 
				$this.set.img.scale = 1; 
				$.extend(css, {'width': $this.set.zoomSizeX, 'height': $this.set.zoomSizeY});
			} else {
				$.extend(css, {'width': $this.set.img.scale * $this.set.zoomSizeX, 'height': $this.set.img.scale * $this.set.zoomSizeY});
			}

			if($this.set.touch) $this.set.$zoomCont.css({
				'position': 'absolute',
				'top': -$this.set.img.offsetY
			});

			//Position image in container or move image around container.
			if($this.set.img.contX >= $this.set.zoomSizeX * $this.set.img.scale) {
				$this.set.img.X = ($this.set.img.contX - $this.set.zoomSizeX * $this.set.img.scale) / 2 + $this.set.imgOffset[3];
				$.extend(css, {'left': $this.set.img.X});
				$this.set.img.ratioX = 0;
			} else {
				if(!$this.set.fitX) {
					$this.set.img.ratioX = Math.floor(($this.set.zoomSizeX * $this.set.img.scale - $this.set.img.contX) / $this.set.img.contX * 100) / 100;
					if(!$this.set.touch) {
						$this.set.img.X = ($this.set.img.ratioX * $this.set.img.scale * -1) - $this.set.imgOffset[3];
						$.extend(css, {'left': $this.set.img.X});
					}
				}
			}

			if($this.set.img.contY >= $this.set.zoomSizeY * $this.set.img.scale) {
				if(!$this.set.touch) {
					$this.set.img.offsetY = ($this.set.img.contY - $this.set.zoomSizeY * $this.set.img.scale) / 2;
					$.extend(css, {'top': $this.set.img.offsetY});
					$this.set.img.ratioY = 0;
				}
			} else {
				if(!$this.set.fitY) {
					//final image size with scale - height of window / height of window and rounded to two decimal points
					$this.set.img.ratioY = Math.floor(($this.set.zoomSizeY * $this.set.img.scale - $this.set.img.contY) / $this.set.img.contY * 100) / 100;
					if(!$this.set.touch) {
						$this.set.img.Y = $this.set.img.ratioY * $this.set.img.scale * -1;
						$.extend(css, {'top': $this.set.img.Y});
					}
				}
			}

			if(($this.set.img.ratioY || $this.set.img.ratioX) && !mouseMoveInit && !$this.set.useScroll) {
				mouseMoveInit = true;
				$(document, window).on('mousemove', function(e) {
					//pic is wider than screen
					if($this.set.img.ratioX) {
						$this.set.img.X = e.clientX * $this.set.img.ratioX * -1;
						css.left = $this.set.img.X;
					}

					//pic is taller than screen	
					if($this.set.img.ratioY) {
						mousePostitionY = e.clientY - $this.set.imgOffset[0] >= 0 ? e.clientY - $this.set.imgOffset[0] : 0;
						$this.set.img.Y = (mousePostitionY * $this.set.img.ratioY * -1) + $this.set.imgOffset[0];
						css.top = $this.set.img.Y;
					}
					
					$img.css(css);
				});
			} else {
				if($this.set.useScroll) css.top = 0;
				$(document, window).off('mousemove');
				mouseMoveInit = false;
			}

			$img.css(css);

		},
		manipulateMG: function(pos, mg, ratio) {

			var $this = this,
				runFixed = ($this.set.mgBehaviour === 'fixed-all' || $this.set.mgBehaviour === 'fixed');

			//Horizontal
			if(pos.left < (mg.X / 2) && runFixed) {
				//Fixed Left
				pos.mgLeft = 0;	
			} else if(pos.left > ($this.set.sizeX - (mg.X / 2) - $this.set.mgImgOffset[1] - $this.set.mgImgOffset[3]) && runFixed) {
				//Fixed Right
				pos.mgLeft = $this.set.sizeX - mg.X - $this.set.mgImgOffset[1] - $this.set.mgImgOffset[3];
			} else {
				//Center X
				pos.mgLeft = pos.left - (mg.X / 2) - 2;
			}

			//Vertical
			if(pos.top < (mg.Y / 2) && runFixed) {
				//Fixed Top
				pos.mgTop = 0;	
			} else if(pos.top > ($this.set.sizeY - (mg.Y / 2) - $this.set.mgImgOffset[0] - $this.set.mgImgOffset[2]) && runFixed) {
				//Fixed Bottom
				pos.mgTop = $this.set.sizeY - mg.Y - $this.set.mgImgOffset[0] - $this.set.mgImgOffset[2];
			} else {
				//Center Y
				pos.mgTop = pos.top - (mg.Y / 2) - 2;
			}

			pos.bgpX = -1 * Math.floor((pos.left + $this.set.mgImgOffset[3]) * ratio - (mg.X / 2));
			pos.bgpY = -1 * Math.floor((pos.top + $this.set.mgImgOffset[0]) * ratio - (mg.Y / 2));

			return {'top': pos.mgTop, 'left': pos.mgLeft, 'background-position': pos.bgpX + 'px ' + pos.bgpY + 'px'};
		},
		openZoom: function() {
			var $this = this,
				$imgs = null;

			$this.trigger('remooz.zoomOpened');
			$this.set.isZoomed = true;
			$('html,body').css('overflow','hidden');
			$this.set.$zoomCont.fadeIn(400);

			if($this.set.showThumbs) {
				$imgs = $($this.set.zoomThumbPool).find('img').clone();
				$($this.set.zoomThumbCont).html($imgs);
			}
		},
		closeZoom: function() {
			var $this = this;

			$this.trigger('remooz.zoomClosed');
			$this.set.isZoomed = false;
			$('html,body').css('overflow','auto');
			$(window).scrollTop($this.set.scrollPos);
			$this.set.$zoomCont.fadeOut(400, function() {
				$(this).find('.center-zoom').removeClass('center-zoom');
			});
			$($this.set.viewNext).off('click');

		},
		fullZoomInit: function() {

			var $this = this,
				css = {},
				mouseMoveInit = false;
			
			//Initilize zoom.
			priv.openZoom.apply($this);

			$(window).on('resize', function() {
				priv.manipulateZoomImg.apply($this);
			});

			if($this.set.viewNext !== false) {
				$($this.set.viewNext).on('click', function() {
					priv.changeZoomedImage.apply($this, ['next']);
				});
			}

			if($this.set.showThumbs) { 
				$($this.set.zoomThumbCont).on('click', 'img', function() {
					var index = $(this).index();
					priv.changeZoomedImage.apply($this, [index]);
				});
			}

			$this.set.$zoomCont.off('remooz.closeZoom').on('remooz.closeZoom', function() {

				priv.closeZoom.apply($this);

			}).off('remooz.nextZoomImg').on('remooz.nextZoomImg', function() {

				priv.changeZoomedImage.apply($this, ['next']);

			}).off('remooz.prevZoomImg').on('remooz.prevZoomImg', function() {

				priv.changeZoomedImage.apply($this, ['prev']);

			});

		},
		touchClick: function() {
			return (Math.abs(Math.abs(winTouches.startX) - Math.abs(winTouches.endX))) < 40 && (Math.abs(Math.abs(winTouches.startY) - Math.abs(winTouches.endY))) < 40;
		},
		longTouch: function() {
			return winTouches.endTime - winTouches.startTime > 800;
		},
		zoomPoolInit: function() {

			var $this = this,
				zoomPoolOffset = {},
				ratio = 0,
				mg = {},
				pos = {},
				start = {},
				touches = {},
				magGlassTriggered = false,
				$openZoom = $this.set.zoomPool;

			if($this.set.mgBehaviour !== 'none') {
				$this.set.$zoomMG = $this.find($this.set.zoomMG);

				mg.X = $this.set.$zoomMG.width();
				mg.Y = $this.set.$zoomMG.height();
			}

			//If there is an alternative way to trigger full page zoom
			if($this.set.zoomTrigger !== false) {
				if($this.set.mgBehaviour === 'none') {
					$openZoom = $this.set.zoomTrigger;
				} else {
					$openZoom.add($this.set.zoomTrigger);
				} 
			}

			if($this.set.debug === true) console.info('Triggered element = ' + $openZoom);

			$this.on({
				mouseenter: function(e) {
					var $zoomImg;
					//Send the main object and the clicked object
					if($this.set.zoomImg === 'currentTarget') {
						$zoomImg = $(e.target);
					} else {
						$zoomImg = $(this).parent().find($this.set.zoomImg);
					}

					if($this.set.single === false) {
						priv.initZoomImg.apply($this,[$zoomImg, undefined]);
					}
					
					if($this.set.mgBehaviour !== 'none') {
						$this.set.$zoomMG = $(this).find($this.set.zoomMG);
						
						//Show magnifying glass
						$this.set.$zoomMG.show();

						ratio = $this.set.zoomSizeX / $this.set.sizeX;

						//Image pool can move between mouseenters (i.e. onresize)
						zoomPoolOffset = $(this).offset();
						zoomPoolOffset.left = Math.floor(zoomPoolOffset.left);
						zoomPoolOffset.top = Math.floor(zoomPoolOffset.top);
					}
				},
				mouseleave: function() {
					if($this.set.mgBehaviour !== 'none') {
						//Hide magnifying glass on leave of pool
						$this.set.$zoomMG.hide();
					}
				},
				mousemove: function(e) {
					if($this.set.mgBehaviour !== 'none') {
						//Mouse position related variables
						pos.left = e.pageX - zoomPoolOffset.left;
						pos.top = e.pageY - zoomPoolOffset.top;

						pos.inBounds = (pos.top < 0 || pos.left < 0 || pos.top > $this.set.sizeY || pos.left > $this.set.sizeX) ? false : true;

						if(!pos.inBounds) {
							//In case box covers bounds and doesn't trigger mouseleave.
							$this.set.$zoomMG.hide();
						} else {
							//Update CSS
							$this.set.$zoomMG.css(priv.manipulateMG.apply($this, [pos, mg, ratio]));
						}
					}
				},
				touchstart: function(e) {
					$this.set.touch = true;

					start.X = e.originalEvent.targetTouches[0].pageX;
					start.Y = e.originalEvent.targetTouches[0].pageY;
					start.time = e.originalEvent.timeStamp;

					touches.dir = '';
					touches.move = '';

				},
				touchend: function(e) {

					//see if finger has moved. if finger has moved more than 40px disable.
					if(priv.touchClick()) {
						e.preventDefault();

						var $zoomImg;

						if($this.set.zoomImg === 'currentTarget') {
							$zoomImg = $(e.target);
						} else {
							$zoomImg = $(this).parent().find($this.set.zoomImg);
						}

						if($this.set.touchOpenReplaceTab) {
							zoomImgSrc = $zoomImg.attr('src').replace($this.set.srcRegexp, $this.set.srcStrReplace);
							window.location = zoomImgSrc;
						} else {
							priv.initZoomImg.apply($this,[$zoomImg, undefined]);
							$('html,body').scrollTop(0);
							priv.fullZoomInit.apply($this);
						}

					}

				},
				click: function(e) {
					
					e.preventDefault();
					$this.set.scrollPos = $(window).scrollTop();

					var $zoomImg;

					if($this.set.zoomImg === 'currentTarget') {
						$zoomImg = $(e.target);
					} else {
						$zoomImg = $(this).parent().find($this.set.zoomImg);
					}
					priv.initZoomImg.apply($this,[$zoomImg, undefined]);
					$('html,body').scrollTop(0);
					priv.fullZoomInit.apply($this);
					
				}

			}, $openZoom);
			
		}
	};

	//PUBLIC methods
	var methods = {
		init: function(options) {

			var touchTime = null,
				init = {};

			init = $.extend({}, defaultOpts, options);

			//Global actions initiated only once per closure
			privateOpts.$zoomImgCont = $(init.zoomCont);
			privateOpts.$zoomCont = privateOpts.$zoomImgCont.parent();

			privateOpts.$zoomCont.on({
				click: function(e) {
					e.preventDefault();
					if(e.target == $(this)[0]) {
						privateOpts.$zoomCont.trigger('remooz.closeZoom');
					}
				},
				touchstart: function(e) {
					privateOpts.touch = true;
					touchTime = e.originalEvent.timeStamp;
				},
				touchend: function(e) {
					if((e.originalEvent.timeStamp - touchTime) < 400) {
						e.preventDefault();
						if(e.target == $(this)[0]) {
							privateOpts.$zoomCont.trigger('remooz.closeZoom');
						}
					}
				}
			}).on('click touchstart', init.prev, function(e) {

				e.preventDefault();
				privateOpts.$zoomCont.trigger('remooz.prevZoomImg');

			}).on('click touchstart', init.next, function(e) {

				e.preventDefault();
				privateOpts.$zoomCont.trigger('remooz.nextZoomImg');
				
			}).on('click touchstart', init.close, function(e) {

				e.preventDefault();
				privateOpts.$zoomCont.trigger('remooz.closeZoom');

			});

			//logging all touches on screen. 
			$(window).on({
				keydown: function(e) {
					switch (e.keyCode) {
						case 27:
							privateOpts.$zoomCont.trigger('remooz.closeZoom');
							break;
						case 37:
							//Left
							privateOpts.$zoomCont.trigger('remooz.prevZoomImg');
							break;
						case 39:
							//Right
							privateOpts.$zoomCont.trigger('remooz.nextZoomImg');
							break;
					}
				},
				touchstart: function(e) {
					privateOpts.touch = true;
					winTouches.startX = e.originalEvent.targetTouches[0].clientX;
					winTouches.startY = e.originalEvent.targetTouches[0].clientY;
					winTouches.endX = e.originalEvent.targetTouches[0].clientX;
					winTouches.endY = e.originalEvent.targetTouches[0].clientY;
					winTouches.startTime = new Date().getTime();
					winTouches.endTime = new Date().getTime();
				},
				touchmove: function(e) {
					winTouches.endX = e.originalEvent.targetTouches[0].clientX;
					winTouches.endY = e.originalEvent.targetTouches[0].clientY;
					winTouches.endTime = new Date().getTime();
				}
			});


			return this.each(function(i) {
				var $this = $(this),
					objectData = $this.data();

				$this.set = $.extend({}, init, objectData, privateOpts);

				if($this.set.debug === true) {
					console.warn(':::: REMOOZ Debug has been set to true ::::');
					console.log('Options -> ', $.extend({}, defaultOpts, options, objectData));
				}

				if($($this.set.zoomMG).length === 0 && $this.set.mgBehaviour !== 'none') {
					if($this.set.debug === true) console.info('mgBehaviour set to none, no magnifying glass found: ' + $this.set.zoomMG);
					$this.set.mgBehaviour = 'none';
				}

				if($($this.set.zoomTrigger).length === 0 && $this.set.zoomTrigger !== false) {
					if($this.set.debug === true) console.info('zoomTrigger set to false, ' + $this.set.zoomTrigger + ' element not found');	
					$this.set.zoomTrigger = false;
				}

				if(($($this.set.zoomThumbPool).length === 0 || $($this.set.zoomThumbCont).length === 0) && $this.set.showThumbs !== false) {
					if($this.set.debug === true) console.info('showThumbs set to false, ' + $this.set.zoomThumbPool + ', ' + $this.set.zoomThumbCont + ' elements not found');
					$this.set.showThumbs = false;
				}

				if($($this.set.single).length === 0 && $this.set.single !== false) {
					if($this.set.debug === true) console.info('showThumbs set to false, ' + $this.set.single + ' elements not found');
					$this.set.showThumbs = false;
				} else {
					$this.set.singleIndex = i;
				}

				priv.zoomPoolInit.apply($this);
			});
		},

		update: function(options) {
			
			return this.each(function() {
				var $this = $(this),
					objectData = $this.data();

				$this.set = $.extend({}, defaultOpts, options, objectData, privateOpts);

				priv.zoomPoolInit.apply($this);
			});

		},
		closeZoom: function(options) {

			return this.each(function() {
				var $this = $(this);

				$this.set = $this.data();
				
				$this.set.$zoomCont.trigger('remooz.closeZoom');
				
			});

		},
		destroy: function(options) {

			return this.each(function() {
				var $this = $(this),
					objectData = $this.data();

				$this.set = $.extend({}, defaultOpts, options, objectData, privateOpts);

				priv.zoomPoolInit.apply($this);
			});

		}
	};

	var defaultOpts = {
		fitX: true,
		fitY: false,
		srcRegexp: /\.(jpg|jpeg|png|gif)$/i,
		srcStrReplace: '-large.$1',
		showThumbs: false,
		single: false,
		zoomTrigger: false,
		imgOffset: [0, 0, 0, 0],
		mgBehaviour: 'fixed',
		mgImgOffset: [0, 0, 0, 0],
		useScroll: false,
		touchOpenReplaceTab: false,
		zoomCont: '#js-remooz-zoomContainer',
		zoomThumbCont: '#js-remooz-zoomThumbnailContainer',
		zoomPool: '#js-remooz-imagePool',
		zoomThumbPool: '#js-remooz-thumbnailPool',
		zoomMG: '#js-remooz-zoomMagnifyingGlass',
		zoomImg: 'img.current',
		close: '.js-remooz-close',
		prev: '.js-remooz-prev',
		next: '.js-remooz-next',
		preloader: '.js-remooz-preloader',
		skipSlide: 'redils-duplicated',
		debug: false
	};

	var privateOpts = {
		$zoomMG: {},
		$zoomCont: {},
		$zoomImgCont: {},
		touch: false,
		isZoomed: false,
		isMagnified: false,
		currImg: {},
		img: {scale: 1},
		zoomZIndex: 1,
		zoomSizeX: 0,
		zoomSizeY: 0,
		sizeX: 0,
		sizeY: 0,
		singleIndex: null,
		zoomID: '',
		scrollPos: 0
	};

	var winTouches = {};

	window.requestAnimFrame = (function() { return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60); }; })();

	$.fn.remooz = function(method) {

		//create a foreach and loop through the object to get all the methods and properties.
		if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if(typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.remooz');
		}

	};

})(jQuery, window);