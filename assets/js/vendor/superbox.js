/*
	SuperBox v1.0.0
	by Todd Motto: http://www.toddmotto.com
	Latest version: https://github.com/toddmotto/superbox
	
	Copyright 2013 Todd Motto
	Licensed under the MIT license
	http://www.opensource.org/licenses/mit-license.php

	SuperBox, the lightbox reimagined. Fully responsive HTML5 image galleries.
*/
;(function($) {		
	$.fn.SuperBox = function(options) {
		
		var superbox      = $('<div class="superbox-show"></div>');
		var superboximg   = $('<img src="" class="superbox-current-img">');
		var superalt   = $('<p class="superbox-caption"></p>');
		var superboxcont = $('<div class="superbox-content"></div>');
		var superboxclose = $('<div class="superbox-close">&times;</div>');
		
		superbox.append(superboximg).append(superboxcont).append(superboxclose);
		// superbox.append(superboximg).append(superboxclose).append(superalt);
		
		return this.each(function() {
			
			$('.imageLink').click(function(e) {
				e.preventDefault();
		
				var currentimg = $(this).find('img');
				var imgData = $(this).attr('href');
				superboxcont.html($(this).siblings('.cont').html());
//				alert(superboxcont);
				superboximg.attr('src', imgData);
				if (!currentimg.attr('alt') == '') {
					superalt.text(currentimg.attr('alt'));
					superalt.removeClass('empty');
				} else {
					superalt.addClass('empty');
				}
				
				if($('.superbox-current-img').css('opacity') == 0) {
					$('.superbox-current-img').animate({opacity: 1});
				}
				
				if ($(this).next().hasClass('superbox-show')) {
					superbox.toggle();
				} else {
					superbox.insertAfter($(this).parent()).css('display', 'block');
				}
				
				setTimeout(function() {
					$('html, body').stop(true, true).animate({
						scrollTop:superbox.position().top - (currentimg.width()/1.1)
					}, 'medium');
				}, 100);
			});
						
			$('.superbox').on('click', '.superbox-close', function() {
				$('.superbox-current-img').animate({opacity: 0}, 200, function() {
					$('.superbox-show').slideUp();
				});
			});
			
		});
	};
})(jQuery);