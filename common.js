const TABS = chrome.tabs;
const BROWSER_ACTION = chrome.browserAction;
const UNKNOWN_COUNT = '?';
const MAX_UNREAD = 100;

const _URL_LOGIN = 'auth/logon.aspx';
const _URL_AUTH = localStorage.cookieAuth ? '../CookieAuth.dll?Logon' : 'auth/owaauth.dll';
const _URL_EVNOTI = 'ev.owa?ns=Notify&ev=Poll';
const _URL_SINGLE_ = '?ae=Item&id=';
const _URL_REPLY_ = '?ae=PreFormAction&a=Reply&id=';

const _L_err_connection = _LOCALE('err_connection');
const _L_needLogin = _LOCALE('needLogin');
const _L_ba_tip_default = _LOCALE('ba_tip_default');
const _L_ba_tip_open = _LOCALE('ba_tip_open');
const _L__new_mails = _LOCALE('_new_mails');
const _L__new_mail = _LOCALE('_new_mail');


var noti, noT, auT, loT;


function parse(type) {
  return typeof type == 'string' ? JSON.parse(type) : type;
}
function _LOCALE(msgName) {
  return chrome.i18n.getMessage(msgName);
}
function tclear(t) {
  try {
    clearTimeout(t);
  }catch (e) {}
}

/*
* basic render template function by yyfrankyy  http://f2e.us
*/
function render(templ, data) {
  return templ.replace(/(!?)(\{([\w\.]*)\})/g,
  function(str, clear, origin, key) {
    var keys = key.split('.'),
    value = data[keys.shift()];
    keys.forEach(function(key) {
      value = value[key];
    });
    return (value === null || value === undefined) ?
    (!! clear ? '' : origin) : value;
  });
}

var OCC = function() {
  function openMail(target) {
    var HOME_URL = HOME_URL || localStorage.owaHome;
    TABS.getAllInWindow(null, function tabSearch(tabs) {
      for (var i in tabs) {
        var tab = tabs[i], url = tab.url;
        if ((url.indexOf(HOME_URL) >= 0 &&
        url.indexOf(_URL_REPLY_) == -1) ||
        url.slice(url.indexOf(target)) == target) {
          var params = { selected: true };
          if (typeof target == 'boolean' && target ||
            url.indexOf('logoff') >= 0 || url.indexOf('logon') >= 0)
            params.url = HOME_URL;
            if (typeof target == 'string')
              params.url = target;

            TABS.update(tab.id, params);
            return;
        }
      }
      //所有Tab都遍历完毕 自己新开一个tab
      var url = HOME_URL;
      if (typeof target == 'string') url = target;
      TABS.create({url: url});
    });
  }

  function notify() {
    var args = arguments;
    if (!args.length || args.length == 1) {

      var notiURL = 'notify.html';

      if (args.length && args[0].indexOf('html') >= 0) {
        notiURL = args[0];
      } else {
        var mails = parse(localStorage.mails),
        len = mails && mails.length,
        ignored = parse(localStorage.ignored);

        if (ignored && ignored.length) {
          mails.forEach(function(item){
            //if this mail is ignored
            if (ignored.indexOf(item.id) != -1) len--;
          });
        }

        //if there is no mails to show
        if (!len && parse(localStorage.noDupNotify)) return;
      }

      noti = webkitNotifications
      .createHTMLNotification(chrome.extension.getURL(notiURL));

      noti.show();

      return;
    }
    if (args.length >= 3) {
      var notiTitle = args[0],
      notiBody = args[1],
      //Chrome 6.9 is not able to display an image in a relative path.
      notiIcon = args[2] || 'yellow.png';
      try {
        noti.cancel();
        clearTimeout(noT);
      }catch (e) {}
      noti = webkitNotifications.createNotification(notiIcon, notiTitle, notiBody);
      noti.show();
      noT = setTimeout(function() { try { noti.cancel(); }catch (e) {} }, 5500);
    }
  }

  function setBA(type) {
    var text, title, path, popup = '', color;
    if (type == 'error' || type == 'offline') {
      text = UNKNOWN_COUNT;
      path = 'gray.png';
      title = _L_err_connection;
      sessionInfo.isOnline = false;
      color = [139, 139, 139, 255];
      popup = '';
    }
    if (type == 'error') {
      sessionInfo.isError = true;
    }

    if (type == 'offline') {
      text = '';
      //title = '您登录先登录OWA邮件系统';
      title = _L_needLogin;
    }

    if (type == 'online') {
      text = '';
      path = 'yellow.png';
      title = _L_ba_tip_default;
      color = [250, 185, 100, 255];
      sessionInfo.isOnline = true;
    }

    if (type == 'nonew') {
      text = '';
      //title = '目前没有新邮件，点击打开WebMail';
      title = _L_ba_tip_open;
    }

    if (!isNaN(parseInt(type))) {
      text = type + '';
      title = type + (type > 1 ? _L__new_mails : _L__new_mail);   //'封新邮件';
      popup = 'popup.html';
    }

    BROWSER_ACTION.setBadgeText({text: text});
    BROWSER_ACTION.setTitle({title: title});
    if (path) {
      BROWSER_ACTION.setIcon({path: path});
    }
    if (color) {
      BROWSER_ACTION.setBadgeBackgroundColor({color: color});
    }
    if (popup !== undefined) {
      BROWSER_ACTION.setPopup({popup: popup});
    }
  }

  function setNum(num, doNoti) {
    if (num == 0) {
      setBA('nonew');
      return true;
    }
    num < MAX_UNREAD ? num + '' : MAX_UNREAD - 1 + '+';
    setBA(num);

    if (doNoti === undefined) doNoti = true;  //如不指定是否notify，则默认notifyy
    if (doNoti && num > 0 && !sessionInfo.isMailing && parse(localStorage.doNotify)) notify();
  }

  return {
    /**
    * @param {boolean|string} the url or indicator of
    *                         whether we should go back to home.
    */
    openMail: function(target) {
      openMail(target);
    },

    notify: function() {
      notify.apply(this, arguments);
    },

    setBA: function(type) {
      setBA(type);
    },
    /**
    * 更改未读条目数的显示，如有必要，显示桌面提醒
    */
    setNum: function(num, dontNoti) {
      setNum(num, dontNoti);
    }
  };
}();
