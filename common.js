const TABS = chrome.tabs;
const BROWSER_ACTION = chrome.browserAction;
const UNKNOWN_COUNT = '?';
const MAX_UNREAD = 100;

const _URL_LOGIN = '/auth/logon.aspx';
const _URL_AUTH = '/auth/owaauth.dll';
const _URL_EVNOTI = '/ev.owa?ns=Notify&ev=Poll';
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
                if (url.indexOf(HOME_URL) >= 0 &&
                    url.indexOf(_URL_REPLY_) == -1) {
                    var params = { selected: true };
                    if (typeof target == 'boolean' && target ||
                        url.indexOf('logoff') >= 0 || url.indexOf('logon') >= 0)
                        params.url = HOME_URL;
                    if (typeof target == 'string' &&
                        target.indexOf('http') == 0)
                        params.url = target;

                    TABS.update(tab.id, params);
                    return;
                }
            }
            //所有Tab都遍历完毕 自己新开一个tab
            var url = HOME_URL;
            if (typeof target == 'string' &&
                target.indexOf('http') == 0) url = target;
            TABS.create({url: url});
        });
    }

    function notify(args) {
        if (!args || args.length == 1) {
            var notiURL = 'notify.html';
            if (args && args[0].indexOf('html') >= 0) notiURL = args[0];
            noti = webkitNotifications
                   .createHTMLNotification(chrome.extension.getURL(notiURL));
            noti.show();
            return;
        }
        if (args.length >= 3) {
            var notiTitle = args[0],
            notiBody = args[1],
            //Chrome 6.9 is not able to display an image in a relative path.
            notiIcon = args[2] || 'data:image/png;base64,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';
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
            path = 'grey.png';
            title = _L_err_connection;
            sessionInfo.isOnline = false;
            color = [139, 139, 139, 255];
            popup = '';
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
            notify(arguments);
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
