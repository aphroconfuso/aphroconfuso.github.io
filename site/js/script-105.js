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

var percentageMax;

const scrolling = () => {
  const newScrollPosition = getScrollPosition();
  // console.log(newScrollPosition);
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

		percentageMax = parseInt(((newScrollPosition - bodyStart) * 100) / pageHeight);
		// percentageProgress = parseInt(((newScrollPosition - lastScrollPosition) * 100) / pageHeight);
    // document.querySelector('#progress').innerHTML = `${ percentageMax }%`;

    lastScrollPosition = newScrollPosition;
	}

	const threshold = bodyStart;
	const maxScroll = bodyEnd;
	const scrollReportingIncrement = screenHeight / 3;
	if ((newScrollPosition >= threshold) && (newScrollPosition < maxScroll) && (newScrollPosition - lastReportedScrolledPosition) > (scrollReportingIncrement)) {
		const pixelProgress = newScrollPosition - lastReportedScrolledPosition;
		const wordsRead = parseInt(wordsPerPixel * pixelProgress);
		const timeNow = new Date() / 1000;
		const secondsElapsed =  timeNow - newReportsSentAT;
		const wordsPerSecond = wordsRead / secondsElapsed;
		const minutesMax = parseInt(((new Date() / 1000) - startReadingTime) / 60);

		// Is it a plausible speed?
		if (wordsRead > 100 && wordsPerSecond > 1 && wordsPerSecond < 3) {
			// console.log('Reporting:', wordsRead, 'words read');
			console.log(`Reporting: ${wordsRead}wr ${wordsPerSecond}wps ${percentageMax}% kliem: ${wordsRead} minuti: ${minutesMax}`);
			window._paq.push(['trackEvent', 'Qari', 'Fil-mija', pageTitle, parseInt(percentageMax)]);
			window._paq.push(['trackEvent', 'Qari', 'Kliem', pageTitle, parseInt(wordsRead)]);
			window._paq.push(['trackEvent', 'Qari', 'Minuti', pageTitle, parseInt(minutesMax)]);
			lastReportedScrolledPosition = newScrollPosition;
			newReportsSentAT = new Date() / 1000;
			return;
		} else {
			console.log(`NOT Reporting: ${wordsRead}wr ${wordsPerSecond}wps ${percentageMax}% kliem: ${wordsRead} minuti: ${minutesMax}`);
		}
	} else {
		console.log('NOT', newScrollPosition, threshold, newScrollPosition, maxScroll);
}
  return;
}

// const initialiseNewsletter = () => {
// 	if (!document.getElementById("newsletter-container")) {
// 		return;
// 	}
//   const cookies = getCookie('cookies');
// 	const newsletter = getCookie('newsletter');
//   document.getElementById("newsletter-container").classList.add('hide-placeholder');
//   if (!!location.hash && document.referrer.indexOf('//newsletter.aphroconfuso.mt')) {
//     // REVIEW escape is deprecated
//     const salted = decodeURIComponent(escape(window.atob((location.hash.substring(1)))));
//     [salt, message] = salted.split('|');
//     if (salt === 'aaaASUDHASUWYQQU55%$ASGDGAS*Jhh23423') {
//       if (message.indexOf('biex tikkonferma l-abbonament')) {
// 				_paq.push(['trackEvent', 'Newsletter', 'Abbonament', 'Pendenti']);
//         setCookie('newsletter', 'pendenti');
//       }
// 			if (message.indexOf('abbonament ikkonfermat')) {
// 				_paq.push(['trackEvent', 'Newsletter', 'Abbonament', 'Komplut']);
//         setCookie('newsletter', 'abbonat*');
//       }
// 			document.getElementById('message').setAttribute('data-content-piece', '«' + message + '»');
// 			document.getElementById('message').innerHTML = '<p>' + message + '</p>';
//       document.getElementById("newsletter-container").classList.remove('hide-message');
//       location.hash = '';
//       return;
//     }
//   }
//   if (newsletter === 'abbonat*') {
// 		document.getElementById("newsletter-container").classList.remove('hide-subscribed');
//    	return;
//   }
//   if (newsletter === 'pendenti') {
//     document.getElementById("newsletter-container").classList.remove('hide-pending');
//     return;
//   }
// 	document.getElementById("newsletter-container").classList.remove('hide-form');
// 	return;
// }
const initialiseAfterNewsletter = () => {
	return;
	// initialiseNewsletter();
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

// ANALITIKA u BOOKMARKS

var lastReportedReadingTime, startReadingTime, newReportsSentAT;

const initialiseReadingHeartbeat = () => {
	startReadingTime = new Date() / 1000
	newReportsSentAT = startReadingTime;
	lastReportedReadingTime = startReadingTime;
	body = document.getElementById('body-text');
	bodyHeight = body.offsetHeight;
	bodyStart = body.offsetTop;
	bodyEnd = bodyStart + bodyHeight;
	screenHeight = window.innerHeight;
	wordsPerScreen = wordcount * screenHeight / bodyHeight;
	wordsPerPixel = wordcount / bodyHeight;
	heartbeatId = setInterval(heartbeat, 3000, wordsPerPixel, screenHeight);
}

const heartbeat = (wordsPerPixel, screenHeight, bodyStart, bodyEnd) => {
	// dismiss: too soon, etc?
	// record scrollPosition
	// is scrollposition higher than previos one?
	// has a plausible amount of time passed?
	// ===> report, set bookmark, update
	const timeNow = new Date() / 1000;
	const secondsElapsed =  timeNow - lastReportedReadingTime;
	const newScrollPosition = getScrollPosition();

	// console.log(newScrollPosition, lastReportedScrollPosition, secondsElapsed);
	if (newScrollPosition > bodyStart || newScrollPosition > bodyEnd) {
		return;
	}

	if (newScrollPosition > lastReportedScrollPosition) {
		const pixelProgress = newScrollPosition - lastReportedScrollPosition;
		const wordsRead = wordsPerPixel * pixelProgress;
		const wordsPerSecond = wordsRead / secondsElapsed;

		// console.log('wordsRead: ', wordsRead, 'wordsPerSecond: ', wordsPerSecond);

		// Is it a plausible speed?
		if (wordsRead > 100 && wordsPerSecond > 1 && wordsPerSecond < 3) {
			// console.log('Reporting:', wordsRead, 'words read');
			window._paq.push(['trackEvent', 'Qari', pageTitle, 'kliem', parseInt(wordsRead)]);
			lastReportedScrollPosition = newScrollPosition;
			lastReportedReadingTime = timeNow;
			return;
		}
		// Shall we reset?
		// if (pixelProgress > screenHeight || pixelProgress < 0) {
		// 	console.log('Resetting...', pixelProgress, screenHeight);
		// 	_paq.push(['trackEvent', 'Qari', title, 'waqfet']);
		// 	lastReportedScrollPosition = newScrollPosition;
		// 	lastReportedReadingTime = timeNow;
		// }
		return;
	}
}

var lastScrollPosition, progress, hideScrollTools, pageHeight, pageTitle, bodyStart, body, bodyHeight, bodyStart, bodyEnd, screenHeight, wordsPerScreen, wordsPerPixel, heartbeatId;
var lastReportedScrollPosition = getScrollPosition();
var lastReportedScrolledPosition = lastReportedScrollPosition;

var wordcount;
const initialiseAfterWindow = () => {
	// console.log('Initialising...');
	if (!!wordcount) { initialiseReadingHeartbeat(wordcount); };
	window.addEventListener('scroll', (event) => {
		scrolling();
	});
	lastScrollPosition = getScrollPosition();
	lastReportedScrollPosition = lastScrollPosition;
	pageHeight = document.body.scrollHeight;
	pageTitle = document.querySelector("h1").innerText;
}

const initialiseAfterBody = () => {
	initialiseFontSize();
}

const initialiseAfterNav = () => {
	initialiseFontSizeListeners();
}

window.onload = initialiseAfterWindow;
