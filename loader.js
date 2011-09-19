var occLoader = function() {

  var setBA = OCC.setBA,
  notify = OCC.notify,
  openMail = OCC.openMail,
  setNum = OCC.setNum;

  function auth(notiLogin, notiNewMail, openHome) {
    var isOnline = sessionInfo.isOnline;
    if (isOnline) { //如果已登录
      setBA('online');
      tclear(loT);
      sync(notiNewMail);
      //only popup login window when the first time the owa url is changed.
      if (parse(localStorage.popLogin)) {
        localStorage.popLogin = false;
      }
    } else { //如果未登录
      setBA('offline');

      var usr = localStorage.username,
      pwd = localStorage.password, url = HOME_URL;

      //if (/^https/.test(HOME_URL)) {
      //url = url.replace(/(\/\/)?([\w\n\.\-]+)\//, '$1$2:443/');
      //} else {
      //url = url.replace(/(\/\/)?([\w\n\.\-]+)\//, '$1$2:80/');
      //}

      //incase we need http auth.
      url = url.replace(/^(http(s)?:\/\/)?/i, '$1' + encodeURI(usr) + ':' + encodeURI(pwd) + '@' );

      //登录判定
      $.ajax({
        url: url,
        success: function(res) {
          //如果登录成功，应该是在开始页
          if (res.indexOf('StartPage') >= 0) {
            sessionInfo.isOnline = true;
            setBA('online');
            sync(notiNewMail, res);
            if (openHome) openMail(true);
          }else {
            if (usr && pwd) { //如果提供了用户名和密码，尝试登录
              login(usr, pwd, notiNewMail, openHome);
              return;
            }

            if (parse(localStorage.popLogin)) { //关闭选项设置页时这一项会被重置
              openMail(true); //弹出主页
              localStorage.popLogin = false;
            }

            if (notiLogin) notify('notify-login.html'); //提醒登录
          }
        },
        error: function() {
          setBA('error');
          notify(_LOCALE('notiTitle_CheckError'),
          _LOCALE('notiBody_CheckError'));

          //retry every 90 seconds.
          setTimeout(auth, 90000);
        }
      });
    }
  }

  function login(usr, pwd, notiNewMail, openHome) {
    var data = {
      destination: HOME_URL,
      flags: '5',
      forcedownlevel: '0',
      trusted: '4',
      username: usr,
      password: pwd,
      isUtf8: '1'
    };
    //var login_url = HOME_URL.replace(/^(http(s)?:\/\/)?/i, "$1" + usr + ':' + pwd + '@' ) + _URL_AUTH;
    $.ajax({
      url: HOME_URL + _URL_AUTH,
      data: data,
      type: 'POST',
      success: function(res) {
        if (res.indexOf('var a_fWP = 0') >= 0) {
          sessionInfo.isOnline = true;
          setBA('online');
          sync(notiNewMail, res);
          if (openHome) openMail(true);
        }else {
          setBA('offline');
          notify('notify-authfail.html');
        }
      },
      error: function() {
        setBA('error');
      }
    });

  }

  //using iFrame
  //var frame = $('<iframe />').appendTo('body')[0];
  //$.ajax({
  //url: LOGIN_URL,
  //context: frame.contentDocument,
  //dataType: 'html',
  //success: function(res){
  //res = res.replace(/="\/owa\//g, '="'+HOME_URL)
  //.replace(/<img[^>]*?>/ig, '')
  //.replace('action="owaauth\.dll"','action="'+AUTH_URL+'"');

  //var doc = $(this.body);
  //doc.html(res);
  //doc.find('#username').val(usr);
  //doc.find('#password').val(pwd);
  //doc.find('input:submit').click();
  //}
//});

  /**
  * @TODO
  * Event Notification
  */
  function evnoti() {
    $.ajax({
      url: HOME_URL + _URL_EVNOTI,
      type: 'POST',
      success: function(res) {
        var evid = res.match(/id=\\"([^"]*)"/)[1].replace('\\', ''),
        evlocation = res.match(/l=\\"([^"]*"/)[1].replace('\\', ''),
        evtime = res.match(/t=\\"([^"]*"/)[1].replace('\\', ''),
        evtitle = res.match(/<div id=divS class=sub>([^<]*)<\/div>/)[1].replace('\\', '');
        // 10-11-2010 13:00:00 UTC
        theTime = evtime.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/);

        now = new Date();
        theFuture = new Date(Data.UTC(theTime[3], theTime[1], theTime[2], theTime[4], theTime[5], theTime[6]));

        timeRemain = theFuture - now;

        if (timeRemain < localStorage.evnotiGap * 36000) notify('');
      }
    });
  }

  /**
  * poll for new messages.
  * @param {?boolean} noti 是否显示桌面提醒.
  * @param {?string} res 不用再发送ajax请求，直接把res当作返回结果.
  * @param {?callback} callback 如果是function，就是callback.
  */
  function sync(noti, res, callback) {

    if (res) {
      handleRes(res);
      return;
    }

    $.ajax({
      url: URL,
      success: function(res) {
        handleRes(res, noti);
        if (typeof callback == 'function') callback.apply(this);
        if (parse(localStorage.doEventNotify)) evnoti();
      },
      error: function() {
        setBA('error');
      }
    });
  }

  function handleRes(res, noti) {
    //if( res.indexOf('var a_fWP') == -1 ){ //不是邮件相关的页面
    //return;
    //}

    //开始新的检查周期
    tclear(loT);
    loT = setTimeout(sync, sessionInfo.frequency);

    var sunrd = res.match(/inbox[^<]*<\/a><span class="unrd">\((\d+)\)<\/span>/i), unrd = 0;
    if (sunrd) unrd = parseInt(sunrd[1]);

    //don't notice new mail when at browser start up.
    if (sessionInfo.isStartUp) {
      sessionInfo.isStartUp = false;
      noti = false;
    }
    //if( res.indexOf('收件箱') == -1  ){ //如果载入的页面不是收件箱页，意味着没有登录或登录失败
    //tclear(loT);  //停止检查新邮件
    //// setTimeout(function(){auth('noti')},3000);  //重试验证登录
    //return;  //除非手动激活，今后不会再检查登录或新邮件
    //}

    if (unrd == 0) { //邮件数为0
      BROWSER_ACTION.setPopup({popup: ''});
      //置空ignored
      localStorage.ignored = '[]';
    }

    //save the unread numer and mail info into localStorage
    if (unrd !== 0) {
      localStorage.unrd = unrd;
      (function(res, unrd) {
        var trs = res.match(/<tr style="font-weight:bold;">[\s\S]*?<\/tr>/ig),
        mailInfoArr = [],
        i = 0, l = trs ? trs.length : 0;

        while (i < l) {
          var $tds = $(trs[i].replace(/<img[^>]*>/ig, ''))
          .children('td'),

          id = $tds.eq(3).children('input').val(), //mail id
          from = $tds.eq(4).text(), //sender
          title = $tds.eq(5).find('a').html(), //title
          time = $tds.eq(6).text(),  //send time
          size = $tds.eq(7).text();  //mail size

          mailInfoArr.push({
            id: id,
            from: $.trim(from),
            title: $.trim(title),
            time: $.trim(time),
            size: $.trim(size)
          });
          i++;
        }
        if (mailInfoArr.length > 0) {
          localStorage.mails = JSON.stringify(mailInfoArr);
          localStorage.haveRead = '[]';
        }
      })(res, unrd);
    }

    setNum(unrd, noti);  //更新BA图标数字，以及显示（或不显示）桌面提醒
  }

  return {
    auth: auth,
    login: login,
    sync: sync
  };
}();
