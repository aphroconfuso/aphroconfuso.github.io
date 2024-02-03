const audioBookmarkingInterval = 10;
const audioReportingInterval = 30;
const bookmarkThresholdWords = 250;
const maxWordsPerSecond = 5;
const minWordsPerSecond = 1;
const thresholdWords = 100;

const fixReportingTitle = (storyType, sequenceEpisodeNumber, author, pageTitle) => {
	if (storyType === 'Djarju') return `Djarju #${ sequenceEpisodeNumber } ${ author }`;
	if (!!sequenceEpisodeNumber) return `${ pageTitle } #${ sequenceEpisodeNumber }`;
	return pageTitle;
}

const getScrollPosition = () => window.pageYOffset || document.documentElement.scrollTop;

const scrolling = () => {
  newScrollPosition = getScrollPosition();
  if (newScrollPosition < 120 || newScrollPosition < lastScrollPosition) {
    document.body.classList.add('show-nav');
  } else {
    document.querySelector('#menu-toggle').checked = false;
    document.body.classList.remove('show-nav');
	}
	if (!wordcount) return;
  if (newScrollPosition !== lastScrollPosition) {
    document.body.classList.add('scrolling');
    clearTimeout(hideScrollTools);
    hideScrollTools = setTimeout(() => {
      document.body.classList.remove('scrolling')
    }, 5000);
		percentageProgress = (((newScrollPosition - bodyStart) * 100) / bodyHeight).toFixed(2);
		if (percentageProgress >= 0) {
			if (percentageProgress > 100) {
				percentageProgress = 100;
			}
			progressElement.textContent = percentageProgress > 0 && percentageProgress < 100 ? `${ Math.round(percentageProgress) }%`: '';
		}
		lastScrollPosition = newScrollPosition;
  }
  return;
}

const addBookmarkNow = () => {
	if (!percentageProgress || (wordcount * (percentageProgress / 100)) < bookmarkThresholdWords || percentageProgress > 98) {
		return;
	}
	addBookmark('text', {
		author,
		monthYear,
		percentage: percentageProgress,
		placeText: getCurrentBlurb(percentageProgress),
		sequenceEpisodeNumber,
		sequenceEpisodeTitle,
		speed: wordsPerSecond && wordsPerSecond.toFixed(2),
		storyId,
		storyType,
		title: pageTitle,
		translator,
		urlSlug,
		wordcount,
		wordsPerSecond: wordsPerSecond && wordsPerSecond.toFixed(2),
	});
}

const heartbeat = (wordsPerPixel, reportingTitle) => {
	const timeNow = new Date() / 1000;
	const secondsElapsed = timeNow - lastReportedReadingTime;
	const newScrollPosition = getScrollPosition();

	if (newScrollPosition > lastReportedScrollPosition) {
		const pixelProgress = newScrollPosition - lastReportedScrollPosition;
		const wordsRead = wordsPerPixel * pixelProgress;
		const wordsPerSecond = wordsRead / secondsElapsed;

		// Is it a plausible speed?
		if (wordsRead > thresholdWords && wordsPerSecond > minWordsPerSecond && wordsPerSecond < maxWordsPerSecond) {
			window._paq.push(['trackEvent', 'Qari', 'kliem', reportingTitle, parseInt(wordsRead)]);
			window._paq.push(['trackEvent', 'Qari', 'minuti', reportingTitle, (secondsElapsed / 60).toFixed(2)]);
			window._paq.push(['trackEvent', 'Qari', 'perċentwali', reportingTitle, parseInt(Math.round(percentageProgress))]);
			window._paq.push(['trackEvent', 'Qari', 'ħeffa', reportingTitle, wordsPerSecond.toFixed(2)]);

			// save bookmark
			addBookmarkNow();

			lastReportedScrollPosition = newScrollPosition;
			lastReportedReadingTime = timeNow;
			return;
		}
		// Shall we reset?
		return;
	}
}

// BOOKMARKS *************************************************************************************

const saveBookmarksList = () => localStorage.setItem("bookmarks", JSON.stringify(bookmarksList));

const initialiseBookmarksList = () => {
	bookmarksList = JSON.parse(localStorage.getItem("bookmarks") || "{}");
	const bookmarkKeysArray = Object.keys(bookmarksList);
	bookmarkKeysArray.forEach((key) => {
		if (key.startsWith('text-')) {
			const item = bookmarksList[key];
			item.key = key;
			item.urlSlug = item.urlSlug || key.split('text-')[1];
			const { monthYear, percentage, title, urlSlug, wordcount } = item;
			const valid = percentage && title && urlSlug && monthYear && percentage < 98 && (wordcount * (percentage / 100) > bookmarkThresholdWords);
			if (!valid) {
				delete bookmarksList[key];
				return;
			};
			bookmarksArray.push(item);
		}
	});
	saveBookmarksList();
}

const addBookmark = (type = 'text', bookmark) => {
	bookmarksList[`${ type }-${urlSlug}`] = {
		dateTime: new Date(),
		type,
		...bookmark
	};
	saveBookmarksList();
	if (type === 'audio') return;
	updateBookmarksMenu(bookmarksArray);
	window._paq.push(['trackEvent', 'Bookmarks', 'żid', bookmark.title, bookmark.percentage]);
}

const deleteBookmark = (type = 'text', slug = urlSlug, id = storyId) => {
	delete bookmarksList[`${ type }-${ slug }`];
	saveBookmarksList();
	if (type === 'audio') return;
	const bookmark = bookmarksArray.find(i => i.urlSlug);
	bookmarksArray = bookmarksArray.filter(i => i.urlSlug !== slug);
	updateBookmarksMenu(bookmarksArray);
	const removeBookmark = document.getElementById(`bookmark-${ id }`);
	removeBookmark.style.opacity = '0';
	setTimeout(() => removeBookmark.remove(), 1000);
	window._paq.push(['trackEvent', 'Bookmarks', 'armi', bookmark.title, bookmark.percentage]);
}

// FIXME: recalibrate
const getCurrentBlurb = (percent) => {
	const currentPlace = Math.round(percent * bodyText.length / 100);
	const blurb = bodyText.substring(currentPlace, currentPlace + (charactersPerScreen));
	return blurb;
}

const updateBookmarksMenu = (bookmarksArray) => {
	if (!(bookmarksArray && bookmarksMenuElement)) return;
	if (bookmarksArray.length === 0) {
		bookmarksMenuElement.textContent = '';
		return;
	};
	bookmarksMenuElement.textContent = ` ${ bookmarksArray.length }`;
}

const calculateScrollPosition = (percentage) => Math.round(bodyStart + bodyHeight * (percentage/100));

const showBookmarksInPromos = (bookmarksArray) => {
	bookmarksArray.forEach((bookmark) => {
		const { percentage, storyId, title, urlSlug } = bookmark;
		const roundedPercentage = Math.round(percentage);
		document.querySelectorAll(`a.story-${ storyId }`).forEach((element) => {
			const bookmarkLink = document.createElement("a");
			bookmarkLink.innerHTML = `<span>${roundedPercentage}%</span>`;
			bookmarkLink.classList.add("bookmark");
			bookmarkLink.href = `/${ urlSlug }/#b-${ percentage }`;
			bookmarkLink.addEventListener("click", () => {_paq.push(['trackEvent', 'Promo', `minn: ${ reportingTitle } (bookmark)`, `għal: ${ title } (${ roundedPercentage }%)`, roundedPercentage])});
			element.appendChild(bookmarkLink);
		});
		document.querySelectorAll(`article.story-${ storyId } > header`).forEach((element) => {
			const bookmarkLink = document.createElement("a");
			bookmarkLink.innerHTML = `<span>${roundedPercentage}%</span>`;
			bookmarkLink.classList.add("bookmark");
			bookmarkLink.href = `/${ urlSlug }/#b-${ percentage }`;
			bookmarkLink.addEventListener('click', () => {
				_paq.push(['trackEvent', 'Bookmark (scroll)', reportingTitle, `${ roundedPercentage }%`, roundedPercentage]);
				window.scrollTo({top: calculateScrollPosition(percentage), left: 0, behavior: 'smooth'});
			})
			element.appendChild(bookmarkLink);
		});
	});
}

// bundle from shared component
const numberify = (number, words = ['kelma', 'kelmiet']) => {
	// kelma, kelmiet
	if (!number) return "null";
	const digits = parseInt(number.toString().slice(-2));
	if (digits >= 2 && digits <= 10) return `${ number } ${ words[1] }`;
	if (digits >= 11 && digits <= 20) return `${ number }-il ${ words[0]}`;
	return `${ number } ${ words[0] }`;
};

// bundle from shared, testable component
function prettifyNumbers(text, punctuation = String.fromCharCode(8201)) {
	if(!text) return null;
	return text.toString().replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, `$&${ punctuation }`);
};

const showFullBookmarkList = () => {
	const list = document.getElementById("bookmark-list");
	const bookmarksContainer = document.getElementById("bookmarks-container");
	const browserTemplating = ("content" in document.createElement("template"));
	const template = document.getElementById("bookmark-item");

	updateBookmarksMenu(bookmarksArray);
	showBookmarksInPromos(bookmarksArray);

	if (!list) return;

	if (bookmarksArray.length === 1) {
		bookmarksContainer && bookmarksContainer.classList.add("bookmarks-one");
	} else if (bookmarksArray.length) {
		bookmarksContainer && bookmarksContainer.classList.add("bookmarks-multiple");
		const bookmarksCount = bookmarksArray.length
		let numberPhrase = bookmarksCount + ' bookmarks';
		if (bookmarksCount >= 11) numberPhrase = bookmarksCount + '-il bookmark';
		if (bookmarksCount >= 20) numberPhrase = bookmarksCount + ' bookmarks';
		document.getElementById("bookmarks-number-inline").textContent = numberPhrase;
	} else {
		bookmarksContainer && bookmarksContainer.classList.add("bookmarks-none");
	}

	if (list && browserTemplating && template) {
		bookmarksArray.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).forEach((bookmark, index) => {
			var { author, monthYear, percentage, placeText, storyId, storyType, reportingTitle, sequenceEpisodeNumber, sequenceEpisodeTitle, title, urlSlug, wordcount } = bookmark;
			const clone = template.content.cloneNode(true);
			// THIS SHOULD BECOME OBSOLETE (IMPLEMENTED 17.01.2024)
			if (!reportingTitle) {
				reportingTitle = fixReportingTitle(storyType, sequenceEpisodeNumber, author, title);
			}
			if (title.startsWith('Djarju: ')) {
				({title, sequenceEpisodeTitle} = title.split(': '));
				storyType = 'djarju';
			} else if (!!sequenceEpisodeNumber) {
				title = title + ` <span class="episodeNumber">#${ sequenceEpisodeNumber }</span>`;
			}
			var remaining = parseInt(wordcount * ((100 - percentage) / 100));
			var readersWordsPerSecond = 2.9;
			const minutes = numberify(parseInt(remaining / (readersWordsPerSecond * 60)), ['minuta', 'minuti']);
			remaining = numberify(prettifyNumbers(remaining));
			// wordcount = numberify(prettifyNumbers(wordcount));
			clone.querySelector("li").id = `bookmark-${ storyId }`;
			clone.querySelector("a").href = `/${ urlSlug }/#b-${ percentage }`;
			clone.querySelector("a").classList.add(`promo-${ monthYear }`, monthYear, `story-${ storyId }`, storyType);
			clone.querySelector("a").id = `link-${ storyId }`;
			clone.querySelector(".bookmark span").textContent = `${Math.round(percentage)}%`;
			clone.querySelector("h1").innerHTML = title;
			clone.querySelector("h2").textContent = author;
			if (sequenceEpisodeTitle) clone.querySelector("h3").textContent = sequenceEpisodeTitle;
			clone.querySelector("p.header-label").textContent = monthYear && monthYear.replace(/-/, ' ').replace(/gunju/, 'ġunju').replace(/dicembru/, 'diċembru');
			clone.querySelector("button").id = `delete-${ storyId }`;
			clone.querySelector(".body-text p").textContent = placeText.replace(/.*?\w\b\s+/, "… ");
			clone.querySelector("aside p").textContent = `Fadallek ${ remaining }, madwar ${ minutes } qari`;
			list.appendChild(clone);
			document.getElementById(`delete-${ storyId }`).addEventListener("click", (event) => { deleteBookmark('text', urlSlug, storyId); event.stopPropagation(); });
			document.getElementById(`link-${ storyId }`).addEventListener("click", () => _paq.push(['trackEvent', 'Promo', 'minn: Bookmarks', `għal: ${ reportingTitle }`, index]));
		});
	}
}

const clearAllBookmarks = () => localStorage.clear();

const getPreviousAudioTime = () => {
	return bookmarksList[`audio-${urlSlug}`] && bookmarksList[`audio-${urlSlug}`].playPosition || 0;
}

// INITIALISE ***********************************************************************

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
	setInterval(heartbeat, 3000, wordsPerPixel, reportingTitle);
}

const initialiseAfterNav = () => {
	initialiseFontSizeListeners();
}

const initialiseScrollPosition = () => {
	if (location.hash && location.hash.startsWith('#b-')) {
		window.scrollTo({top: calculateScrollPosition(location.hash.substring(3)), left: 0, behavior: 'smooth'});
		location.hash = '';
	}
}

const initialiseMessage = () => {
	if (getCookie('newsletter') === 'pendenti') {
		message = 'Bgħatnielek email biex tikkonferma <l-m>l-abbonament</l-m> tiegħek fin-newsletter.';
	}
	if (!!location.hash && document.referrer.indexOf('//newsletter.aphroconfuso.mt')) {
    // REVIEW escape is deprecated
    const salted = decodeURIComponent(escape(window.atob((location.hash.substring(1)))));
    [salt, message] = salted.split('|');
		if (salt === 'aaaASUDHASUWYQQU55%$ASGDGAS*Jhh23423') {
      if (message.indexOf('biex tikkonferma l-abbonament')) {
				_paq.push(['trackEvent', 'Newsletter', 'Abbonament', 'Pendenti']);
        setCookie('newsletter', 'pendenti');
      }
			if (message.indexOf('abbonament ikkonfermat')) {
				_paq.push(['trackEvent', 'Newsletter', 'Abbonament', 'Komplut']);
        setCookie('newsletter', 'abbonat*');
      }
		}
	}
	if (!!message) {
		document.getElementById('message').setAttribute('data-content-piece', '«' + message + '»');
		document.getElementById('message').innerHTML = `<p>${ message }</p>`;
		document.getElementById('message').classList.add('active');
		setTimeout(() => document.getElementById('message').classList.remove('active'), 10000);
		location.hash = '';
	}
}

const initialiseAfterWindow = () => {
	progressElement = document.getElementById('progress');
	bookmarksMenuElement = document.getElementById('bookmarks-number');
	initialiseAfterNav();
	initialiseBookmarksList();
	showFullBookmarkList();
	window.addEventListener('scroll', (event) => {
		scrolling();
	});

	if (!!wordcount) {
		// TODO: Fix enjambed
		bodyText = Array.from(document.getElementById("grid-body").getElementsByClassName("body-text"), e => e.innerText).join(' ').replace(/\s+/g, ' ');
		screenHeight = window.innerHeight;
		body = document.getElementById('grid-body');
		bodyHeight = body.offsetHeight - screenHeight;
		bodyStart = body.offsetTop;
		const endnote = document.getElementById('endnote');
		if (endnote) bodyHeight -= endnote.offsetHeight;
		initialiseScrollPosition();
		// title = document.querySelector("article > header h1") ? document.querySelector("article > header h1").innerText : 'Djarju: ' + document.querySelector("article > header h3").innerText;
		// sequenceEpisodeTitle = document.querySelector("article > header h3") && document.querySelector("article > header h3").innerText;
		// author = document.querySelector("meta[name=author]").content;
		bodyEnd = bodyStart + bodyHeight;
		charactersPerPixel = bodyText.length / bodyHeight;
		wordsPerPixel = wordcount / bodyHeight;
		charactersPerScreen = Math.round(charactersPerPixel * screenHeight);
		wordsPerScreen = Math.round(wordsPerPixel * screenHeight);
		lastScrollPosition = getScrollPosition();
		lastReportedScrollPosition = lastScrollPosition;
		pageHeight = document.body.scrollHeight;
		initialiseReadingHeartbeat(wordcount);

		const slideshows = document.getElementsByClassName('splide');
		if (slideshows.length) {
			Splide.defaults = {
				type: 'fade',
				rewind: true,
				speed: 2000,
				padding: '2rem 0',
			}
			for (var i = 0; i < slideshows.length; i++) {
				const newSplide = new Splide(slideshows[i]).mount();
				newSplide.on('visible', function (slide) {
					window._paq.push(['trackEvent', 'Stampi', 'slideshow', reportingTitle, slide.index + 1]);
				});
			}
		}
		const lightbox = document.getElementById('lightbox');
		const openLightbox = () => {
			lightbox.classList.add('open');
			window._paq.push(['trackEvent', 'Stampi', 'lightbox - iftaħ', reportingTitle]);
		}
		const closeLightbox = () => {
			lightbox.classList.remove('open');
			window._paq.push(['trackEvent', 'Stampi', 'lightbox - għalaq', reportingTitle]);
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

		const closeTriggerWarning = () => {
			document.body.classList.add('trigger-warning-closed');
			setCookie(`tw-${ urlSlug }`, 'magħluq', 3);
			window._paq.push(['trackEvent', 'Stampi', 'lightbox - għalaq', reportingTitle]);
		}

		document.getElementById('trigger-warning-close')?.addEventListener('click', () => closeTriggerWarning());

		if (audioUrls) {
			Amplitude.init(audioUrls);
			var audio, activeReportingTitle;
			audio = Amplitude.getAudio();
			audio.addEventListener('canplaythrough', () => {
				if (audioLoaded) return;
				duration = parseInt(audio.duration);
				wordsPerSecondAudio = wordcount / duration;
				previousTime = getPreviousAudioTime();
				if (previousTime !== 0) {
					audio.currentTime = previousTime;
				}
				audioLoaded = true;
			});

			const addAudioBookmarkNow = (percentage) => {
				let playPosition = parseInt(audio.currentTime);
				const percentageAudio = percentage || (parseInt(audio.currentTime) * 100 / duration).toFixed(2);

				addBookmark('audio', {
					author,
					duration,
					monthYear,
					percentageAudio,
					placeText: getCurrentBlurb(percentageAudio),
					playPosition,
					// activeUrlSlug,
					activeReportingTitle,
					sequenceEpisodeNumber,
					sequenceEpisodeTitle,
					storyId,
					title: pageTitle,
					translator,
				});
			}

			audio.addEventListener('play', () => {
				audio = Amplitude.getAudio();
				activeReportingTitle = Amplitude.getActiveSongMetadata().reportingTitle;
				window._paq.push(['trackEvent', 'Smiegħ', 'play', activeReportingTitle]);
			});
			audio.addEventListener('pause', () => {
				activeReportingTitle = Amplitude.getActiveSongMetadata().reportingTitle;
				percentageAudio = (parseInt(audio.currentTime) * 100 / duration).toFixed(2);
				window._paq.push(['trackEvent', 'Smiegħ', 'pause', activeReportingTitle, percentageAudio]);
				addAudioBookmarkNow(percentageAudio);
			});
			audio.addEventListener('seek', () => {
				percentageAudio = (parseInt(audio.currentTime) * 100 / duration).toFixed(2);
				window._paq.push(['trackEvent', 'Smiegħ', 'seek', activeReportingTitle, percentageAudio]);
				if (currentTime === 0) {
					deleteBookmark('audio');
					return;
				}
				addAudioBookmarkNow(percentageAudio);
			});
			audio.addEventListener('ended', () => {
				window._paq.push(['trackEvent', 'Smiegħ', 'spiċċa', activeReportingTitle]);
				deleteBookmark('audio');
			});
			audio.addEventListener('waiting', () => {
				window._paq.push(['trackEvent', 'Smiegħ', 'buffering', activeReportingTitle, 1]);
			});
			audio.addEventListener('timeupdate', () => {
				currentTime = parseInt(audio.currentTime);
				if (currentTime === 0 || currentTime === previousTime) return;
				elapsedTime = currentTime - previousTime;
				if (elapsedTime > 10) window._paq.push(['trackEvent', 'Smiegħ', 'kliem maqbuż', parseInt(elapsedTime * wordsPerSecondAudio)]);
				if (currentTime % audioBookmarkingInterval === 0) addAudioBookmarkNow();
				if (currentTime % audioReportingInterval === 0) {
					window._paq.push(['trackEvent', 'Smiegħ', 'kliem (awdjo)', activeReportingTitle, parseInt(audioReportingInterval * wordsPerSecondAudio)]);
					window._paq.push(['trackEvent', 'Smiegħ', 'minuti (awdjo)', activeReportingTitle, 0.5]);
					window._paq.push(['trackEvent', 'Smiegħ', 'perċentwali (awdjo)', activeReportingTitle, ((currentTime * 100) / duration).toFixed(2)]);
				}
				previousTime = currentTime;
			});

			document.querySelectorAll('.audio .range').forEach(element => {
				element.addEventListener('click', function (e) {
					var offset = this.getBoundingClientRect();
					var x = e.pageX - offset.left;
					Amplitude.setSongPlayedPercentage((parseFloat(x) / parseFloat(this.offsetWidth)) * 100);
				})
			});
			document.querySelectorAll('.audio').forEach(element => element.classList.add('initialised'));
		}
	};
	initialiseMessage();
}

window.onload = initialiseAfterWindow;
