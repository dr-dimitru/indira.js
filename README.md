#indira.js
-----


[Official webpage & Examples](http://indirajs.indira-cms.com/)
[Last stable version](https://github.com/dr-dimitru/indira.js/tree/master)
[Dev version](https://github.com/dr-dimitru/indira.js/tree/dev)


-----
####AJAXify your application
#####Offline js-application | History API | AJAX | AJAXify | JS Caching | AJAX fileupload | Based on data-attributes

### Installation:

```
<script src="http://code.jquery.com/jquery-latest.min.js"
type="text/javascript"></script>
<script src="http://youydomain.com/scripts/vendor/jquery.history.js"
type="text/javascript"></script>
<script src="http://youydomain.com/scripts/indira.min.js"
type="text/javascript"></script>

<script type="text/javascript">
	indirajs.init({
		loader: 'Load...', //(STRING|HTMLelement(s))
		defaultLoaderContainerId: 'logo', //BOOL|STRING | ID OF DEFAULT LOADER CONTAINER ELEMENT | WITHOUT PREPEND'#'
		defaultOutputElementId: 'wrap', //STRING | ID OF DEFAULT OUTPUT ELEMENT | WITHOUT PREPEND'#'
		postRequestsCaching: false, //BOOL | CACHE ALL AJAXIFYED LINKS WITH POST-METHOD
		getRequestsCaching: true, //BOOL | CACHE ALL AJAXIFYED LINKS WITH GET-METHOD
		AjaxPreCaching: false, //(BOOL|ARRAY|*|STRING) | preCACHE ALL AJAXIFYED LINKS | ARRAY & STRING - FULL PATH WITH HTTP://
		imageCaching: false, //BOOL | EXPERIMENTAL CACHE IMAGES INTO BASE64
		ajaxifySelectors: 'a[id^="go_to_"], [id^="ajax_"], button[class^="ajax_"], [data-ajaxify="true"]', //STRING | JQUERY SELECTOR
		cacheToLocalStorage: true, //ALLOW TO CACHE INTO LOCALSTORAGE IF AVAILABLE
		cacheExpiration: 604800000, //INT | DEFAULT: 7 DAYS | TIME BETWEEN VISITING SAME CACHED LINK WITHOUT UPDATE
	});
</script>
```

###Basic usage:

```
<html>
<head>
...
</head>
<body>
  <nav class="navbar">
    <ul>
      <li id="logo">Some Logo</li>
      <li>
      	<a id="go_to_posts" href="/posts">Posts</a>
      </li>
    </ul>
  </nav>
  <div id="wrap">
    <a id="go_to_posts" href="/posts">Posts</a>
  </div>
</body>
</html>
```

###Advanced usage:
#####Sending request via POST-method

```
<input type="text" id="my_demo_input" />
<a 	data-ajaxify="true" 
	href="http://a.com/some_page.html"
	data-out="quick_view_box"
	data-prevent-follow="true"
	data-load="quick_view_box"
	data-post='{"value": encodeURI($('#my_demo_input').val()) }'
	data-caching="true"
>Some Page</a>
<div id="quick_view_box">
	AJAX request response will be placed here
</div>
```
