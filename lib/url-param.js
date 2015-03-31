var urlParam = (function(exports){
	var url = window.location;
	var params = {};

	// init
	(function(){
		var tmp = url.search.substr(1).split('&');
		while(tmp.length > 0){
			var param	 = tmp.pop().split('=');
			var value 	 = param.pop();
			var key		 = param.pop();

			params[key]	 = value;
		}
	})();

	function get(){
		var args = arguments;

		if(typeof args[0] == 'undefined'){
			return params;
		}else
		if(typeof args[0] == 'string'){
			return params[args[0]];
		}

		return null;
	}

	// 얻는다 무엇을? 그것을!
	exports.get = get;

	return exports;
})({});
