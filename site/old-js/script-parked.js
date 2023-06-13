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
