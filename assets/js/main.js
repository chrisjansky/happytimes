$(function() {
	
	$("a[href*='#']").click(function () {
		$("html, body").animate(
			{
				scrollTop: $($(this).attr("href")).offset().top
			}, "slow"
		);
		return false;
	});

	$("body").find("a[href*='http']").attr("target","_blank");

	$(".superbox").SuperBox();
});