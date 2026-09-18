(function ($) {
    "use strict";

    // Place card click → open modal with slider
    $('.place-card').on('click', function () {
        var title  = $(this).data('place-title');
        var images = ($(this).data('images') || '').toString().split(',').map(function (s) {
            return s.trim();
        }).filter(Boolean);

        // Set title
        $('#placeModalTitle').text(title);

        // Build slides
        var $slider = $('.place-slider');
        var slidesHtml = '';
        images.forEach(function (src, i) {
            slidesHtml += '<div class="slide-item">' +
                            '<a href="' + src + '" class="popup-image" data-index="' + i + '">' +
                              '<img src="' + src + '" alt="' + title + ' image ' + (i + 1) + '">' +
                            '</a>' +
                          '</div>';
        });
        $slider.html(slidesHtml);

        // Init slick AFTER modal is shown
        $('#placeModal').one('shown.bs.modal', function () {
            if ($slider.hasClass('slick-initialized')) {
                $slider.slick('unslick');
            }
            $slider.slick({
                dots: true,
                arrows: true,
                infinite: true,
                speed: 500,
                slidesToShow: 1,
                slidesToScroll: 1,
                adaptiveHeight: false,
                prevArrow: '<button type="button" class="slick-prev"><i class="fas fa-chevron-left"></i></button>',
                nextArrow: '<button type="button" class="slick-next"><i class="fas fa-chevron-right"></i></button>'
            });

            // Init Magnific Popup gallery for zoom
            $slider.find('.popup-image').magnificPopup({
                type: 'image',
                gallery: {
                    enabled: true,
                    navigateByImgClick: true,
                    preload: [0, 1]
                },
                mainClass: 'mfp-img-mobile'
            });
        });
    });

    // Cleanup when modal closes
    $('#placeModal').on('hidden.bs.modal', function () {
        var $slider = $('.place-slider');
        if ($slider.hasClass('slick-initialized')) {
            $slider.slick('unslick');
        }
        $slider.empty();
    });

})(jQuery);