var results = (function(){

	var go = function() {
		$('.track-list').tooltip({animation: false, selector: '.js-tooltip' });

		$('.twitter-popup').click(function(event) {
			var width  = 550,
				height = 400,
				left   = ($(window).width()  - width)  / 2,
				top    = ($(window).height() - height) / 2,
				url    = this.href,
				opts   = 'status=1' +
						 ',width='  + width  +
						 ',height=' + height +
						 ',top='    + top    +
						 ',left='   + left;

			window.open(url, 'twitter', opts);

			return false;
		});

		$('.facebook-popup').click(function(){
			window.open(
				'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href),
				'fb-share-dialog',
				'width=626,height=436');

			return false;
		});

		// Playing previews

		var previewPlaying = null;
		var lastPreviewPlayed = null;

		$('.track-list').on('click', '.js-play-preview', function(e){
			e.preventDefault();

			if(!$(this).is(previewPlaying)) {
				if(lastPreviewPlayed != null && !$(this).is(lastPreviewPlayed)) {
					stopPreview(lastPreviewPlayed);
					lastPreviewPlayed.find('audio')[0].currentTime = 0;
				}
				playPreview($(this));
				previewPlaying = lastPreviewPlayed = $(this);
			} else {
				stopPreview($(this));
				previewPlaying = null;
			}
		});

		$('.track-list').on('ended', '.js-play-preview', function() {
			stopPreview($(this));
		});

		var playPreview = function(tag) {

			var trackId = tag.closest('.track-list > li').data('track-id');
			ga('send','event', 'Track', 'Play', trackId);

			tag.find('.icon-play-circled')
			   .toggleClass('icon-play-circled icon-pause-circled');
			tag.find('audio')[0].play();
		};

		var stopPreview = function(tag) {
			tag.find('.icon-pause-circled')
			   .toggleClass('icon-play-circled icon-pause-circled');
			tag.find('audio')[0].pause();
		};

		// Deleting tracks

		$('.track-list').on('click', '.js-delete-track', function(e) {
			e.preventDefault();
			var $this = $(this);
			var track = $this.closest('.track-list > li');

			ga('send', 'event', 'Track', 'Delete from Likes', track.data('track-id'));

			burst.submitVote(false, track.data('track-id')).done(function() {
				track.hide('slow', function(){
					track.remove();
				});
			});
		});

		// Binds click handler to like and unlike tracks

		var makeLikeHandler = function(selector, vote){
			$('.track-list').on('click', selector, function(e){
				e.preventDefault();

				var $this = $(this);
				var track = $this.closest('.track-list > li');

				var result = (vote ? "Like" : "Unlike");
				var newAction = (vote ? "Unlike" : "Like");

				ga('send',
				 	 'event',
				 	 'Track', result, track.data('track-id'));

				burst.submitVote(vote, track.data('track-id')).done(function() {
					$this.toggleClass('is-liked', vote);

					$this.attr('title', result+"d!").tooltip('destroy').tooltip('show');

					$this.on('mouseleave', function(){
						$(this).attr('title', newAction+" track").tooltip('destroy').tooltip();
					});
				});
			});
		};

		makeLikeHandler('.js-like-track:not(.is-liked)', true);
		makeLikeHandler('.js-like-track.is-liked', false);

		// Infinite scrolling

		var page = 1;
		var loading = false;

		$(window).scroll(function() {
			if(loading) {
				return;
			}

			if(nearBottomOfPage()) {
				loading = true;
				++page;

				$.ajax({
					url: window.location.pathname+'?page='+page,
					type: 'GET',
					dataType: 'html',
				}).done(function(nextPage) {
					$('.track-list').append(nextPage);
					loading = false;
				});
			}
		});
	};

	var nearBottomOfPage = function() {
		var currentLocation = $(window).scrollTop();
		var loadThreshold = $(document).height() - $(window).height() - 200;
		return currentLocation > loadThreshold;
	};

	return {
		'nearBottomOfPage': nearBottomOfPage,
		'go'              : go
	};
})();
