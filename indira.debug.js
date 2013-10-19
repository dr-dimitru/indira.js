/**
* DEBUG VERSION OF Indira.js v1.6 by Dmitriy A. Golev
* All actions is logged into JS-Console 
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

			console.log('indirajs.init() | RUN');

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
				console.log('indirajs.init() | RUN | this.config.cachePlace = storage');

			}else{

				this.cache = new Object();
				this.config.cachePlace = 'js';

				console.log('indirajs.init() | RUN | this.config.cachePlace = JS');
			}

			return this;
		},


		preCache: function(rules){

			console.log('indirajs.preCache() | RUN | For URL: ' + rules.url);

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

				console.log('indirajs.preCache() | indirajs.runtime.preventFollow == true');
				indirajs.runtime.preventFollow = true;

				console.log('indirajs.preCache() | TRIGGER abortPushState == true');
				$(document).trigger("abortPushState", [true]);

				$.ajax(ajaxSettings).done(function(response) {

					if(indirajs.config.cachePlace == 'js'){

						indirajs.addToCache(cache_id, $('<div></div>').append(response));

						console.log('indirajs.preCache() | Cached to JS-Object Element ID: ' + cache_id);

					}else{

						indirajs.addToCache(cache_id, response);

						console.log('indirajs.preCache() | Cached to LocalStorage Element ID: ' + cache_id);
					}

					if(indirajs.config.AjaxPreCaching === '*'){

						indirajs.preCaching($('<div></div>').append(response));
					}
				});
			}

			return cache_id;
		},


		preCaching: function(target, callback, force){

			console.log('indirajs.preCaching() | RUN');
			var preCached = [];

			target.find(indirajs.config.ajaxifySelectors).each(function(){

				indirajs.fetchDataAttributes($(this), function(rules){

					console.log('indirajs.preCaching() | RUN | this.URL: ' + rules.url);

					if(rules){

						if(indirajs.config.AjaxPreCaching === '*'){

							console.log('indirajs.preCaching() | RUN | *');

							if(!rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){
								
								preCached.push(indirajs.preCache(rules));
								console.log(preCached);
							}

						}else if(jQuery.isArray(indirajs.config.AjaxPreCaching)){

							console.log('indirajs.preCaching() | RUN | [Array]');

							var url = null;

							for (var i = 0; i < indirajs.config.AjaxPreCaching.length; i++) {
								
								url = indirajs.config.AjaxPreCaching[i];
								
								if(rules.url === url && !rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){

									preCached.push(indirajs.preCache(rules));
									console.log(preCached);
								}
							}

						}else if(indirajs.config.AjaxPreCaching === true || force === true){

							console.log('indirajs.preCaching() | RUN | TRUE');

							if(!rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){

								preCached.push(indirajs.preCache(rules));
								console.log(preCached);
							}


						}else if(typeof(indirajs.config.AjaxPreCaching) === 'string' && rules.url.match(indirajs.config.AjaxPreCaching)){

							console.log('indirajs.preCaching() | RUN | indirajs.config.AjaxPreCaching === (string)' + indirajs.config.AjaxPreCaching);

							if(!rules.postQuery && !rules.append && !rules.prepend && !rules.replace && !rules.remove && rules.caching === true){

								preCached.push(indirajs.preCache(rules));
								console.log(preCached);
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

					console.log('preCaching() | RUN CALLBACK | With: cachedImages');
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

			console.log('indirajs.cacheImages() | RUN');

			var cachedImages = [];

			target.find('img').each(function() {
				
				var cache_key = 'cached_image_' + stripSpecialChars($(this).attr('src'));

				cachedImages.push(cache_key);
				
				if(!isset(indirajs.cache[cache_key])){

					var extension = getExtension($(this).attr('src'));
					var mime = indirajs.imageMime(extension);

					console.log('indirajs.cacheImages() | RUN | extension: ' + extension + ' | mime: ' + mime);

					if(extension !== false && mime !== false){

						console.log('indirajs.cacheImages() | RUN | extension: ' + extension + ' | mime: ' + mime);
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

						console.log(cache_key);
						console.log(dataURL); //here is where I get 'data:,'       

						dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
						dataURL = 'data:' + mime + ';base64,' + dataURL,

						console.log('indirajs.cacheImages() | indirajs.addToCache() | cache_key: ' + cache_key);
						indirajs.addToCache(cache_key, dataURL);
					}
				}
			})
			.promise()
			.done(function(){ 

				if(callback && typeof callback === "function"){

					console.log('cacheImages() | RUN CALLBACK | With: cachedImages');
					callback(cachedImages);
				}

			});

			return this;
		},

		outputCachedImages: function(target, callback){

			console.log('indirajs.outputCachedImages() | RUN');

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

					console.log('outputCachedImages() | RUN CALLBACK | With: cachedImages');
					callback(cachedImages);
				}

			});

			return target;
		},

		/**
		* Set config property
		*/
		setConfig: function(property, value){

			console.log('indirajs.setConfig() | RUN | property: ' + property + ' | value: ' + value);

			indirajs.config[property] = (isset(value) ? value : indirajs.defaults[property]);

			return this;
		},

		/**
		* Shower loads page (indirajs.runtime.rulesObject.url) via GET method.
		*/
		getAJAX: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;

			console.log(obj);
			console.log(indirajs.runtime.rulesObject);
			console.log('indirajs.getAJAX() | RUN');
			console.log('indirajs.getAJAX() | URL: ' + obj.url);

			indirajs.doCache(obj, function(cache_result){

				obj.outputElement = cache_result.out_el;

				console.log('indirajs.getAJAX() | cache_result: ');
				console.log(cache_result);

				if(cache_result.from_cache === true){

					console.log('indirajs.getAJAX() | Return result from cache');

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

			console.log('RUN indirajs.postAJAX() function');
			console.log('indirajs.postAJAX() |  url: ' + obj.url);

			indirajs.doCache(obj, function(cache_result){

				obj.outputElement = cache_result.out_el;

				if(cache_result.from_cache === true){

					if(callback){ 

						indirajs.runCallback(callback(cache_result.element)); 

					}else{

						return; 
					}
				}

				console.log(obj);
				console.log("indirajs.postAJAX() | var encode = " + obj.encodePostQuery);
				if(obj.encodePostQuery){

					console.log("indirajs.postAJAX() | String to encode: " + obj.postQuery);
					obj.postQuery = encode_query(obj.postQuery);

					console.log("indirajs.postAJAX() | Encodig result: " + obj.postQuery);
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

			console.log('indirajs.confirmPostAJAX() | RUN');
			console.log('indirajs.confirmPostAJAX() |  url: ' + obj.url);
			
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

			console.log('indirajs.postFileAJAX() | RUN');

			var fd = new FormData();
			fd.append( obj.formname, $("#" + obj.filefield)[0].files[0] );

			indirajs.sendAJAX({ type: "POST", url: obj.url, data: fd, processData: false, contentType: false, }, obj, callback);

			return this;
		},


		runCallback: function(callback){

			console.log('indirajs.runCallback() | RUN | callback: ' + typeof callback);

			if(typeof callback === 'string'){

				console.log('indirajs.runCallback() | Callback is STRING');
				console.log('indirajs.runCallback() | Callback | eval(callback) ' + callback);

				callback = eval(callback);

				console.log('indirajs.runCallback() | Callback | evaluated = ' + callback);
			
			}else if(typeof callback === 'function'){

				console.log('indirajs.runCallback() | Callback is FUNCTION');
				console.log('indirajs.runCallback() | Callback = ' + callback);
				callback();
			
			}else{

				console.log('indirajs.runCallback() | Callback is NOT A FUNCTION');
			}

			return this;
		},

		restoreInputs: function(element, obj){

			console.log('indirajs.restoreInputs() | RUN');

			var page_id = obj.outputElement + '_' + stripSpecialChars(obj.url);

			element.find('select, textarea, input').each(function(){

				console.log('indirajs.restoreInputs() | Restore value for: ' + $(this).attr('id') + ' | From indirajs.cache_inputs[' + 'cached_' + page_id + '_' + $(this).attr('id') + ']');
				
				if($(this).attr('id') != undefined){

					if($(this).attr('data-prevent-caching') !== 'true'){

						if(indirajs.cache_inputs['cached_' + page_id + '_' + $(this).attr('id')]){

							$(this).val(indirajs.cache_inputs['cached_' + page_id + '_' + $(this).attr('id')]);
							console.log('indirajs.restoreInputs() | Value is RESTORED for: ' + $(this).attr('id') + ' | TO: '+indirajs.cache_inputs['cached_' + page_id + '_' + $(this).attr('id')]);
						}
					}
				}
			});

			return this;
		},

		returnFromCache: function(obj){

			console.log('indirajs.returnFromCache() | RUN');

			var cache_result = {};
			var page_id = obj.outputElement + '_' + stripSpecialChars(obj.url);

			if(indirajs.cache['cached_' + page_id] && parseInt(indirajs.cache['cached_' + page_id + '_expireOn']) > (new Date()).getTime()){

				$(document).trigger("loadingFormCacheStart", [true]);
				console.log('indirajs.returnFromCache() | Showing from cache (Element ID): ' + '#cached_' + page_id);

				var cached_div = $("<div></div>", {id:"cached_" + page_id});

				console.log('indirajs.returnFromCache() | Caching into (New Element ID): ' + '#cached_' + page_id);
				$('#' + obj.outputElement).append(cached_div);


				if(indirajs.config.cachePlace == 'js'){
					
					console.log('indirajs.returnFromCache() | Append from JS-Cache');
					cached_div.append(indirajs.cache['cached_' + page_id].html());

				}else{

					var cache = indirajs.cache['cached_' + page_id];

					if(indirajs.config.cachePlace === 'storage' && indirajs.config.imageCaching === true){

						var tmp = $('<div></div>').append(cache);

						cache = indirajs.outputCachedImages(tmp);
					}

					console.log('indirajs.returnFromCache() | Append from localStorage');
					cached_div.append(cache);
				}
				
				console.log('indirajs.returnFromCache() | Check for cached inputs');

				indirajs.restoreInputs(cached_div, obj);

				console.log('indirajs.returnFromCache() | Trigger loadingFormCacheStop');
				
				$(document).trigger("loadingFormCacheStop", [true]);

				console.log('indirajs.returnFromCache() | Save cache_result');
				cache_result = {out_el: 'cached_' + page_id, from_cache: true, element: cached_div};

				if(obj.callback){

					console.log('indirajs.returnFromCache() | RUN CALLBACK');

					indirajs.runCallback(obj.callback);
				}

			}else{

				$(document).trigger("loadingFormCacheStart", [false]);

				if(!obj.append && !obj.replace && !obj.prepend){

					var cached_div = $("<div></div>", {id:"cached_" + page_id});
					console.log('Cache(ON) | Caching into (New Element ID): ' + '#cached_' + page_id);

					$('#' + obj.outputElement).append(cached_div);
					cache_result = {out_el: 'cached_' + page_id, from_cache: false, element: cached_div};
				
				}else{

					cache_result = {out_el: obj.outputElement, from_cache: false, element: false};
					console.log('Cache(ON) | Caching without creating new element in case of Appending or Replacing, into (Element ID): ' + '#' + obj.outputElement);
				}
			}

			console.log('indirajs.returnFromCache() | cache_result: ' + cache_result);
			console.log(cache_result);
			return cache_result;
		},

		addToCache: function(key, value){

			console.log('indirajs.addToCache(' + key +', value) | RUN');

			indirajs.cache[key] = value;
			indirajs.cache[key + '_expireOn'] = (new Date()).getTime() + indirajs.config.cacheExpiration;
		},

		cacheElements: function(elements, callback){

			console.log('indirajs.cacheElements() | RUN');

			elements.each(function() {

				if(indirajs.config.cachePlace == 'js'){

					console.log('indirajs.cacheElements() | CACHING TO JS-OBJECT');

					indirajs.addToCache($(this).attr('id'), $(this));

					console.log('indirajs.cacheElements() | Cached Element ID: ' + $(this).attr('id'));

				}else{

					console.log('indirajs.cacheElements() | CACHING TO LOCAL STORAGE');

					console.log('indirajs.config.cachePlace === '+indirajs.config.cachePlace+' && indirajs.config.imageCaching === '+indirajs.config.imageCaching);

					if(indirajs.config.cachePlace === 'storage' && indirajs.config.imageCaching === true){

						console.log('indirajs.cacheElements() | CACHING IMAGES');

						indirajs.cacheImages($(this));
					}

					indirajs.addToCache($(this).attr('id'), $(this).html());

					console.log('indirajs.cacheElements() | Cached Element ID: ' + $(this).attr('id'));
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

			console.log('indirajs.cacheInputs() | RUN');

			var element_id = element.attr('id');

			element.find('select, textarea, input').each(function(){

				if($(this).val() && $(this).attr('id') != undefined){

					if($(this).attr('data-prevent-caching') !== 'true'){

						console.log('indirajs.cacheInputs() | Saving value for: ' + $(this).attr('id') + ' | Into indirajs.cache_inputs[' + element_id + '_' + $(this).attr('id') + ']');

						indirajs.cache_inputs[element_id + '_' + $(this).attr('id')] = $(this).val();
					}
				}
			});
		},

		hideCachedElements: function(){

			console.log('indirajs.hideCachedElements() | RUN');

			console.log('indirajs.hideCachedElements() | elementsToHide: ' + indirajs.runtime.elementsToHide);
			console.log(indirajs.runtime.elementsToHide);

			if(isset(indirajs.runtime.elementsToHide)){
			
				$.each(indirajs.runtime.elementsToHide, function(index, value){
					
					if(!value.append && !value.replace && !value.prepend){
										
						console.log('indirajs.hideCachedElements() | indirajs.runtime.elementsToHide | Remove from DOM (element ID): ' + value.element.attr('id'));
						value.element.remove();
					}
				});

				console.log('indirajs.hideCachedElements() | indirajs.runtime.elementsToHide | Removed all elements');
				indirajs.runtime.elementsToHide = new Object();
			}

			return this;
		},

		doCache: function(obj, callback){

			obj = (isset(obj)) ? obj : indirajs.runtime.rulesObject;

			console.log('doCache() | RUN');

			var cache_result = {};

			console.log('doCache() | Caching: ' + obj.caching);

			var page_id = obj.outputElement + '_' + stripSpecialChars(obj.url);

			indirajs.runtime.elementsToHide[page_id] = { element: $('#' + obj.outputElement).children(), append: obj.append, prepend: obj.prepend, replace: obj.replace };
			
			
			var to_cache = $('#' + obj.outputElement).children('[id^="cached_"]');
			console.log('doCache() | Elements To toCache: ' + to_cache);
			console.log(to_cache);
			console.log('doCache() | Elements To toCache.length: ' + to_cache.length);
			
			if(to_cache.length !== 0){

				indirajs.cacheElements(to_cache);
			}

			if(obj.caching){

				console.log('doCache(ON) | Running case when Caching is ON for this request');

				cache_result = indirajs.returnFromCache(obj);

			}else{

				console.log('doCache(OFF) | Running case when Caching is OFF for this request');

				$('#' + obj.outputElement).show();
				cache_result = {out_el: obj.outputElement, from_cache: false, element: false};
			}

			console.log('doCache() | Return cache_result');

			if(callback && typeof callback === "function"){

				console.log('doCache() | RUN CALLBACK | With: cache_result');
				callback(cache_result);
			}

			return this;
		},


		fetchDataAttributes: function(element, callback){

			console.log("indirajs.fetchDataAttributes() | RUN");

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

				dataAttributes.caching = (isset(dataAttributes.caching)) ? dataAttributes.caching : indirajs.config.postRequestsCaching
			
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

				console.log("indirajs.fetchDataAttributes() | CHECK URL FOR DOMAIN-ORIGIN POLICY | FOR: " + dataAttributes.url);

				if(dataAttributes.url.match(/(?:(?:(?:\bhttps?|ftp):\/\/)|^)([\-a-z0-9.]+)\//i)){

					var pattern = new RegExp('(^http:\/\/'+ window.location.host.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") + ')');
					if(!pattern.test(dataAttributes.url)){

						console.log("indirajs.fetchDataAttributes() | DOMAIN-ORIGIN POLICY - [FAILED] | RETURN FALSE");
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

			console.log("indirajs.AJAXify() | RUN");

			if(!target){

				var target = $(document);
			}

			console.log("indirajs.AJAXify() | AJAXify target: " + target);
			console.log(target);

			if(indirajs.config.AjaxPreCaching && indirajs.config.AjaxPreCaching !== '*'){

				indirajs.preCaching(target);
			}

			if(indirajs.config.length === 0) {
		
				config = indirajs.init();
				console.log('indirajs.AJAXify() | indirajs.init() | RUN | With Default config');
			}

			if($('[data-scroll-load="true"]').length !== 0){

				$('[data-scroll-load="true"]').each(function(){

					$(window).unbind('scroll.' + $(this).attr('id'));
				});

				$('[data-scroll-load="true"]:visible').each(function(){

					var scroll_el_id = $(this).attr('id');
					var element = $(this);

					console.log('indirajs.AJAXify() | Bind scroll to (element ID): ' + scroll_el_id + ' | ID: ' + element.attr('id'));

					$(window).unbind('scroll.' + scroll_el_id).bind('scroll.' + scroll_el_id, function(event){
					
						var scrollBottom = $(window).scrollTop() + $(window).height();
						var elementBottom = element[0].scrollHeight + element.offset().top;
						
						if(scrollBottom >= elementBottom){

							console.log('indirajs.AJAXify() | Trigger Scroll To Bottom | On Element ID: ' + scroll_el_id + ' | ID: ' + element.attr('id'));

							eval($(element).attr('data-scroll-callback'));
							$(window).unbind('scroll.' + scroll_el_id);
						}
					});

				});
			}

			target.find(indirajs.config.ajaxifySelectors).unbind('click.link').bind('click.link', function(event){

				console.log('!|------------------------------| YOU HAVE CLICKED ON: #' + $(this).attr('id') + ' |------------------------------|!');

				console.log('indirajs.AJAXify() | Empty indirajs.runtime.rulesObject');
				indirajs.runtime.rulesObject = new Object();

				console.log(indirajs.runtime.rulesObject);

				indirajs.fetchDataAttributes($(this), function(dataAttributes){

					if(dataAttributes){

						event.stopPropagation();
						event.preventDefault();

						indirajs.runtime.rulesObject = dataAttributes;

						console.log(indirajs.runtime.rulesObject);

						if(!isset(dataAttributes.url)){

							console.log('NOTHING TO AJAXIFY href OR data-link ATTRIBUTES IS NOT FOUND');
							return false;
						}

						console.log('indirajs.AJAXify() | All attributes is fetched');
						if(!dataAttributes.preventfollow){

							console.log('indirajs.AJAXify() | Proceed to PushState()');

							indirajs.runtime.preventFollow = false;

							console.log('indirajs.AJAXify() | TRIGGER abortPushState == false');
							$(document).trigger("abortPushState", [false]);
							console.log('indirajs.AJAXify() | TRIGGER beforePushState');
							$(document).trigger("beforePushState");
							console.log('indirajs.AJAXify() | indirajs.runtime.abortPushState: ' + indirajs.runtime.abortPushState);

							if(!indirajs.runtime.abortPushState){

								console.log('Prevent follow and abortPushState = ' + indirajs.runtime.abortPushState);

								History.pushState(dataAttributes, dataAttributes.title, dataAttributes.url);
							}

						}else{

							console.log('indirajs.AJAXify() | Proceed without PushState (changing URL)');

							indirajs.runtime.preventFollow = true;
							$(document).trigger("abortPushState", [true]);
							console.log(dataAttributes);

							if(!indirajs.runtime.abortSendAjax){

								console.log('Send AJAX without Push State to History API and abortSendAjax = ' + indirajs.runtime.abortSendAjax);

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

						console.log('YOU FAILED DOMAIN-ORIGIN POLICY');
					}
				});
			});

			return this;
		},


		responseToElement: function(element, response, rulesObject, callback){

			console.log('indirajs.responseToElement() | RUN');

			if(rulesObject.append == 'prepend' || rulesObject.prepend === true){

				console.log('indirajs.responseToElement() | Prepend after AJAX | To element ID: ' + element.attr('id'));

				element.prepend(response);
			
			}else if(rulesObject.append){

				console.log('indirajs.responseToElement() | Append after AJAX | To element ID: ' + element.attr('id'));
				element.append(response);

			}else if(rulesObject.replace){

				console.log('indirajs.responseToElement() | Replace after AJAX | Replaceble element ID: ' + element.attr('id'));

				element.replaceWith(response);
			
			}else{

				if(rulesObject.outputElement !== 'false' && rulesObject.outputElement !== false){
					
					console.log('indirajs.responseToElement() | Out and Overwrite content of element ID: ' + element.attr('id'));

					element.html(response);
				}
			}

			if(callback && typeof callback === "function"){

				callback(element, response, rulesObject);
			}

			return element;
		},


		afterSendAjax: function(rules, response){

			console.log('indirajs.afterSendAjax() | RUN');
			console.log(rules);

			if(rules.remove){

				console.log('indirajs.afterSendAjax() | Remove after AJAX | Element ID to Remove: ' + rules.remove);
				$('#'+rules.remove).remove();
			}

			if(rules.outpopup){

				console.log('indirajs.afterSendAjax() | Popup OUT | var outpopup = ' + rules.outpopup);

				if(rules.outpopup === true){
					
					$.gritter.add({text: response});
				
				}else{

					$.gritter.add({text: rules.outpopup});
				}
			}

			if(rules.callback){

				console.log('indirajs.afterSendAjax() | Run Callback');

				indirajs.runCallback(rules.callback);
			}

			$(document).trigger("afterSendAjax");
		},


		outputIntoCache: function(outputElementContainer, response, rulesObject, callback){

			console.log('indirajs.outputIntoCache() | RUN');

			$.each(outputElementContainer, function(index, value) {

				console.log('indirajs.outputIntoCache() | Create tmp Object of cache[' + value + ']');
				var tmp = $('<div></div>').append(indirajs.cache[value]);

				console.log('indirajs.outputIntoCache() | Look for: #' + rulesObject.outputElement + ' in: ' + tmp);
				outputElementContainer = tmp.find('#' + rulesObject.outputElement);

				console.log('indirajs.outputIntoCache() | tmp.find(#' + rulesObject.outputElement + ') Result: ');
				console.log(tmp.find('#' + rulesObject.outputElement));

				indirajs.responseToElement(outputElementContainer, response, rulesObject, function(outputElementContainer, response, rulesObject){

					console.log('indirajs.outputIntoCache() | indirajs.responseToElement() RETURNED: ' + tmp);
					console.log('indirajs.outputIntoCache() | Saving tmp.html() into indirajs.cache[' + value + ']');

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

			console.log('indirajs.processAJAXsuccess() | RUN');

			console.log(rulesObject);

			console.log('indirajs.processAJAXsuccess() | Success AJAX Request | Output into (Element ID): ' + rulesObject.outputElement + ' | Prepend / Append / Replace: ' + rulesObject.prepend + ' / ' + rulesObject.append + ' / ' + rulesObject.replace);

			if(indirajs.config.cachePlace === 'storage' && indirajs.config.imageCaching === true){

				var tmp = $('<div></div>').append(response);
				response = indirajs.outputCachedImages(tmp);
			}

			if($('#'+rulesObject.outputElement).length === 0){

				console.log('indirajs.processAJAXsuccess() | Out element is not exists in DOM -> Run search in indirajs.cache');
				
				indirajs.searchInCache(rulesObject.outputElement, function(outputElementContainer){

					console.log(outputElementContainer);
				
					if(typeof outputElementContainer == 'string'){
						
						console.log('indirajs.processAJAXsuccess() | Out element is not exists in DOM -> Run search in indirajs.cache -> Returned string | Value: ' + outputElementContainer);
						outputElementContainer = $('#'+outputElementContainer);

						indirajs.afterSendAjax(rulesObject, response);
					
					}else{
		
						indirajs.outputIntoCache(outputElementContainer, response, rulesObject, function(){
							console.log('indirajs.processAJAXsuccess() | Run indirajs.afterSendAjax() | with rules: ');
							console.log(rulesObject);
							indirajs.afterSendAjax(rulesObject, response);
						});
					}

				});

			}else{

				console.log('indirajs.processAJAXsuccess() | Out element is exists in DOM');
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
			console.log('indirajs.sendAJAX() | RUN');

			if(rulesObject.loaderContainerId == false){

				rulesObject.loaderContainerId = rulesObject.outputElement;
			}

			var previousStateLoaderContainer = $('#'+rulesObject.loaderContainerId).html();
			var loaderElement = $(indirajs.config.loader);

			$.ajax(ajaxRequestSettings).done(function(response) {

				indirajs.restoreLoader(rulesObject, previousStateLoaderContainer, loaderElement);

				if(callback){ 

					console.log('indirajs.sendAJAX() | Run: indirajs.runCallback() with: ')
					console.log(callback);
					indirajs.runCallback(callback(response)); 
				}

				console.log('indirajs.sendAJAX() | Run: indirajs.processAJAXsuccess() with: ')
				console.log(rulesObject)
				indirajs.processAJAXsuccess(response, rulesObject);

				return response;

			}).fail(function(jqXHR, textStatus){

				indirajs.restoreLoader(rulesObject, previousStateLoaderContainer, loaderElement);
			});

			if(rulesObject.loaderContainerId){

				console.log('indirajs.sendAJAX() | Show loading element');

				if('#'+rulesObject.loaderContainerId !== rulesObject.outputElement && $('#'+rulesObject.loaderContainerId).attr('id') !== $('#'+rulesObject.outputElement).parent().attr('id')){

					console.log('indirajs.sendAJAX() | Show loading element | Hide all childrens of .. and loading element is prepended to (Element ID): ' + '#'+rulesObject.loaderContainerId);
					$('#'+rulesObject.loaderContainerId).children().hide();
					$('#'+rulesObject.loaderContainerId).prepend(loaderElement);
					
				
				}else{

					console.log('indirajs.sendAJAX() | Show loading element | Loading element is prepended to (Element ID): ' + '#'+rulesObject.loaderContainerId);

					$('#'+rulesObject.loaderContainerId).prepend(loaderElement);
				}
			}

			return this;
		},

		restoreLoader: function(rules, previousStateLoaderContainer, loaderElement){

			if(rules.restoreLoaderContainer){

				console.log('indirajs.sendAJAX() | Restore loading element');

				if('#'+rules.loaderContainerId !== rules.outputElement && $('#'+rules.loaderContainerId).attr('id') !== $('#'+rules.outputElement).parent().attr('id')){

					console.log('indirajs.sendAJAX() | Restore loading element | Replaced with old content');

					$('#'+rules.loaderContainerId).html(previousStateLoaderContainer);
				
				}else{

					console.log('indirajs.sendAJAX() | Restore loading element | Loading element is removed');
					loaderElement.remove();
				}
			}
		},

		searchInCache: function(id, callback){

			console.log('indirajs.searchInCache() | RUN');
			console.log('indirajs.searchInCache() | Search FOR: ' + id);

			var toReturn;
			var result = new Object;

			$.each(indirajs.cache, function(index, value){

				var tmp = $('<div></div>');
				var element = tmp.append(indirajs.cache[index]);

				if($('#' + id, element).exists()){

					console.log('indirajs.searchInCache() | Element is FOUND in indirajs.cache -> returning (object)');

					result[index] = index;
				}
			});

			if(jQuery.isEmptyObject(result)){

				console.log('indirajs.searchInCache() | RETURN STRING');
				console.log(id);

				toReturn = id;

			}else{

				console.log('indirajs.searchInCache() | RETURN CACHE KEYS ARRAY');
				console.log(result);

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

	console.log('Document.Ready() | RUN indirajs.ajaxify()');
	indirajs.ajaxify($(document));

	if(indirajs.config.AjaxPreCaching === '*'){

		console.log('Document.Ready() | RUN indirajs.preCaching()');
		indirajs.preCaching($(document));
	}
});

//HELPERS:
//ISSET CHECK IF OBJECT IS SET
function isset(v){

	console.log('isset HELPER FUNCTION | RUN');
	if(typeof(v) != "undefined" && v !== null){
		return true
	}else{
		return false;
	}
}

//GET CACHE UNIQUE ID
function stripSpecialChars(a){ 

	console.log('RUN stripSpecialChars() function');

	a = encodeURIComponent(a);
	a = a.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	return a;
}

//ENCODE QUERY STRING
function encode_query(q){

	console.log('RUN encode_query() function');

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

	console.log('getExtension() | RUN');

	var a = file.split('.');
	if( a.length == 1 || ( a[0] = "" && a.length == 2 ) ) {

		console.log('getExtension() | RETURN : FALSE');
	    return false;
	}

	//console.log('getExtension() | RETURN : ' + a.pop());
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
	console.log('TRIGGERED abortPushState: ' + rule);
	return;
});

$(document).bind('abortSendAjax', function(e, rule){
	
	indirajs.runtime.abortSendAjax = rule;
	console.log('TRIGGERED abortSendAjax: ' + rule);
	return;
});

$(document).bind('afterSendAjax', function(){

	console.log('TRIGGERED afterSendAjax');

	console.log('afterSendAjax | RUN | indirajs.hideCachedElements()');
	
	indirajs.hideCachedElements();

	console.log('afterSendAjax | RUN | indirajs.ajaxify()');
	indirajs.ajaxify((isset(indirajs.runtime.rulesObject.outputElement)) ? $('#' + indirajs.runtime.rulesObject.outputElement) : $(document));
});

$(document).bind('loadingFormCacheStop', function(e, rule){

	console.log('TRIGGERED loadingFormCacheStop: ' + rule);

	console.log('loadingFormCacheStop | RUN | indirajs.hideCachedElements()');
	
	indirajs.hideCachedElements();

	console.log('loadingFormCacheStop | RUN | indirajs.ajaxify()');
	indirajs.ajaxify((isset(indirajs.runtime.rulesObject.outputElement)) ? $('#' + indirajs.runtime.rulesObject.outputElement) : $(document));
});


/**
* Used for back and forward browser navigation in case of AJAX powered links and site navigation.
* Using State.data array defines previously used function and invokes in again.
*/
History.Adapter.bind(window,'statechange',function(){ 

	console.log('TRIGGER statechange');

	var State = History.getState();
	indirajs.runtime.rulesObject.url = State.url;

	console.log(State.data);

	if(State.data.confirmMessage){
		
		indirajs.confirmPostAJAX(State.data);  

	}else if(State.data.query){

		indirajs.postAJAX(State.data);

	}else{

		indirajs.getAJAX(State.data);
	}
});

jQuery.fn.exists = function(){ return this.length > 0; }