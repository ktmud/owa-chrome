var bg = chrome.extension.getBackgroundPage(), t_vali, owa_OK = false;
bg.tclear(bg.loT);

const _L_opt_valimsg_username_1 = _LOCALE('opt_valimsg_username_1');
const _L_opt_valimsg_owaHome_1 = _LOCALE('opt_valimsg_owaHome_1');
const _L_opt_valimsg_owaHome_2 = _LOCALE('opt_valimsg_owaHome_2');
const _L_opt_valimsg_owaHome_3 = _LOCALE('opt_valimsg_owaHome_3');
const _L_opt_valimsg_owaHome_4 = _LOCALE('opt_valimsg_owaHome_4');
const _L_opt_valimsg_owaHome_https = _LOCALE('opt_valimsg_owaHome_https');

var valNames = [
  'notifyTime',
  'previewNum',
  'username',
  'password',
  'owaHome',
  'frequency'
], checkNames = [
  'doNotify',
  'cookieAuth',
  'noDupNotify',
  'doNum',
  'doNotifyLogin'
];

function loadOptions() {
  // Initialize the option controls.
  checkNames.forEach(function(item) {
    options[item] && (options[item].checked = parse(localStorage[item]));
  });

  valNames.forEach(function(item) {
    options[item] && (options[item].value = localStorage[item] || '');
  });

  if (window.location.search.indexOf('focus=') >= 0) {
    var focusId = window.location.search.split('focus=')[1];
    $('#' + focusId).focus();
  }

  validate(true);

  if (!options.doNotify.checked) { ghost(false); }
  localStorage.popLogin = true;
}

function updateOptions() {
  var owaHomePrev = localStorage.owaHome,
  usernamePrev = localStorage.username,
  passwordPrev = localStorage.password;

  valNames.forEach(function(name) {
    localStorage[name] = options[name].value;
  });

  checkNames.forEach(function(name) {
    localStorage[name] = options[name].checked;
  });

  bg.sessionInfo.frequency = options.frequency.value * 60000;

  //如果API地址有变
  var owaHomeNow = localStorage.owaHome;

  if (owaHomePrev != owaHomeNow) {
    bg.URL = bg.HOME_URL = owaHomeNow;
    if (!bg.sessionInfo.isStarted) {
      bg.start();
      window.close();
      return;
    }
  }

  if (owaHomeNow == '') {
    bg.OCC.setBA('error');
  } else {
    var usernameNow = localStorage.username,
    passwordNow = localStorage.password;
    //如果登录信息有变，重新登录
    if ((usernamePrev != usernameNow || passwordPrev != passwordNow) &&
    usernameNow !== '' && passwordNow !== '') {
    bg.occLoader.login(usernameNow, passwordNow, true, true);
  } else {
    bg.occLoader.auth(true, true, false);
  }
  }

  window.close();
}

function ghost(isActive) {
  if (isActive) {
    $('#sec_notiTime').css('color', '');
  }else {
    $('#sec_notiTime').css('color', '#ccc');
  }
  options.notifyTime.disabled = !isActive; // The control manipulability.
}

var val_owa_prev = localStorage.owaHome;

function validate(doFocus) {
  var inputusr = $('#username'),
  inputpwd = $('#password'),
  inputowa = $('#owaHome'),
  val_usr = inputusr.val(),
  val_owa = inputowa.val(),
  valimsg_usr = $('#vali_username'),
  valimsg_owa = $('#vali_owaHome');

  //if( val_usr != '' && !val_usr.match(/[\d\w]+\\[\d\w]+/i) ){
  //valimsg_usr.addClass('error').html(_L_opt_valimsg_username_1);
  //if(doFocus) inputusr.focus();
  //return false;
  //}else{
  //valimsg_usr.removeClass('error').html('');
  //}

  if (val_owa == '' || !val_owa.match(/^http(s)?:\/\/.{3,}/i)) {
    valimsg_owa.addClass('error').html(_L_opt_valimsg_owaHome_1);
    if (doFocus) inputowa.focus();
    owa_OK = false;
  }else if (val_owa != val_owa_prev) {
    val_owa_prev = val_owa;
    valimsg_owa.removeClass('error').html(_L_opt_valimsg_owaHome_2);

    $.ajax({
      url: val_owa,
      success: function(res) {
        if (bg.sessionInfo.isLoading) {
          bg.sessionInfo.isLoading = false;
          return;
        }
        if (res.indexOf('owa') >= 0) {
          if (!inputusr.val() || !inputpwd.val()) {
            inputusr.focus();
            valimsg_owa.html(_L_opt_valimsg_owaHome_3);
          }
          owa_OK = true;
        }else {
          valimsg_owa.addClass('error');
          if (val_owa.indexOf('https') == 0) {
            valimsg_owa.html(_L_opt_valimsg_owaHome_4);
          } else {
            valimsg_owa.html(_L_opt_valimsg_owaHome_https);
          }
        }
      },
      error: function() {
        owa_OK = false;
        if (bg.sessionInfo.isLoading) {
          bg.sessionInfo.isLoading = false;
          return;
        }
        valimsg_owa.addClass('error');
        valimsg_owa.html(_L_opt_valimsg_owaHome_error);
      }
    });
  }else if (val_owa == localStorage.owaHome) {
    owa_OK = true;
  }

  return owa_OK;
}

$('body').ready(function() {
  document.title = _LOCALE('extName');

  var template = $('#template').html();

  var html = template.replace(/\{(\w*)\}/g, function(holder, val) {
    return _LOCALE(val) || '';
  });

  $('body').html(html);
  //载入选项
  loadOptions();

  $('#options').submit(function(ev) {
    ev.preventDefault();
    if (validate(true) && owa_OK) {
      //更新选项
      updateOptions();
    }
  });

  $('#owaHome').blur(validate)

  $('#owaHome').keyup(function() {
    tclear(t_vali);
    t_vali = setTimeout(validate, 1000);
  });

});
