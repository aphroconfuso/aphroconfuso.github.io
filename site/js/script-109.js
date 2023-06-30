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
	screenHeight,
	timeStarted,
	title,
	wordcount,
	wordsPerPixel;

var storyCompleted = false;

const thresholdWords = 100;
const minWordsperSecond = 0.5;
const maxWordsPerSecond = 4;

const setCookie = (cname, cvalue, exdays = 36500) => {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

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
    document.querySelector('#progress').innerHTML = `${ percentageProgress }%`;
    lastScrollPosition = newScrollPosition;
  }
  return;
}

const initialiseAfterNewsletter = () => {
	return;
}

const addRemoveFontSizeClass = (size) => {
	document.body.classList.remove('font-size-1','font-size-2','font-size-3','font-size-4');
	document.body.classList.add(`font-size-${ size }`);
	setCookie('font', size);
}

const initialiseFontSize = () => {
	const fontSize = getCookie('font') || 1;
	addRemoveFontSizeClass(fontSize);
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

const initialiseAfterBody = () => {
	initialiseFontSize();
}

const initialiseAfterNav = () => {
	initialiseFontSizeListeners();
}

const initialiseAfterWindow = () => {
	initialiseAfterBody();
	initialiseAfterNav();
	if (!!wordcount) {
		body = document.getElementById('body-text');
		bodyHeight = body.offsetHeight;
		bodyStart = body.offsetTop;
		title = document.querySelector("h1").innerText;
		bodyEnd = bodyStart + bodyHeight;
		screenHeight = window.innerHeight;
		wordsPerPixel = wordcount / bodyHeight;
		initialiseReadingHeartbeat(wordcount);
	};
	window.addEventListener('scroll', (event) => {
		scrolling();
	});
	lastScrollPosition = getScrollPosition();
	lastReportedScrollPosition = lastScrollPosition;
	pageHeight = document.body.scrollHeight;
}

window.onload = initialiseAfterWindow;
