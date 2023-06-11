var body,
	bodyEnd,
	bodyHeight,
	bodyStart,
	hideScrollTools,
	lastReportedReadingTime,
	lastReportedScrollPosition,
	lastScrollPosition,
	pageHeight,
	percentageProgress,
	podcastUrl,
	screenHeight,
	timeStarted,
	title,
	wordcount,
	wordsPerPixel;

var storyCompleted = false;

const thresholdWords = 100;
const minWordsperSecond = 0.5;
const maxWordsPerSecond = 4;

const getScrollPosition = () => window.pageYOffset || document.documentElement.scrollTop;

const scrolling = () => {
  // if (!document.body.classList.contains('story')) {
  //   return;
  // }
  const newScrollPosition = getScrollPosition();
  if (newScrollPosition < 120 || newScrollPosition < lastScrollPosition) {
    document.body.classList.add('show-nav');
  } else {
    document.querySelector('#menu-toggle').checked = false;
    document.body.classList.remove('show-nav');
  }
  if (newScrollPosition !== lastScrollPosition) {
    document.body.classList.add('scrolling');
    clearTimeout(hideScrollTools);
    hideScrollTools = setTimeout(() => {
      document.body.classList.remove('scrolling')
    }, 5000);
		percentageProgress = parseInt(((newScrollPosition - bodyStart) * 100) / bodyHeight);
		if (percentageProgress >= 0) {
			if (percentageProgress > 100) {
				percentageProgress = 100;
			}
			document.querySelector('#progress').innerHTML = `${ percentageProgress }%`;
		}
		lastScrollPosition = newScrollPosition;
  }
  return;
}

const initialiseAfterNewsletter = () => {
	return;
}

const initialiseFontSizeListeners = () => {
	document.getElementById("font-size-1").addEventListener('click', () => addRemoveFontSizeClass(1));
	document.getElementById("font-size-2").addEventListener('click', () => addRemoveFontSizeClass(2));
	document.getElementById("font-size-3").addEventListener('click', () => addRemoveFontSizeClass(3));
	document.getElementById("font-size-4").addEventListener('click', () => addRemoveFontSizeClass(4));
};

const initialiseReadingHeartbeat = () => {
	lastReportedReadingTime = new Date() / 1000;
	timeStarted = lastReportedReadingTime;
	setInterval(heartbeat, 3000, wordsPerPixel, screenHeight, bodyStart, bodyEnd, title);
}

const heartbeat = (wordsPerPixel, screenHeight, bodyStart, bodyEnd, title) => {
	const timeNow = new Date() / 1000;
	const secondsElapsed = timeNow - lastReportedReadingTime;
	const newScrollPosition = getScrollPosition();

	if (newScrollPosition > lastReportedScrollPosition) {
		const pixelProgress = newScrollPosition - lastReportedScrollPosition;
		const wordsRead = wordsPerPixel * pixelProgress;
		const wordsPerSecond = wordsRead / secondsElapsed;

		// Is it a plausible speed?
		if (wordsRead > thresholdWords && wordsPerSecond > minWordsperSecond && wordsPerSecond < maxWordsPerSecond) {
			window._paq.push(['trackEvent', 'Qari', 'kliem', title, parseInt(wordsRead)]);
			window._paq.push(['trackEvent', 'Qari', 'minuti', title, (secondsElapsed / 60).toFixed(2)]);
			window._paq.push(['trackEvent', 'Qari', 'perċentwali', title, parseInt(percentageProgress)]);
			window._paq.push(['trackEvent', 'Qari', 'ħeffa', title, wordsPerSecond.toFixed(2)]);

			// save bookmark
			lastReportedScrollPosition = newScrollPosition;
			lastReportedReadingTime = timeNow;
			return;
		}
		// Shall we reset?
		return;
	}
}

const initialiseAfterNav = () => {
	initialiseFontSizeListeners();
}

const initialiseAfterWindow = () => {
	initialiseAfterNav();
	if (!!wordcount) {
		screenHeight = window.innerHeight;
		body = document.getElementById('body-text');
		bodyHeight = body.offsetHeight - screenHeight;
		bodyStart = body.offsetTop;
		title = document.querySelector("h1").innerText;
		bodyEnd = bodyStart + bodyHeight;
		wordsPerPixel = wordcount / bodyHeight;
		window.addEventListener('scroll', (event) => {
			scrolling();
		});
		lastScrollPosition = getScrollPosition();
		lastReportedScrollPosition = lastScrollPosition;
		pageHeight = document.body.scrollHeight;
		initialiseReadingHeartbeat(wordcount);

		Splide.defaults = {
			type: 'fade',
			rewind: true,
			speed: 2000,
			padding: '2rem 0',
		}
		var slideshows = document.getElementsByClassName('splide');
		for ( var i = 0; i < slideshows.length; i++ ) {
			const newSplide = new Splide(slideshows[i]).mount();
			newSplide.on('visible', function (slide) {
				window._paq.push(['trackEvent', 'Stampi', 'slideshow', title, slide.index + 1]);
			});
		}
		const lightbox = document.getElementById('lightbox');
		const openLightbox = () => {
			lightbox.classList.add('open');
		}
		const closeLightbox = () => {
			lightbox.classList.remove('open');
		}
		const lightboxOpen = document.getElementById('lightbox-open');
		const lightboxClose = document.getElementById('lightbox-close');
		lightboxOpen && lightboxOpen.addEventListener('click', () => openLightbox());
		lightboxClose && lightboxClose.addEventListener('click', () => closeLightbox());
		if (lightboxClose) {
			document.onkeydown = function(evt) {
				evt = evt || window.event;
				if (evt.keyCode === 27) {
					closeLightbox();
				}
			};
		}
		if (podcastUrl) {
			Amplitude.init({
				songs: [
					{
						url: podcastUrl
					}
				]
			});
			const audio = Amplitude.getAudio();
			audio.addEventListener('timeupdate', () => console.log(audio.currentTime) );

			document.getElementById('range').addEventListener('click', function(e){
					var offset = this.getBoundingClientRect();
					var x = e.pageX - offset.left;
					Amplitude.setSongPlayedPercentage((parseFloat(x) / parseFloat( this.offsetWidth) ) * 100);
			});
		}

		document.getElementById('audio').classList.add('initialised');













		// var currentTime, previousTime, skippedTime;
		// Calamansi.autoload();

		// var player = new Calamansi(document.querySelector('#player'), {
		// 	skin: '/calamansi/skins/basic'
		// });
		// player.audio.load('https://sphinx.acast.com/p/open/s/63ef6b4c3642ca00119bcf72/e/644c12d50ace130011a72f8d/media.mp3');
		// CalamansiEvents.on('initialized', function (player) {
		// 	console.log('INIT');
		// });

		// trackEnded, pause, play, stop
		// const player = ....;
		// CalamansiEvents.on('timeupdate', function (player) {
		// 	console.log('duration:', player.audio.duration);
		// 	currentTime = parseInt(player.audio.currentTime);
		// 	skippedTime = currentTime - previousTime;
		// 	console.log(currentTime, previousTime, skippedTime);
		// 	if (skippedTime > 1) {
		// 		console.log('skipped:', skippedTime);
		// 		// resetTime?
		// 	}
		// 	// skipped while stopped?
		// 	previousTime = currentTime;

		// 	if (parseInt(currentTime / 30) === currentTime);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'kliem', title, parseInt(wordsRead)]);
		// 	window._paq.push(['trackEvent', 'Smiegħ', 'minuti', title, 0.5]);
		// 	window._paq.push(['trackEvent', 'Smiegħ', 'perċentwali', title, ((currentTime * 100) / player.audio.duration).toFixed(2)]);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'kliem (maqbużin)', title, parseInt(wordsRead)]);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'play', title]);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'pause', title]);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'stop', title]);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'end', title]);
		// 	// window._paq.push(['trackEvent', 'Smiegħ', 'ħeffa', title, wordsPerSecond.toFixed(2)]);
		// });
	};
}

window.onload = initialiseAfterWindow;
