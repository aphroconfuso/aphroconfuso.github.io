var _paq = window._paq || [];

const setCookie = (cname, cvalue, exdays = 3650) => {
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

const checkMode = () => {
  const cookies = getCookie('cookies');
  const newsletter = getCookie('newsletter');
  document.getElementById("newsletter-container").classList.add('hide-placeholder');
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
			document.getElementById('message').setAttribute('data-content-piece', '«' + message + '»');
			document.getElementById('message').innerHTML = '<p>' + message + '</p>';
      document.getElementById("newsletter-container").classList.remove('hide-message');
      location.hash = '';
      return;
    }
  }
  if (newsletter === 'abbonat*') {
		document.getElementById("newsletter-container").classList.remove('hide-subscribed');
   	return;
  }
  if (newsletter === 'pendenti') {
    document.getElementById("newsletter-container").classList.remove('hide-pending');
    return;
  }
	document.getElementById("newsletter-container").classList.remove('hide-form');
	return;
}

checkMode();
