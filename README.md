#indira.js
-----
####AJAXify your application
#####History API | AJAX | AJAXify | JS Caching | AJAX fileupload | Based on data-attributes

### Installation:
<script src="http://code.jquery.com/jquery-latest.min.js"
type="text/javascript"></script>

```
<script type="text/javascript">
	var indiraJsConfig = {
		loader: 'Loading...',
		defaultLoaderContainer: 'logo',
		defaultOutputElementId: 'wrap',
		defaultPostCaching: false,
	};
</script>
<script src="http://youydomain.com/scripts/indira.min.js"
type="text/javascript"></script>
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
    </ul>
  </nav>
  <div id="wrap">
    <a id="go_to_posts" href="/posts">Posts</a>
  </div>
</body>
</html>
```

###Advanced usage:
#####Sending POST

```
<input type="text" id="my_demo_input" />
<a 	data-ajaxify="true" 
	href="http://a.com/some_page.html"
	data-out="quick_view_box"
	data-prevent-follow="true"
	data-load="quick_view_box"
	data-post="{"value": encodeURI($('#my_demo_input').val()) }"
	data-caching="true"
>Some Page</a>
<div id="quick_view_box">
	AJAX request response will be placed here
</div>
```
