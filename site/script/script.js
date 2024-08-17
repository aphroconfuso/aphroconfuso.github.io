const audioBookmarkingInterval = 10;
const audioReportingInterval = 30;
const bookmarkThresholdWords = 250;
const maxPlausibleWordsPerSecond = 5;
const minPlausibleWordsPerSecond = 1;
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
	if (newScrollPosition !== lastScrollPosition) {
		document.body.classList.add('scrolling');
		if (!!wordcount) {
			clearTimeout(hideScrollTools);
			hideScrollTools = setTimeout(() => {
				document.body.classList.remove('scrolling')
			}, 5000);
			percentageProgress = (((newScrollPosition - bodyStart) * 100) / bodyHeight).toFixed(2);
			if (percentageProgress >= 0) {
				if (percentageProgress > 100) {
					percentageProgress = 100;
				}
				progressElement.textContent = percentageProgress > 0 && percentageProgress < 100 ? `${ Math.round(percentageProgress) }%` : '';
			}
		}
		lastScrollPosition = newScrollPosition;
  }
  return;
}

const addBookmarkNow = () => {
	if (!percentageProgress || (wordcount * (percentageProgress / 100)) < bookmarkThresholdWords || percentageProgress > 98) {
		return;
	}
	addBookmark('text', storyId, {
		author,
		issueMonth,
		issueMonthYear,
		percentage: percentageProgress,
		placeText: getCurrentBlurb(percentageProgress),
		sequenceEpisodeNumber,
		sequenceEpisodeTitle,
		storyId,
		storyType,
		reportingTitle,
		title: pageTitle,
		translator,
		urlSlug,
		v: 5,
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
		if (wordsRead > thresholdWords && wordsPerSecond > minPlausibleWordsPerSecond && wordsPerSecond < maxPlausibleWordsPerSecond) {
			analytics(['trackEvent', 'Qari', 'kliem', reportingTitle, parseInt(wordsRead)]);
			analytics(['trackEvent', 'Qari', 'minuti', reportingTitle, (secondsElapsed / 60).toFixed(2)]);
			analytics(['trackEvent', 'Qari', 'perċentwali', reportingTitle, parseInt(Math.round(percentageProgress))]);
			analytics(['trackEvent', 'Qari', 'ħeffa', reportingTitle, wordsPerSecond.toFixed(2)]);

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
	bookmarkKeysArray.forEach((oldKey) => {
		const item = bookmarksList[oldKey];

		const { dateTime, monthYear, issueMonth, issueMonthYear, percentage, playPosition, title, urlSlug, wordcount } = item;

		const itemIssueMonth = issueMonth || (monthYear && monthYear.replace(/-.*$/, ""));
		const itemIssueMonthYear = issueMonthYear || monthYear;

		item.issueMonth = itemIssueMonth;
		item.issueMonthYear = itemIssueMonthYear;

		const [, oldKeyType, oldKeyId] = oldKey.split(/(text|audio)-/);
		// // console.log('oldKeyType', oldKeyType);
		let updateFormat = false;
		let discardBookmark = false;

		// Check validity - remove after 01.06.2024
		if (oldKeyType === 'text') {
			updateFormat = !(percentage && title && urlSlug && issueMonth);
			discardBookmark = percentage >= 98 || (wordcount * (percentage / 100) < bookmarkThresholdWords);
		}
		if (oldKeyType === 'audio') {
			discardBookmark = playPosition && playPosition < 300;
		}

		// check validity - too old
		var threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
		if (new Date(dateTime) < threeMonthsAgo) updateFormat = true;

		if (!discardBookmark && oldKeyType === 'undefined' || !parseInt(oldKeyId)) {
			updateFormat = true;

			// Fix missing keys
			const newKey = `${ item.type }-${ item.storyId }`;
			item.key = newKey;
			item.type = item.type || 'audio';
			item.v = 5;

			// Convert to id-keyed
			bookmarksList[newKey] = item;
		}

		if (oldKeyType === 'text' && !discardBookmark) {
			bookmarksArray.push(item);
		}

		// console.log(bookmarksArray);

		if (updateFormat || discardBookmark) {
			console.log('Deleting', oldKey);
			delete bookmarksList[oldKey];
		};
	});
	saveBookmarksList();
}

const addBookmark = (type = 'text', thisStoryId = storyId, bookmark) => {
	const { author, percentage, sequenceEpisodeNumber, storyType, title } = bookmark;
	const reportingTitle = fixReportingTitle(storyType, sequenceEpisodeNumber, author, title);
	bookmarksList[`${ type }-${ thisStoryId }`] = {
		dateTime: new Date(),
		type,
		...bookmark
	};
	saveBookmarksList();
	if (type === 'audio') return;
	updateBookmarksMenu(bookmarksArray);
	analytics(['trackEvent', 'Bookmarks', 'żid', reportingTitle, percentage]);
}

const deleteBookmark = (type = 'text', id = storyId) => {
	delete bookmarksList[`${ type }-${ id }`];
	saveBookmarksList();
	if (type === 'audio') return;
	const bookmark = bookmarksArray.find(i => i.storyId);
	const { author, percentage, sequenceEpisodeNumber, storyType, title } = bookmark;
	const reportingTitle = fixReportingTitle(storyType, sequenceEpisodeNumber, author, title);
	bookmarksArray = bookmarksArray.filter(i => i.storyId !== id);
	updateBookmarksMenu(bookmarksArray);
	const removeBookmark = document.getElementById(`bookmark-${ id }`);
	removeBookmark.style.opacity = '0';
	setTimeout(() => removeBookmark.remove(), 1000);
	analytics(['trackEvent', 'Bookmarks', 'armi', reportingTitle, percentage]);
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
		const { author, percentage, sequenceEpisodeNumber, storyId, storyType, title, urlSlug } = bookmark;
		const roundedPercentage = Math.round(percentage);
		const destinationTitle = fixReportingTitle(storyType, sequenceEpisodeNumber, author, title);
		document.querySelectorAll(`a.story-${ storyId }`).forEach((element) => {
			const bookmarkLink = document.createElement("a");
			bookmarkLink.innerHTML = `<span class="bookmark-percentage">${roundedPercentage}%</span>`;
			bookmarkLink.classList.add("bookmark");
			bookmarkLink.href = `/${ urlSlug }/#b-${ percentage }`;
			bookmarkLink.addEventListener("click", () => {analytics(['trackEvent', 'Promo', `minn: ${ reportingTitle }`, `għal: ${ destinationTitle } (bookmark)`, roundedPercentage])});
			element.appendChild(bookmarkLink);
		});
		document.querySelectorAll(`article.story-${ storyId } > header`).forEach((element) => {
			const bookmarkLink = document.createElement("a");
			bookmarkLink.innerHTML = `<span class="bookmark-percentage">${roundedPercentage}%</span>`;
			bookmarkLink.classList.add("bookmark");
			bookmarkLink.href = `/${ urlSlug }/#b-${ percentage }`;
			bookmarkLink.addEventListener('click', () => {
				analytics(['trackEvent', 'Bookmark fil-paġna', reportingTitle, reportingTitle, roundedPercentage]);
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
	if (digits >= 11 && digits <= 19) return `${ number }-il ${ words[0]}`;
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
		// use numberify
		if (bookmarksCount >= 11) numberPhrase = bookmarksCount + '-il bookmark';
		if (bookmarksCount >= 20) numberPhrase = bookmarksCount + ' bookmark';
		document.getElementById("bookmarks-number-inline").textContent = numberPhrase;
	} else {
		bookmarksContainer && bookmarksContainer.classList.add("bookmarks-none");
	}

	if (list && browserTemplating && template) {
		bookmarksArray.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).forEach((bookmark, index) => {
			var { author, issueMonth, issueMonthYear, percentage, placeText, storyId, storyType, reportingTitle, sequenceEpisodeNumber, sequenceEpisodeTitle, title, urlSlug, wordcount, translator } = bookmark;
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
			// issueMonth still contains year
			clone.querySelector("li.bookmark-item").id = `bookmark-${ storyId }`;
			clone.querySelector("a").href = `/${ urlSlug }/#b-${ percentage }`;
			clone.querySelector("a").classList.add(`promo-${ issueMonth }`, issueMonth, `story-${ storyId }`, storyType);
			clone.querySelector("a").id = `link-${ storyId }`;
			clone.querySelector(".bookmark span.bookmark-percentage").textContent = `${Math.round(percentage)}%`;
			clone.querySelector("h1").innerHTML = title;
			if (translator) {
				clone.querySelector("h2 ").innerHTML = `<span class=\"author\">${ author }</span> (tr <span class=\"translator\">${ translator }</span>)`;
			} else {
				clone.querySelector("h2 ").innerHTML = `<span class=\"author\">${ author }</span>`;
			}
			if (sequenceEpisodeTitle) clone.querySelector("h3").textContent = sequenceEpisodeTitle;
			// TODO: Add collections
			clone.querySelector("li.header-label").textContent = issueMonthYear && issueMonthYear.replace(/-/, ' ').replace(/gunju/, 'ġunju').replace(/dicembru/, 'diċembru');
			clone.querySelector("button").id = `delete-${ storyId }`;
			clone.querySelector(".body-text p").textContent = placeText.replace(/.*?\w\b\s+/, "… ");
			clone.querySelector("aside p").textContent = `Fadallek ${ remaining }, madwar ${ minutes } qari`;
			list.appendChild(clone);
			document.getElementById(`delete-${ storyId }`).addEventListener("click", (event) => { deleteBookmark('text', storyId); event.stopPropagation(); });
			document.getElementById(`link-${ storyId }`).addEventListener("click", () => analytics(['trackEvent', 'Promo', 'minn: Bookmarks', `għal: ${ reportingTitle }`, index]));
		});
	}
}

const clearAllBookmarks = () => localStorage.clear();

const getPreviousAudioTime = (id) => {
	return bookmarksList[`audio-${ id }`] && bookmarksList[`audio-${ id }`].playPosition || 0;
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
	var salted;
	if (getCookie('newsletter') === 'pendenti') {
		message = 'Bgħatnielek email biex tikkonferma <l-m>l-abbonament</l-m> tiegħek fin-newsletter.';
	}
	if (!!location.hash && document.referrer.indexOf('//newsletter.aphroconfuso.mt')) {
		// REVIEW escape is deprecated
		try {
			salted = decodeURIComponent(escape(window.atob((location.hash.substring(1)))));
		} catch(err) {
			console.log(err.message);
			return;
		}
    [salt, message] = salted.split('|');
		if (salt === 'aaaASUDHASUWYQQU55%$ASGDGAS*Jhh23423') {
      if (message.indexOf('biex tikkonferma l-abbonament')) {
				analytics(['trackEvent', 'Newsletter', 'Abbonament', 'Pendenti']);
        setCookie('newsletter', 'pendenti');
      }
			if (message.indexOf('abbonament ikkonfermat')) {
				analytics(['trackEvent', 'Newsletter', 'Abbonament', 'Komplut']);
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

const initialiseAnchorEvents = () => {
	document.querySelectorAll("#grid-body a[href^='\#']").forEach((anchor, index) => {
		anchor.addEventListener("click", () => analytics(['trackEvent', 'A#', `${ reportingTitle }`, `# ${ anchor.textContent }`, index + 1]));
	});
}

const initialiseAfterWindow = () => {
	progressElement = document.getElementById('progress');
	bookmarksMenuElement = document.getElementById('bookmarks-number');
	initialiseAfterNav();
	initialiseBookmarksList();
	showFullBookmarkList();
	initialiseAnchorEvents();
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
					analytics(['trackEvent', 'Stampi', 'slideshow', reportingTitle, slide.index + 1]);
				});
			}
		}
		const lightbox = document.getElementById('lightbox');
		const openLightbox = () => {
			lightbox.classList.add('open');
			analytics(['trackEvent', 'Stampi', 'lightbox - iftaħ', reportingTitle]);
		}
		const closeLightbox = () => {
			lightbox.classList.remove('open');
			analytics(['trackEvent', 'Stampi', 'lightbox - għalaq', reportingTitle]);
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
			analytics(['trackEvent', 'Stampi', 'lightbox - għalaq', reportingTitle]);
		}

		document.getElementById('trigger-warning-close')?.addEventListener('click', () => closeTriggerWarning());

		if (audioUrls && audioUrls.songs.length) {
			audioUrls.songs.forEach((song, index) => {
				const {storyId, reportingTitle: pageReportingTitle} = song;
				GreenAudioPlayer.init({
					selector: `#player-${ index }`,
					stopOthersOnPlay: true,
					startTime: getPreviousAudioTime(storyId)
				});

				const audioReportingTitle = pageReportingTitle !== reportingTitle ? `${ pageReportingTitle } (${ reportingTitle })` : pageReportingTitle;


				// use player 1 player 2, etc
				// Amplitude.init(audioUrls);
				// var audio, audioReportingTitle;
				const audio = document.querySelector(`#audio-${ index }`);

				[...document.querySelectorAll(`a[href*="#audio|${ index }"]`)].forEach((foundLink) => {
					const gotoTime = foundLink.href.split('|')[2];
					foundLink.addEventListener('click', (event) => {
						analytics(['trackEvent', 'Smiegħ', `Kapitli (${ audioReportingTitle })`, foundLink.textContent]);
						audio.currentTime = gotoTime;
						event.preventDefault();
					})
				});

				audio.addEventListener('canplaythrough', () => {
					if (song.loaded) return;
					// duration = parseInt(audio.duration);
					// wordsPerSecondAudio = song.wordcount / duration;
					song.loaded = true;
					songEvents(index, song, audio);
				});
				// audio.addEventListener('canplaythrough', () => {
				// 	if (audioLoaded) return;
				// duration = parseInt(audio.duration);
				// wordsPerSecondAudio = song.wordcount / duration;
				// 	previousTime = getPreviousAudioTime();
				// 	if (previousTime !== 0) {
				// 		audio.currentTime = previousTime;
				// 	}
				// 	audioLoaded = true;
				// });


				const getPercentageAudio = (audio) => (audio.currentTime * 100 / audio.duration).toFixed(2);

				const addAudioBookmarkNow = (percentage, song, audio) => {

					const audioPercentage = percentage || getPercentageAudio(audio);
					addBookmark('audio', song.storyId, {
						author: song.author,
						duration: audio.duration,
						issueMonth: song.issueMonth,
						issueMonthYear: song.issueMonthYear,
						percentageAudio: audioPercentage,
						placeText: getCurrentBlurb(audioPercentage),
						playPosition: parseInt(audio.currentTime),
						reportingTitle: song.reportingTitle,
						sequenceEpisodeNumber: song.sequenceEpisodeNumber,
						sequenceEpisodeTitle: song.sequenceEpisodeTitle,
						storyId: song.storyId,
						title: song.title,
						translator: song.translator,
						urlSlug: song.pageSlug,
					});
				}

				const songEvents = (index, song, audio) => {
					wordsPerSecondAudio = 2.5;
					// *****

					// audio.currentTime = getPreviousAudioTime(song.storyId);

					audio.addEventListener('play', () => {
						analytics(['trackEvent', 'Smiegħ', 'play', audioReportingTitle]);
					});
					audio.addEventListener('pause', () => {
						const percentageAudio = getPercentageAudio(audio);
						analytics(['trackEvent', 'Smiegħ', 'pause', audioReportingTitle, percentageAudio]);
						addAudioBookmarkNow(percentageAudio, song, audio);
					});
					audio.addEventListener('seek', () => {
						const currentTime = parseInt(audio.currentTime);
						const percentageAudio = getPercentageAudio(audio);
						analytics(['trackEvent', 'Smiegħ', 'seek', audioReportingTitle, percentageAudio]);
						if (currentTime < 60) {
							audio.currentTime = 0;
							previousTime[index] = 0;
							deleteBookmark('audio', song.storyId);
							return;
						}
						addAudioBookmarkNow(percentageAudio, song, audio);
					});
					audio.addEventListener('ended', () => {
						analytics(['trackEvent', 'Smiegħ', 'spiċċa', audioReportingTitle]);
						deleteBookmark('audio', song.storyId);
					});
					audio.addEventListener('waiting', () => {
						analytics(['trackEvent', 'Smiegħ', 'buffering', audioReportingTitle, 1]);
						// console.log(`Player ${ index }`, 'waiting', audioReportingTitle);
					});
					audio.addEventListener('timeupdate', () => {
						const currentTime = parseInt(audio.currentTime);
						if (currentTime === 0 || currentTime === previousTime[index]) return;
						const elapsedTime = currentTime - previousTime[index];
						if (elapsedTime > 10) analytics(['trackEvent', 'Smiegħ', 'kliem maqbuż', parseInt(elapsedTime * wordsPerSecondAudio)]);
						if (currentTime % audioBookmarkingInterval === 0) addAudioBookmarkNow(null, song, audio);
						if (currentTime % audioReportingInterval === 0) {
							analytics(['trackEvent', 'Smiegħ', 'kliem (awdjo)', audioReportingTitle, parseInt(audioReportingInterval * wordsPerSecondAudio)]);
							analytics(['trackEvent', 'Smiegħ', 'minuti (awdjo)', audioReportingTitle, 0.5]);
							analytics(['trackEvent', 'Smiegħ', 'perċentwali (awdjo)', audioReportingTitle, ((currentTime * 100) / duration).toFixed(2)]);
						}
						previousTime[index] = currentTime;
					});

				}


			});

			const elementsToMove = Array.from(document.querySelectorAll('figure[data-put-after]'));
			elementsToMove && elementsToMove.forEach(elementToMove => {
				const putAfter = elementToMove.getAttribute('data-put-after');
				const newParentElement = Array.from(document.querySelectorAll('#grid-body p, #grid-body blockquote')).filter(p => p.textContent.includes(putAfter))[0];
				if (!!newParentElement) newParentElement.after(elementToMove);
			});

			document.querySelectorAll('.audio').forEach(element => element.classList.add('initialised'));
		}
	};
	initialiseMessage();
}

window.onload = initialiseAfterWindow;
