var sessionInfo = {
  frequency: localStorage.frequency * 60000 || 300000,
  isStarted: false,
  isOnline: false,
  isKissed: false,
  isMailing: false,
  isLoading: false,
  isStartUp: true //启动时不显示新邮件
};

var HOME_URL = URL = localStorage.owaHome;
var SYNC_URL = HOME_URL + _URL_SYNC;

var initialize = function() {
  //默认配置 Default configuration
  localStorage.doNotify = true;      // 是否显示桌面通知 Whether to show desktop notification
  localStorage.noDupNotify = true;      // 已忽略过的邮件就不再提醒 Don't notify for notified messages
  localStorage.frequency = 10;        // 检查新邮件周期，单位为分钟 minutes
  localStorage.notifyTime = 6;       // 新邮件桌面通知显示时间，单位为秒 seconds
  localStorage.previewNum = 10;       // popup窗口显示的预览条数
  localStorage.popLogin = true;      // 默认在未登录时弹出登录窗口 Popup login window if not logined
  localStorage.doNotifyLogin = true;       // 未登录时弹出提醒
  localStorage.doNum = false;        //是否始终在预览窗口显示邮件序号
  localStorage.username = '';
  localStorage.password = '';
  localStorage.owaHome = '';

  //灰色
  BROWSER_ACTION.setBadgeBackgroundColor({color: [139, 139, 139, 255]});
  BROWSER_ACTION.setBadgeText({text: UNKNOWN_COUNT});

};

$.ajaxSetup({
  beforeSend: function() {
    if (sessionInfo.isLoading) {
      return;
    }
    sessionInfo.isLoading = true;
  },
  complete: function() {
    sessionInfo.isLoading = false;
  }
});

//图标的点击事件
BROWSER_ACTION.onClicked.addListener(function(tab) {
  if (!HOME_URL) {
    OCC.notify('notify-setowa.html');
    return;
  }
  if (sessionInfo.isLoading) {
    return;
  }
  if (sessionInfo.isError) {
    OCC.openMail('options.html');
    return;
  }
  if (sessionInfo.isOnline) {
    OCC.openMail();
  } else {
    var usr = localStorage.username; pwd = localStorage.password;
    if (usr && pwd) {
      occLoader.login(usr, pwd, true, true);
    } else {
      if (parse(localStorage.doNotifyLogin)) OCC.notify('notify-login.html');
      OCC.openMail(true);
    }
  }
});

//bind things to chrome
var kissBrowser = function() {

  //实现同步更新图标
  TABS.onUpdated.addListener(function(tabId, info, tab) {
    var url = tab.url;
    if (info.status != 'complete' || url.indexOf(HOME_URL) < 0) return;

    if (url.indexOf('logoff') >= 0) { //如果是在登出页，把图标设为离线状态并打开owa主页
      OCC.openMail(true);
      OCC.setBA('offline');
      return;
    }

    //在页面中加入content script
    TABS.executeScript(null, {file: 'injection.js'}, function() {
      //给content script发送请求，返回页面内容，并执行sync操作
      TABS.sendRequest(tabId, { theAct: 'tabUpdated' }, function(data) {
        if (data.needReSync) {
          if (sessionInfo.isOnline == false) OCC.setBA('online');
          occLoader.sync(false, data.res);
        }
      });
    });

    //if (url.indexOf('a=New') >= 0 || url.indexOf('a=Reply') >= 0) {
    ////插入kissy 编辑器
    //TABS.executeScript(null, {file: 'load-editor.js'}, function() {
  //});

    //}

  });

  //切换到owa窗口时停止自动检查新邮件
  TABS.onSelectionChanged.addListener(function(tabId) {
    TABS.get(tabId, function(tab) {
      if (tab.url.indexOf(HOME_URL) >= 0) {
        tclear(loT);
        sessionInfo.isMailing = true;
      }else if (sessionInfo.isMailing) {
        sessionInfo.isMailing = false;
        loT = setTimeout(occLoader.sync, localStorage.frequency * 60000);
      }
    });
  });

  sessionInfo.kissed = true;
};

function start() {
  //只有配置了owa路径才会启动
  if (!HOME_URL) {
    OCC.notify('notify-setowa.html');
    return;
  }
  if (HOME_URL[HOME_URL.length - 1] !== '/') HOME_URL += '/';
  localStorage.owaHome = URL = HOME_URL;

  var notiLogin = parse(localStorage.doNotifyLogin);
  occLoader.auth(notiLogin);

  //绑定浏览器事件
  if (!sessionInfo.isKissed) kissBrowser();

  sessionInfo.isStarted = true;
}

//插件安装后初始化
if (!parse(localStorage.initialized)) {
  initialize();
  localStorage.initialized = true;
}

start();
