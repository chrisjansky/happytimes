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
    
    var superbox = $('<div class="superbox-show"></div>');
    var superboxclose = $('<div class="superbox-close">&times;</div>');
    var superboximg = $('<div class="superbox-img"></div>');
    var superboxcont = $('<div class="superbox-content"></div>');

    superbox.append(superboximg).append(superboxcont);
    
    return this.each(function() {
      
      $("[data-superbox]").click(function(event) {
        event.preventDefault();
    
        var
          $this = $(this),
          $content = $this.siblings("[data-content]"),
          $images = $content.find("[data-images]"),
          $text = $content.find("[data-text]");

        if ($images.length > 0) {
          superboximg
            .css("opacity", 0)
            .html($images[0].outerHTML);

          superbox.imagesLoaded(function() {
            var $imgArray = $images.find("img");
            superboximg.find("[data-images]").bxSlider({
              "adaptiveHeight": true,
              buildPager: function(slideIndex) {
                return $imgArray[slideIndex].outerHTML;
              },
              onSliderLoad: function() {
                superboximg.css("opacity", 1);
              }
            });
          });
        } else {
          superboximg.empty();
        }

        superboxcont
          .html(superboxclose)
          .append($text[0].outerHTML);

          if ($this.next().hasClass("superbox-show")) {
            superbox.toggle();
          } else {
            superbox.insertAfter($this.parent()).css("display", "block");
          }

          $("html, body").stop(true, true).animate({
            scrollTop: superbox.position().top
          }, durBasic);
        });

      $(".superbox").on("click", ".superbox-close", function() {
        $(".superbox-show").slideUp(durShort);
      });

    });
  };
})(jQuery);
