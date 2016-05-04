//jQuery to fix the position of the sidebar while scrolling.
$(window).scroll(function() {
    if ($(window).scrollTop() > $(".row").offset().top - $(".navbar-fixed-top").height() - 26) {
        $("#sidenav").css("position", "fixed");
        $("#sidenav").css("top", $(".navbar-fixed-top").height() + 26)
    } else {
        $("#sidenav").css("position", "static");
    }
});

//jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top - 60
        }, 1000, 'easeInOutExpo');
        event.preventDefault();
    });
});