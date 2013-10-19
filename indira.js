/**
* Indira.js v1.6 by Dmitriy A. Golev
*
* The MIT License (MIT)
* 
* Copyright (c) 2013 Dmitriy A. Golev (Veliov Group)
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
* the Software, and to permit persons to whom the Software is furnished to do so,
* subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function(){

	"use strict";

	window.indirajs = {

		defaults : {
			loader: '<span style="display:block;width:100px;height: 100%;margin: 0 auto;">Loading...</span>', //(STRING|HTMLelement(s))
			defaultLoaderContainerId: false, //BOOL|STRING | ID OF DEFAULT LOADER CONTAINER ELEMENT | WITHOUT PREPEND'#'
			defaultOutputElementId: 'body', //STRING | ID OF DEFAULT OUTPUT ELEMENT | WITHOUT PREPEND'#'
			postRequestsCaching: false, //BOOL | CACHE ALL AJAXIFYED LINKS WITH POST-METHOD
			getRequestsCaching: true, //BOOL | CACHE ALL AJAXIFYED LINKS WITH GET-METHOD
			AjaxPreCaching: false, //(BOOL|ARRAY|*|STRING) | preCACHE ALL AJAXIFYED LINKS | ARRAY & STRING - FULL PATH WITH HTTP://
			imageCaching: false, //BOOL | EXPERIMENTAL CACHE IMAGES INTO BASE64
			ajaxifySelectors: 'a[id^="go_to_"], [id^="ajax_"], button[class^="ajax_"], [data-ajaxify="true"]', //STRING | JQUERY SELECTOR
			cacheToLocalStorage: true, //ALLOW TO CACHE INTO LOCALSTORAGE IF AVAILABLE
			cacheExpiration: 604800000, //INT | DEFAULT: 7 DAYS | TIME BETWEEN VISITING SAME CACHED LINK WITHOUT UPDATE
		},

		cache : new Object(), 
		cache_inputs : new Object(), 
		config : new Object(),
		runtime : { 
			elementsToHide : new Object(), 
			abortSendAjax : false, 
			abortPushState : false,
			preventFollow : false,
		},

		/**
		* Initialize Config.
		*/
		init: function(obj) {

			obj = (isset(obj) ? obj : new Object);

			this.setConfig('loader', 					obj.loader)
				.setConfig('postRequestsCaching', 		obj.postRequestsCaching)
				.setConfig('getRequestsCaching', 		obj.getRequestsCaching)
				.setConfig('defaultLoaderContainerId', 	obj.defaultLoaderContainerId)
				.setConfig('defaultOutputElementId', 	obj.defaultOutputElementId)
				.setConfig('AjaxPreCaching', 			obj.AjaxPreCaching)
				.setConfig('ajaxifySelectors', 			obj.ajaxifySelectors)
				.setConfig('cacheToLocalStorage', 		obj.cacheToLocalStorage)
				.setConfig('cacheExpiration', 		 	obj.cacheExpiration)
				.setConfig('imageCaching', 		 		obj.imageCaching);
			if(typeof(Storage) !== "undefined" && indirajs.config.cacheToLocalStorage){

				this.cache = localStorage;
				this.config.cachePlace = 'storage';
				
			}else{

				this.cache = new Object();
				this.config.cachePlace = 'js';		
			}

			return this;
		},


		preCache: function(rules){

			var cache_id = 'cached_' + rules.outputElement + '_' + stripSpecialChars(rules.url);
			var ajaxSettings = new Object;

			if(indirajs.config.AjaxPreCaching === '*'){

				ajaxSettings = {	type: "GET", 
									url: rules.url, 
									async: false,
									cache: false,
									timeout: 30000,	};
			}else{

				ajaxSettings = {	type: "GET", 
									url: rules.url, };
			}

			if(!isset(indirajs.cache[cache_id])){

				
				indirajs.runtime.preventFollow = true;

				
				$(document).trigger("abortPushState", [true]);

				$.ajax(ajaxSettings).done(function(response) {

					if(indirajs.config.cachePlace == 'js'){

						indirajs.addToCache(cache_id, $('<div></div>').append(response));	

					}else{

						indirajs.addToCache(cache_id, response);			
					}

					if(indirajs.config.AjaxPreCaching === '*'){

						indirajs.preCaching($('<div></div>').append(response));
					}
				});
			}

			return cache_id;
		},


		preCaching: function(target, callback, force){
			var preCached = [];

			target.find(indirajs.config.ajaxifySelectors).each(function(){

				indirajs.fetchDataAttributes($(this), function(rules){

					if(rules){

						if(indirajs.config.AjaxPreCaching === '*'){

							if(!rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){
								
								preCached.push(indirajs.preCache(rules));
								
							}

						}else if(jQuery.isArray(indirajs.config.AjaxPreCaching)){

						
							var url = null;

							for (var i = 0; i < indirajs.config.AjaxPreCaching.length; i++) {
								
								url = indirajs.config.AjaxPreCaching[i];
								
								if(rules.url === url && !rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){

									preCached.push(indirajs.preCache(rules));
									
								}
							}

						}else if(indirajs.config.AjaxPreCaching === true || force === true){

							if(!rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){

								preCached.push(indirajs.preCache(rules));
							}


						}else if(typeof(indirajs.config.AjaxPreCaching) === 'string' && rules.url.match(indirajs.config.AjaxPreCaching)){

							if(!rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){

								preCached.push(indirajs.preCache(rules));
								
							}
						}

					}else{

						console.log('YOU FAILED DOMAIN-ORIGIN POLICY');
						return false;
					}
				});	
			})
			.promise()
			.done(function(){ 

				if(callback && typeof callback === "function"){

					
					callback(preCached);
				}

			});

			return this;
		},


		imageMime: function(extension){

			var mimes = { ico: 'image/x-icon',ief: 'image/ief',jfif: 'image/pipeg',jpe: 'image/jpeg',jpeg: 'image/jpeg',jpg: 'image/jpeg',tif: 'image/tiff',tiff: 'image/tiff',xbm: 'image/x-xbitmap',gif: 'image/gif',png: 'image/png', };

			if(isset(mimes[extension])){

				return mimes[extension];

			}else{

				return false;
			}

		},

		cacheImages: function(target, callback){

			var cachedImages = [];

			target.find('img').each(function() {
				
				var cache_key = 'cached_image_' + stripSpecialChars($(this).attr('src'));

				cachedImages.push(cache_key);
				
				if(!isset(indirajs.cache[cache_key])){

					var extension = getExtension($(this).attr('src'));
					var mime = indirajs.imageMime(extension);

					

					if(extension !== false && mime !== false){

						
						var img = $(this)[0];
						var canvas = document.createElement("canvas");
						canvas.width = $(this).width();
						canvas.height = $(this).height();

						// Copy the image contents to the canvas
						var ctx = canvas.getContext("2d");
						ctx.drawImage(img, 0, 0);

						// Get the data-URL formatted image
						// Firefox supports PNG and JPEG. You could check img.src to
						// guess the original format, but be aware the using "image/jpg"
						// will re-encode the image.
						var dataURL = canvas.toDataURL("image/png");

						
						 //here is where I get 'data:,'       

						dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
						dataURL = 'data:' + mime + ';base64,' + dataURL,

						
						indirajs.addToCache(cache_key, dataURL);
					}
				}
			})
			.promise()
			.done(function(){ 

				if(callback && typeof callback === "function"){

					
					callback(cachedImages);
				}

			});

			return this;
		},

		outputCachedImages: function(target, callback){

			var cachedImages = [];

			target.find('img').each(function() {
				
				var cache_key = 'cached_image_' + stripSpecialChars($(this).attr('src'));

				cachedImages.push(cache_key);
				
				if(isset(indirajs.cache[cache_key])){

					$(this).attr('src', indirajs.cache[cache_key]);
				}
			})
			.promise()
			.done(function(){ 

				if(callback && typeof callback === "function"){

					
					callback(cachedImages);
				}

			});

			return target;
		},

		/**
		* Set config property
		*/
		setConfig: function(property, value){

			indirajs.config[property] = (isset(value) ? value : indirajs.defaults[property]);

			return this;
		},

		/**
		* Shower loads page (indirajs.runtime.rulesObject.url) via GET method.
		*/
		getAJAX: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;
						

			indirajs.doCache(obj, function(cache_result){

				obj.outputElement = cache_result.out_el;

				
				

				if(cache_result.from_cache === true){

					

					if(callback){ 

						indirajs.runCallback(callback(cache_result.element)); 

					}else{

						return; 
					}
				
				}else{

					indirajs.sendAJAX({ type: "GET", url: obj.url, }, obj, callback);
				}

			});

			return this;
		},

		/**
		* Showerp loads page (indirajs.runtime.rulesObject.url) 
		* and passing data specified in (indirajs.runtime.rulesObject.postQuery) via POST method.
		*/
		postAJAX: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;
			

			indirajs.doCache(obj, function(cache_result){

				obj.outputElement = cache_result.out_el;

				if(cache_result.from_cache === true){

					if(callback){ 

						indirajs.runCallback(callback(cache_result.element)); 

					}else{

						return; 
					}
				}

				
				
				if(obj.encodePostQuery){

					
					obj.postQuery = encode_query(obj.postQuery);

					
				}
				
				indirajs.sendAJAX({ type: "POST", url: obj.url, data: obj.postQuery, }, obj, callback);
			});

			return this;
		},

		/**
		* Showerp_alert loads page (indirajs.runtime.rulesObject.url), passing data specified in (indirajs.runtime.rulesObject.postQuery) 
		* and before send ajax request invokes alert() function with (indirajs.runtime.rulesObject.confirmMessage) via POST method.
		*/
		confirmPostAJAX: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;
						var message = confirm(obj.confirmMessage);
			if(message === true){

				indirajs.postAJAX(obj, callback);
			}

			return this;
		},

		/**
		* file_upload uploads file (indirajs.runtime.rulesObject.url), passing data specified in FormData($('#field_name')[0])
		*/
		postFileAJAX: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;

			var fd = new FormData();
			fd.append( obj.formname, $("#" + obj.filefield)[0].files[0] );

			indirajs.sendAJAX({ type: "POST", url: obj.url, data: fd, processData: false, contentType: false, }, obj, callback);

			return this;
		},


		runCallback: function(callback){

			if(typeof callback === 'string'){

				
				

				callback = eval(callback);

							}else if(typeof callback === 'function'){

				
				
				callback();			}else{

				
			}

			return this;
		},

		restoreInputs: function(element, obj){

			var page_id = obj.outputElement + '_' + stripSpecialChars(obj.url);

			element.find('select, textarea, input').each(function(){

				
				
				if($(this).attr('id') != undefined){

					if($(this).attr('data-prevent-caching') !== 'true'){

						if(indirajs.cache_inputs['cached_' + page_id + '_' + $(this).attr('id')]){

							$(this).val(indirajs.cache_inputs['cached_' + page_id + '_' + $(this).attr('id')]);
							
						}
					}
				}
			});

			return this;
		},

		returnFromCache: function(obj){

			var cache_result = {};
			var page_id = obj.outputElement + '_' + stripSpecialChars(obj.url);

			if(indirajs.cache['cached_' + page_id] && parseInt(indirajs.cache['cached_' + page_id + '_expireOn']) > (new Date()).getTime()){

				$(document).trigger("loadingFormCacheStart", [true]);
				

				var cached_div = $("<div></div>", {id:"cached_" + page_id});

				
				$('#' + obj.outputElement).append(cached_div);


				if(indirajs.config.cachePlace == 'js'){
					
					
					cached_div.append(indirajs.cache['cached_' + page_id].html());

				}else{

					var cache = indirajs.cache['cached_' + page_id];

					if(indirajs.config.cachePlace === 'storage' && indirajs.config.imageCaching === true){

						var tmp = $('<div></div>').append(cache);

						cache = indirajs.outputCachedImages(tmp);
					}

					
					cached_div.append(cache);
				}
				
				

				indirajs.restoreInputs(cached_div, obj);

				
				
				$(document).trigger("loadingFormCacheStop", [true]);

				
				cache_result = {out_el: 'cached_' + page_id, from_cache: true, element: cached_div};

				if(obj.callback){

					

					indirajs.runCallback(obj.callback);
				}

			}else{

				$(document).trigger("loadingFormCacheStart", [false]);

				if(!obj.append && !obj.replace && !obj.prepend){

					var cached_div = $("<div></div>", {id:"cached_" + page_id});
					

					$('#' + obj.outputElement).append(cached_div);
					cache_result = {out_el: 'cached_' + page_id, from_cache: false, element: cached_div};
				
				}else{

					cache_result = {out_el: obj.outputElement, from_cache: false, element: false};
					
				}
			}
			
			return cache_result;
		},

		addToCache: function(key, value){

			indirajs.cache[key] = value;
			indirajs.cache[key + '_expireOn'] = (new Date()).getTime() + indirajs.config.cacheExpiration;
		},

		cacheElements: function(elements, callback){

			elements.each(function() {

				if(indirajs.config.cachePlace == 'js'){

					

					indirajs.addToCache($(this).attr('id'), $(this));

					

				}else{

					

					

					if(indirajs.config.cachePlace === 'storage' && indirajs.config.imageCaching === true){

						

						indirajs.cacheImages($(this));
					}

					indirajs.addToCache($(this).attr('id'), $(this).html());

					
				}

				indirajs.cacheInputs($(this));
			})
			.promise()
			.done(function(){ 

				if(callback && typeof callback === "function"){

					callback(elements);
				}

			});

			return this;
		},

		cacheInputs: function(element){

			var element_id = element.attr('id');

			element.find('select, textarea, input').each(function(){

				if($(this).val() && $(this).attr('id') != undefined){

					if($(this).attr('data-prevent-caching') !== 'true'){

						

						indirajs.cache_inputs[element_id + '_' + $(this).attr('id')] = $(this).val();
					}
				}
			});
		},

		hideCachedElements: function(){
			

			if(isset(indirajs.runtime.elementsToHide)){				$.each(indirajs.runtime.elementsToHide, function(index, value){
					
					if(!value.append && !value.replace && !value.prepend){
										
						
						value.element.remove();
					}
				});

				
				indirajs.runtime.elementsToHide = new Object();
			}

			return this;
		},

		doCache: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;

			var cache_result = {};

			var page_id = obj.outputElement + '_' + stripSpecialChars(obj.url);

			indirajs.runtime.elementsToHide[page_id] = { element: $('#' + obj.outputElement).children(), append: obj.append, prepend: obj.prepend, replace: obj.replace };			
			var to_cache = $('#' + obj.outputElement).children('[id^="cached_"]');						
			if(to_cache.length !== 0){

				indirajs.cacheElements(to_cache);
			}

			if(obj.caching){

				

				cache_result = indirajs.returnFromCache(obj);

			}else{

				

				$('#' + obj.outputElement).show();
				cache_result = {out_el: obj.outputElement, from_cache: false, element: false};
			}

			if(callback && typeof callback === "function"){

				
				callback(cache_result);
			}

			return this;
		},


		fetchDataAttributes: function(element, callback){

			var dataAttributes = new Object;

			element.each(function() {

				$.each(this.attributes, function() {
					// this.attributes is not a plain object, but an array
					// of attribute nodes, which contain both the name and value
					 if(this.specified) {

						if (this.name.match(/(^data-[0-9a-zA-Z\-]+$|href)/i)){

							var key = this.name.replace("data-","");
							var value = this.value;

							value = (String(value) === "false" || String(value) === "true") ? eval(value) : String(value);

							dataAttributes[stripSpecialChars(key)] = value;
						}
					}
				});
			});

			//ALIASES AND DEPENDENCY CHECK
			dataAttributes.loaderContainerId = (!isset(dataAttributes.load)) ? indirajs.config.defaultLoaderContainerId : dataAttributes.load;
			dataAttributes.postQuery = (!isset(dataAttributes.post)) ? false : dataAttributes.post;
			dataAttributes.restoreLoaderContainer 	= (!isset(dataAttributes.restore)) ? true : dataAttributes.restore;
			dataAttributes.encodePostQuery = (!isset(dataAttributes.encode)) ? true : dataAttributes.encode;
			dataAttributes.outputElement = (!isset(dataAttributes.out)) ? indirajs.config.defaultOutputElementId : dataAttributes.out;
			dataAttributes.confirmMessage = (!isset(dataAttributes.message)) ? false : dataAttributes.message;

			if(isset(dataAttributes.post)){

				dataAttributes.caching = (isset(dataAttributes.caching)) ? dataAttributes.caching : indirajs.config.postRequestsCaching;

			}else{

				dataAttributes.caching = (isset(dataAttributes.caching)) ? dataAttributes.caching : indirajs.config.getRequestsCaching;
			}

			if(isset(dataAttributes.href)){

				dataAttributes.url = dataAttributes.href;
			}

			if(isset(dataAttributes.link)){

				dataAttributes.url = dataAttributes.link;
			}

			if(isset(dataAttributes.url)){

				if(dataAttributes.url.match(/(?:(?:(?:\bhttps?|ftp):\/\/)|^)([\-a-z0-9.]+)\//i)){

					var pattern = new RegExp('(^http:\/\/'+ window.location.host.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") + ')');
					if(!pattern.test(dataAttributes.url)){

						console.log("DOMAIN-ORIGIN POLICY - [FAILED] | RETURN FALSE");
						dataAttributes = false;
					}
				}
			}

			indirajs.runtime.rulesObject = dataAttributes;

			if(callback && typeof callback === "function"){

				callback(dataAttributes);
			}

			return this;
		},

		ajaxify: function(target){

			if(!target){

				var target = $(document);
			}
			

			if(indirajs.config.AjaxPreCaching && indirajs.config.AjaxPreCaching !== '*'){

				indirajs.preCaching(target);
			}

			if(indirajs.config.length === 0) {
		
				config = indirajs.init();
				
			}

			if($('[data-scroll-load="true"]').length !== 0){

				$('[data-scroll-load="true"]').each(function(){

					$(window).unbind('scroll.' + $(this).attr('id'));
				});

				$('[data-scroll-load="true"]:visible').each(function(){

					var scroll_el_id = $(this).attr('id');
					var element = $(this);

					$(window).unbind('scroll.' + scroll_el_id).bind('scroll.' + scroll_el_id, function(event){
					
						var scrollBottom = $(window).scrollTop() + $(window).height();
						var elementBottom = element[0].scrollHeight + element.offset().top;
						
						if(scrollBottom >= elementBottom){

							eval($(element).attr('data-scroll-callback'));
							$(window).unbind('scroll.' + scroll_el_id);
						}
					});

				});
			}

			target.find(indirajs.config.ajaxifySelectors).unbind('click.link').bind('click.link', function(event){

				indirajs.runtime.rulesObject = new Object();

				indirajs.fetchDataAttributes($(this), function(dataAttributes){

					if(dataAttributes){

						event.stopPropagation();
						event.preventDefault();

						indirajs.runtime.rulesObject = dataAttributes;

						if(!isset(dataAttributes.url)){
							
							console.log('NOTHING TO AJAXIFY href OR data-link ATTRIBUTES IS NOT FOUND');
							return false;
						}
		
						if(!dataAttributes.preventfollow){

							indirajs.runtime.preventFollow = false;	
							$(document).trigger("abortPushState", [false]);
							$(document).trigger("beforePushState");				

							if(!indirajs.runtime.abortPushState){

								History.pushState(dataAttributes, dataAttributes.title, dataAttributes.url);
							}

						}else{

							indirajs.runtime.preventFollow = true;
							$(document).trigger("abortPushState", [true]);	

							if(!indirajs.runtime.abortSendAjax){

								if(dataAttributes.filefield && dataAttributes.formname){

									indirajs.postFileAJAX(dataAttributes);

								}else if(dataAttributes.message){

									indirajs.confirmPostAJAX(dataAttributes);

								}else if(dataAttributes.post){
									
									indirajs.postAJAX(dataAttributes);
								
								}else{

									indirajs.getAJAX(dataAttributes);
								}
							}
						}

						return false;
					
					}else{

						console.log("DOMAIN-ORIGIN POLICY - [FAILED] | ACT AS NORMAL ANCHOR");
					}
				});
			});

			return this;
		},


		responseToElement: function(element, response, rulesObject, callback){

			if(rulesObject.append == 'prepend' || rulesObject.prepend === true){

				

				element.prepend(response);			}else if(rulesObject.append){

				
				element.append(response);

			}else if(rulesObject.replace){

				

				element.replaceWith(response);			}else{

				if(rulesObject.outputElement !== 'false' && rulesObject.outputElement !== false){
					
					

					element.html(response);
				}
			}

			if(callback && typeof callback === "function"){

				callback(element, response, rulesObject);
			}

			return element;
		},


		afterSendAjax: function(rules, response){
			

			if(rules.remove){

				
				$('#'+rules.remove).remove();
			}

			if(rules.outpopup){

				

				if(rules.outpopup === true){
					
					$.gritter.add({text: response});
				
				}else{

					$.gritter.add({text: rules.outpopup});
				}
			}

			if(rules.callback){

				

				indirajs.runCallback(rules.callback);
			}

			$(document).trigger("afterSendAjax");
		},


		outputIntoCache: function(outputElementContainer, response, rulesObject, callback){

			$.each(outputElementContainer, function(index, value) {

				
				var tmp = $('<div></div>').append(indirajs.cache[value]);

				
				outputElementContainer = tmp.find('#' + rulesObject.outputElement);

				
				

				indirajs.responseToElement(outputElementContainer, response, rulesObject, function(outputElementContainer, response, rulesObject){

					
					

					if(indirajs.config.cachePlace == 'js'){

						indirajs.addToCache(value, tmp);

					}else{

						indirajs.addToCache(value, tmp.html());
					}
				});
			});

			if(callback && typeof callback === "function"){

				callback();
			}
		},


		processAJAXsuccess: function(response, rulesObject){

			if(indirajs.config.cachePlace === 'storage' && indirajs.config.imageCaching === true){

				var tmp = $('<div></div>').append(response);
				response = indirajs.outputCachedImages(tmp);
			}

			if($('#'+rulesObject.outputElement).length === 0){

				
				
				indirajs.searchInCache(rulesObject.outputElement, function(outputElementContainer){

					
				
					if(typeof outputElementContainer == 'string'){
						
						
						outputElementContainer = $('#'+outputElementContainer);

						indirajs.afterSendAjax(rulesObject, response);
					
					}else{
		
						indirajs.outputIntoCache(outputElementContainer, response, rulesObject, function(){
							
							
							indirajs.afterSendAjax(rulesObject, response);
						});
					}

				});

			}else{

				
				var outputElementContainer = $('#'+rulesObject.outputElement);
				indirajs.responseToElement(outputElementContainer, response, rulesObject, function(outputElementContainer, response, rulesObject){

					indirajs.afterSendAjax(rulesObject, response);
				});
			}

			return this;
		},


		//SEND AJAX REQUEST
		sendAJAX: function(ajaxRequestSettings, rulesObject, callback){

			$(document).trigger("beforeSendAjax");
			if(rulesObject.loaderContainerId == false){

				rulesObject.loaderContainerId = rulesObject.outputElement;
			}

			var previousStateLoaderContainer = $('#'+rulesObject.loaderContainerId).html();
			var loaderElement = $(indirajs.config.loader);

			$.ajax(ajaxRequestSettings).done(function(response) {

				indirajs.restoreLoader(rulesObject, previousStateLoaderContainer, loaderElement);

				if(callback){ 

					
					
					indirajs.runCallback(callback(response)); 
				}

				
				
				indirajs.processAJAXsuccess(response, rulesObject);

				return response;

			}).fail(function(jqXHR, textStatus){

				indirajs.restoreLoader(rulesObject, previousStateLoaderContainer, loaderElement);
			});

			if(rulesObject.loaderContainerId){

				

				if('#'+rulesObject.loaderContainerId !== rulesObject.outputElement && $('#'+rulesObject.loaderContainerId).attr('id') !== $('#'+rulesObject.outputElement).parent().attr('id')){

					
					$('#'+rulesObject.loaderContainerId).children().hide();
					$('#'+rulesObject.loaderContainerId).prepend(loaderElement);
					
				
				}else{

					$('#'+rulesObject.loaderContainerId).prepend(loaderElement);
				}
			}

			return this;
		},

		restoreLoader: function(rules, previousStateLoaderContainer, loaderElement){

			if(rules.restoreLoaderContainer){

				if('#'+rules.loaderContainerId !== rules.outputElement && $('#'+rules.loaderContainerId).attr('id') !== $('#'+rules.outputElement).parent().attr('id')){

					$('#'+rules.loaderContainerId).html(previousStateLoaderContainer);
				
				}else{

					loaderElement.remove();
				}
			}
		},

		searchInCache: function(id, callback){

			var toReturn;
			var result = new Object;

			$.each(indirajs.cache, function(index, value){

				var tmp = $('<div></div>');
				var element = tmp.append(indirajs.cache[index]);

				if($('#' + id, element).exists()){

					

					result[index] = index;
				}
			});

			if(jQuery.isEmptyObject(result)){

				toReturn = id;

			}else{

				toReturn = result;
			}

			if(callback && typeof callback === "function"){ 

				callback(toReturn); 
			}

			return toReturn;
		},

	};

})();

$(function(){

	indirajs.ajaxify($(document));

	if(indirajs.config.AjaxPreCaching === '*'){

		indirajs.preCaching($(document));
	}
});

//HELPERS:
//ISSET CHECK IF OBJECT IS SET
function isset(v){

	if(typeof(v) != "undefined" && v !== null){
		return true
	}else{
		return false;
	}
}

//GET CACHE UNIQUE ID
function stripSpecialChars(a){ 

	a = encodeURIComponent(a);
	a = a.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	return a;
}

//ENCODE QUERY STRING
function encode_query(q){

	q = eval('(' + q + ')');
	q = JSON.stringify(q);
	q = q.replace(/\n/g, '<br>');
	q = 'data='+encodeURIComponent(q);

	return q;
}

//HTMLSPECIALCHARS EQUAL
function escapeHtml(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

//RETURN FILE EXTENSION
function getExtension(file){

	var a = file.split('.');
	if( a.length == 1 || ( a[0] = "" && a.length == 2 ) ) {

		
	    return false;
	}
	return a.pop(); 
}

//SHORTCUT HELPERS:
/**
* Shower loads page (var p) via GET method.
*
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	function 	callback
*
*/
function shower(p, load_el, out_el, append, restore, remove, popup_out, callback, caching, replace){

	var obj = {

		caching: caching,
		encodePostQuery: false,
		href: p,
		link: p,
		append: append,
		restore: restore,
		remove: remove,
		replace: replace,
		loaderContainerId: load_el,
		outputElement: out_el,
		out: out_el,
		postQuery: false,
		restoreLoaderContainer: restore,
		title: "",
		url: p,
		callback: callback,
		outpopup: popup_out,
		formname: false,
		filefield: false,
		post: false,

	};

	indirajs.runtime.rulesObject = new Object;
	indirajs.runtime.rulesObject = obj;
	indirajs.getAJAX(obj);
}


/**
* Showerp loads page (var p) and passing data specified in (var q) via POST method.
*
* @param 	string 		q
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	boolean 	encode
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	function 	callback
*
*/
function showerp(q, p, load_el, out_el, append, restore, encode, remove, popup_out, callback, caching, replace){

	var obj = {

		caching: caching,
		encodePostQuery: encode,
		href: p,
		link: p,
		append: append,
		restore: restore,
		remove: remove,
		replace: replace,
		loaderContainerId: load_el,
		load: load_el,
		outputElement: out_el,
		out: out_el,
		postQuery: q,
		restoreLoaderContainer: restore,
		title: "",
		url: p,
		callback: callback,
		outpopup: popup_out,
		formname: false,
		filefield: false,
		post: q,

	};

	indirajs.runtime.rulesObject = new Object;
	indirajs.runtime.rulesObject = obj;
	indirajs.postAJAX(obj);
}

/**
* Showerp_alert loads page (var p), passing data specified in (var q) 
* and before send ajax request invokes alert() function with (var message) via POST method.
*
* @param 	string 		q
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	string 		message
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	boolean 	encode
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	function 	callback
*
*/
function showerp_alert(q, p, load_el, out_el, message, append, restore, encode, remove, popup_out, callback, caching, replace){

	var obj = {

		caching: caching,
		encodePostQuery: encode,
		href: p,
		link: p,
		append: append,
		restore: restore,
		remove: remove,
		replace: replace,
		loaderContainerId: load_el,
		load: load_el,
		outputElement: out_el,
		out: out_el,
		postQuery: q,
		restoreLoaderContainer: restore,
		title: "",
		url: p,
		callback: callback,
		outpopup: popup_out,
		formname: form_name,
		filefield: field_name,
		post: q,
		message: message,
		confirmMessage: message,

	};

	indirajs.runtime.rulesObject = new Object;
	indirajs.runtime.rulesObject = obj;
	indirajs.confirmPostAJAX(obj);
}

/**
* file_upload uploads file (var p), passing data specified in FormData($('#field_name')[0])
*
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	boolean 	encode
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	string 		field_name
* @param 	function 	callback
*
*/
function file_upload(p, load_el, out_el, append, restore, remove, popup_out, field_name, form_name, callback, replace){

	var obj = {

		caching: false,
		encodePostQuery: true,
		href: p,
		link: p,
		append: append,
		restore: restore,
		remove: remove,
		replace: replace,
		loaderContainerId: load_el,
		load: load_el,
		outputElement: out_el,
		out: out_el,
		postQuery: false,
		restoreLoaderContainer: restore,
		title: "",
		url: p,
		callback: callback,
		outpopup: popup_out,
		formname: form_name,
		filefield: field_name,

	};

	indirajs.runtime.rulesObject = new Object;
	indirajs.runtime.rulesObject = obj;
	indirajs.postFileAJAX(obj);
}


//Bind to events
$(document).bind('abortPushState', function(e, rule){
	
	indirajs.runtime.abortPushState = rule;
	return;
});

$(document).bind('abortSendAjax', function(e, rule){
	
	indirajs.runtime.abortSendAjax = rule;
	return;
});

$(document).bind('afterSendAjax', function(){

	indirajs.hideCachedElements();
	indirajs.ajaxify((isset(indirajs.runtime.rulesObject.outputElement)) ? $('#' + indirajs.runtime.rulesObject.outputElement) : $(document));
});

$(document).bind('loadingFormCacheStop', function(e, rule){

	indirajs.hideCachedElements();
	indirajs.ajaxify((isset(indirajs.runtime.rulesObject.outputElement)) ? $('#' + indirajs.runtime.rulesObject.outputElement) : $(document));
});


/**
* Used for back and forward browser navigation in case of AJAX powered links and site navigation.
* Using State.data array defines previously used function and invokes in again.
*/
History.Adapter.bind(window,'statechange',function(){ 

	var State = History.getState();
	indirajs.runtime.rulesObject.url = State.url;

	if(State.data.confirmMessage){
		
		indirajs.confirmPostAJAX(State.data);  

	}else if(State.data.query){

		indirajs.postAJAX(State.data);

	}else{

		indirajs.getAJAX(State.data);
	}
});


jQuery.fn.exists = function(){ return this.length > 0; }

var $cached = new Object();
var $cached_inputs = new Object();
var hide_after_ajax = new Object();
var output_element_id, loader_container, cache_on_POST, loading_element, abortSendAjax, currentURL, abortPushState = false;
var prevent_follow;

//Bind to events
$(document).bind('abortPushState', function(e, rule){
	
	abortPushState = rule;
	return;
});

$(document).bind('abortSendAjax', function(e, rule){
	
	abortSendAjax = rule;
	return;
});

$(document).bind('loadingFormCacheStop', function(e, rule){

	ajaxify();
	
	if(!jQuery.isEmptyObject(hide_after_ajax)){
			
		$.each(hide_after_ajax, function(index, value){
			
			if(!value.append && !value.replace){

				value.element.remove();
			}
		});
		hide_after_ajax = new Object();
	}
});

var default_config = {
	loader: '<span style="display:block;width:100px;height: 100%;margin: 0 auto;">Loading...</span>',
	defaultLoaderContainer: false,
	defaultOutputElementId: 'body',
	defaultPostCaching: false,
};

if(typeof(indiraJsConfig) != "undefined" && indiraJsConfig !== null) {

	indirajs_init(indiraJsConfig);

}else{

	indirajs_init(default_config);
}

//Indira Initialization Function
function indirajs_init(obj){

	loading_element 	= 	(isset(obj.loader) ? obj.loader : default_config.loader);
	cache_on_POST 		= 	(isset(obj.defaultPostCaching) ? obj.defaultPostCaching : default_config.defaultPostCaching);
	loader_container	= 	(isset(obj.defaultLoaderContainer) ? obj.defaultLoaderContainer : default_config.defaultLoaderContainer);
	output_element_id	=	(isset(obj.defaultOutputElementId) ? obj.defaultOutputElementId : default_config.defaultOutputElementId);
};

// Bind onclick event to all matched DOM-objects
$(function(){
	ajaxify();
});

// Binds 'click' on anchor elements with ids started with go_to_, on buttons with ids or class started with ajax_
function ajaxify(){

	currentURL = window.location.href;

	if($('[data-scroll-load="true"]').length !== 0){

		$('[data-scroll-load="true"]').each(function(){

			var scroll_el_id = $(this).attr('id');
			$(window).unbind('scroll.' + scroll_el_id);
		});

		$('[data-scroll-load="true"]:visible').each(function(){

			var scroll_el_id = $(this).attr('id');
			var element = $(this);

			$(window).unbind('scroll.' + scroll_el_id).bind('scroll.' + scroll_el_id, function(event){
			
				var scrollBottom = $(window).scrollTop() + $(window).height();
				var elementBottom = element[0].scrollHeight + element.offset().top;
				
				if(scrollBottom >= elementBottom){

					eval($(element).attr('data-scroll-callback'));
					$(window).unbind('scroll.' + scroll_el_id);
				}
			});

		});
	}

	$('a[id^="go_to_"], [id^="ajax_"], button[class^="ajax_"], [data-ajaxify="true"]').unbind('click.link').bind('click.link', function(event){

		event.stopPropagation();
		event.preventDefault();

		var load_el, out_el, q, link, title, append, restore, remove, popup_out, field_name, callback, caching;

		if($(this).attr('data-load')){
			load_el = $(this).attr('data-load');
		}else{
			load_el = loader_container;
		}

		if($(this).attr('data-caching')){
			caching = eval($(this).attr('data-caching'));
		}else{

			if($(this).attr('data-post')){
				caching = cache_on_POST;
			}else{
				caching = true;
			}
		}


		if($(this).attr('data-append')){
			append = $(this).attr('data-append');
		}else{
			append = false;
		}

		if($(this).attr('data-replace')){
			replace = eval($(this).attr('data-replace'));
		}else{
			replace = false;
		}

		if($(this).attr('data-remove')){
			remove = $(this).attr('data-remove');
		}else{
			remove = false;
		}

		if($(this).attr('data-restore')){
			restore = eval($(this).attr('data-restore'));
		}else{
			restore = true;
		}

		if($(this).attr('data-encode')){
			encode = eval($(this).attr('data-encode'));
		}else{
			encode = true;
		}

		if($(this).attr('data-callback')){
			callback = $(this).attr('data-callback');
		}else{
			callback = false;
		}

		if($(this).attr('data-out')){
			out_el = $(this).attr('data-out');
		}else{
			out_el = output_element_id;
		}

		if($(this).attr('data-post')){
			q = $(this).attr('data-post');
		}else{
			q = '';
		}

		if($(this).attr('data-message')){
			message = $(this).attr('data-message');
		}else{
			message = null;
		}

		if($(this).attr('href')){
			link = $(this).attr('href');
		}else{
			link = $(this).attr('data-link');
		}

		if($(this).attr('data-out-popup')){
			
			if($(this).attr('data-out-popup') == 'true'){
				popup_out = true;
			}else{
				popup_out = $(this).attr('data-out-popup');
			}

		}else{
			popup_out = false;
		}

		if($(this).attr('data-title')){
			title = $(this).attr('data-title');
		}else{
			title = '';
		}

		if($(this).attr('data-file-field')){
			field_name = $(this).attr('data-file-field');
		}else{
			field_name = '';
		}

		if($(this).attr('data-form-name')){
			form_name = $(this).attr('data-form-name');
		}else{
			form_name = '';
		}

		if($(this).attr('data-prevent-follow') !== 'true'){

			prevent_follow = false;

			$(document).trigger("beforePushState");

			if(!abortPushState){

				History.pushState({query:q, load_element:load_el, out_element:out_el, msg:message, appnd:append, rstr:restore, enc:encode, popup:popup_out, caching:caching, callback:callback, replace:replace}, title, link);
			}

		}else{

			prevent_follow = true;

			$(document).trigger("beforeSendAjax");

			if(!abortSendAjax){

				if(field_name){

					file_upload(link, load_el, out_el, append, restore, remove, popup_out, field_name, form_name, callback, replace);

				}else if(message){

					showerp_alert(q, link, load_el, out_el, message, append, restore, encode, remove, popup_out, callback, replace);

				}else if(q){
					
					showerp(q, link, load_el, out_el, append, restore, encode, remove, popup_out, callback, caching, replace);
				
				}else{

					shower(link, load_el, out_el, append, restore, remove, popup_out, callback, caching, replace);
				}
			}
		}
		
		return false;
	});

}

/**
* Used for back and forward browser navigation in case of AJAX powered links and site navigation.
* Using State.data array defines previously used function and invokes in again.
*
* @param 	string 		State.data.query
* @param 	string 		State.url
* @param 	string 		State.data.load_element
* @param 	string 		State.data.out_element
* @param 	string 		State.data.msg
* @param 	boolean 	State.data.appnd
* @param 	boolean 	State.data.rstr
* @param 	boolean 	tate.data.enc
* @param 	string 		State.data.popup
*
*/
History.Adapter.bind(window,'statechange',function(){ 

    var State = History.getState();   
    if(State.data.msg){
    	
    	showerp_alert(State.data.query, State.url, State.data.load_element, State.data.out_element, State.data.msg, State.data.appnd, State.data.rstr, State.data.enc, false, State.data.popup, State.data.callback, State.data.caching, State.data.replace);  

    }else if(State.data.query){

    	showerp(State.data.query, State.url, State.data.load_element, State.data.out_element, State.data.appnd, State.data.rstr, State.data.enc, false, State.data.popup, State.data.callback, State.data.caching, State.data.replace);

    }else{

    	shower(State.url, State.data.load_element, State.data.out_element, State.data.appnd, State.data.rstr, false, State.data.popup, State.data.callback, State.data.caching, State.data.replace);
    }
});

/**
* Shower loads page (var p) via GET method.
*
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	function 	callback
*
*/
function shower(p, load_el, out_el, append, restore, remove, popup_out, callback, caching, replace){

	cache_result = cache(p, out_el, caching, callback, append, replace);
	out_el = cache_result.out_el;

	if(cache_result.from_cache === true){

		return;
	}

	send_ajax({type: "GET", url: p,}, load_el, out_el, append, restore, remove, popup_out, callback, replace);
}


/**
* Showerp loads page (var p) and passing data specified in (var q) via POST method.
*
* @param 	string 		q
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	boolean 	encode
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	function 	callback
*
*/
function showerp(q, p, load_el, out_el, append, restore, encode, remove, popup_out, callback, caching, replace){

	cache_result = cache(p, out_el, caching, callback, append, replace);
	out_el = cache_result.out_el;

	if(cache_result.from_cache === true){

		return;
	}

	if(encode){

		q = encode_query(q);
	}
	
	send_ajax({ type: "POST", url: p, data: q }, load_el, out_el, append, restore, remove, popup_out, callback, replace);
}

/**
* Showerp_alert loads page (var p), passing data specified in (var q) 
* and before send ajax request invokes alert() function with (var message) via POST method.
*
* @param 	string 		q
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	string 		message
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	boolean 	encode
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	function 	callback
*
*/
function showerp_alert(q, p, load_el, out_el, message, append, restore, encode, remove, popup_out, callback, caching, replace){
	
	message = confirm(message);
	if(message === true){

		showerp(q, p, load_el, out_el, append, restore, encode, remove, popup_out, callback, caching, replace)
	}
}

/**
* file_upload uploads file (var p), passing data specified in FormData($('#field_name')[0])
*
* @param 	string 		p
* @param 	string 		load_el
* @param 	string 		out_el
* @param 	boolean 	append
* @param 	boolean 	restore
* @param 	boolean 	encode
* @param 	string 		remove
* @param 	string 		popup_out
* @param 	string 		field_name
* @param 	function 	callback
*
*/
function file_upload(p, load_el, out_el, append, restore, remove, popup_out, field_name, form_name, callback, replace){

	var fd = new FormData();    
	fd.append( form_name, $("#" + field_name)[0].files[0] );

	send_ajax({ type: "POST", url: p, data: fd, processData: false, contentType: false }, load_el, out_el, append, restore, remove, popup_out, callback, replace);
}

//HELPERS
//GET CACHE UNIQUE ID
function get_cache_num(a){ 

	a = encodeURIComponent(a);
	a = a.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	return a;
}

//ENCODE QUERY STRING
function encode_query(q){

	q = eval('(' + q + ')');
	q = JSON.stringify(q);
	q = q.replace(/\n/g, '<br>');
	q = 'data='+encodeURIComponent(q);

	return q;
}

//CREATE OR SHOW() CACHE ELEMENT
function cache(p, out_el, caching, callback, append, replace){

	var cache_result 	= {};
	var parent_out_el 	= out_el;
	var to_cache 		= $('#' + parent_out_el).children('[id^="cached_"]');
	var page_id 		= parent_out_el + '_' + get_cache_num(p);

	hide_after_ajax[page_id] = {element:$('#' + parent_out_el).children(), append: append, replace: replace};

	if(to_cache.length !== 0){

		to_cache.each(function() {

			$cached[$(this).attr('id')] = $(this);
			var this_cached_element_id = $(this).attr('id');

			$(this).find('select, textarea, input').each(function(){

				if($(this).val() && $(this).attr('id') != undefined){

					$cached_inputs[this_cached_element_id + '_' + $(this).attr('id')] = $(this).val();
				}
			});
		});
	}

	if(caching){

		if($cached['cached_' + page_id]){

			$(document).trigger("loadingFormCacheStart", [true]);	
			var cached_div = $("<div></div>", {id:"cached_" + page_id});
			$('#' + parent_out_el).append(cached_div);

			cached_div.append($cached['cached_' + page_id].html());

			cached_div.find('select, textarea, input').each(function(){

				if($(this).attr('id') != undefined){

					if($cached_inputs['cached_' + page_id + '_' + $(this).attr('id')]){

						$(this).val($cached_inputs['cached_' + page_id + '_' + $(this).attr('id')]);
					}
				}
			});

			$(document).trigger("loadingFormCacheStop", [true]);

			cache_result = {out_el: 'cached_' + page_id, from_cache: true};

			if(callback){

				if(typeof callback == 'string'){

					callback = eval(callback);
				
				}else{

					callback();
				}
			}

		}else{

			$(document).trigger("loadingFormCacheStart", [false]);

			if(!append && !replace){

				var cached_div = $("<div></div>", {id:"cached_" + page_id});
				$('#' + parent_out_el).append(cached_div);
				cache_result = {out_el: 'cached_' + page_id, from_cache: false};
			
			}else{

				cache_result = {out_el: parent_out_el, from_cache: false};
			}

		}

	}else{

		$('#' + parent_out_el).show();
		cache_result = {out_el: parent_out_el, from_cache: false};
	}

	return cache_result;
}

//SEND AJAX REQUEST
function send_ajax(obj, load_el, out_el, append, restore, remove, popup_out, callback, replace){

	if(load_el == false){

		load_el = out_el;
	}

	var prev_load_el = $('#'+load_el).html();
	loading_element = $(loading_element);

	$.ajax(obj).done(function( html ) {

		if(restore){

			if('#'+load_el !== out_el && $('#'+load_el).attr('id') !== $('#'+out_el).parent().attr('id')){

				$('#'+load_el).html(prev_load_el);
			
			}else{

				loading_element.remove();
			}
		}

		if(!jQuery.isEmptyObject(hide_after_ajax)){
			
			$.each(hide_after_ajax, function(index, value){
				
				if(!value.append && !value.replace){

					value.element.remove();
				}
			});
			hide_after_ajax = new Object();
		}

		if($('#'+out_el).length === 0){
			
			var out_element = search_in_cache(out_el);
			
			if(typeof out_element == 'string'){
				
				out_element = $('#'+out_element);
			}

		}else{

			var out_element = $('#'+out_el);
		}
		
		if(append == 'prepend'){

			out_element.prepend(html);
		
		}else if(append == 'true'){

			out_element.append(html);

		}else if(replace){

			out_element.replaceWith(html);
		
		}else{

			if(out_el !== 'false'){

				out_element.html(html);
			}
		}

		if(remove){

			$('#'+remove).remove();
		}

		if(popup_out){

			if(popup_out === true){
				
				$.gritter.add({text: html});
			
			}else{

				$.gritter.add({text: popup_out});
			}
		}

		ajaxify();

		if(callback){

			if(typeof callback == 'string'){

				callback = eval(callback);
			
			}else{

				callback();
			}
		}

	}).fail(function(jqXHR, textStatus){

		if(restore){

			if('#'+load_el !== out_el && $('#'+load_el).attr('id') !== $('#'+out_el).parent().attr('id')){

				$('#'+load_el).html(prev_load_el);
			
			}else{

				loading_element.remove();
			}
		}
	});

	if(load_el){

		if('#'+load_el !== out_el && $('#'+load_el).attr('id') !== $('#'+out_el).parent().attr('id')){

			$('#'+load_el).children().hide();
			$('#'+load_el).prepend(loading_element);
			
		}else{

			$('#'+load_el).prepend(loading_element);
		}
	}
}


//Search element by id in Cache Object
function search_in_cache(id){

	$.each($cached, function(index, value){

		if(value.find('#' + id).length !== 0){

			id = value.find('#' + id);
		}
	});

	return id;
}

//Check if variable is set (Used for Object's properties)
function isset(v){
	if(typeof(v) != "undefined" && v !== null){
		return true
	}else{
		return false;
	}
}