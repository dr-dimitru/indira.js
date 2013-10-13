/**
* Indira.js v1.02 by Dmitriy A. Golev
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

			$(document).trigger("abortPushState", [false]);
			$(document).trigger("beforePushState");

			if(!abortPushState){

				History.pushState({query:q, load_element:load_el, out_element:out_el, msg:message, appnd:append, rstr:restore, enc:encode, popup:popup_out, caching:caching, callback:callback, replace:replace}, title, link);
			}

		}else{

			prevent_follow = true;

			$(document).trigger("abortPushState", [true]);

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

	$(document).trigger("beforeSendAjax");

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

		if($('#' + id, $cached[index]).length !== 0){

			id = $('#' + id, $cached[index]);
			return false;
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