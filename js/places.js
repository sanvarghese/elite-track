// File: js/places.js
(function ($) {
    "use strict";

    var $modal = $("#placeModal");
    var $slider = $(".place-slider");

    /* ---------------------------------------------------------
       Click on a place card -> build slides for the modal
       (plain <img>, no link, so nothing else can open)
       --------------------------------------------------------- */
    $(".place-card").on("click", function () {
        var title = $(this).data("place-title") || "Place";
        var images = ($(this).data("images") || "")
            .toString()
            .split(",")
            .map(function (s) {
                return s.trim();
            })
            .filter(Boolean);

        $("#placeModalTitle").text(title);

        var slidesHtml = images
            .map(function (src, i) {
                return (
                    '<div class="slide-item">' +
                    '<img src="' + src + '" alt="' + title + " image " + (i + 1) + '">' +
                    "</div>"
                );
            })
            .join("");

        destroySlider();
        $slider.html(slidesHtml);
    });

    /* ---------------------------------------------------------
       Init Slick AFTER the modal is fully shown
       --------------------------------------------------------- */
    $modal.on("shown.bs.modal", function () {
        if (!$slider.children().length) return;

        destroySlider();

        $slider.slick({
            dots: true,
            arrows: true,
            infinite: true,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            adaptiveHeight: false,
            prevArrow:
                '<button type="button" class="slick-prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>',
            nextArrow:
                '<button type="button" class="slick-next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>',
        });
    });

    /* ---------------------------------------------------------
       Clean up when the modal closes
       --------------------------------------------------------- */
    $modal.on("hidden.bs.modal", function () {
        destroySlider();
        $slider.empty();
    });

    function destroySlider() {
        if ($slider.hasClass("slick-initialized")) {
            try {
                $slider.slick("unslick");
            } catch (e) {}
        }
    }
})(jQuery);