var bg = chrome.extension.getBackgroundPage(), t_vali;
try{
    clearTimeout(bg.loT);
}catch(e){}

function ghost(isActive) {
    if(isActive){
        $('#sec_notiTime').css('color','');
    }else{
        $('#sec_notiTime').css('color','#ccc');
    }
    options.notifyTime.disabled = !isActive; // The control manipulability.
}

function load() {
    // Initialize the option controls.
    options.doNotify.checked = parse(localStorage.doNotify); 
    options.doNum.checked = parse(localStorage.doNum); 
    options.doNotifyLogin.checked = parse(localStorage.doNotifyLogin);
    options.frequency.value = parseInt(localStorage.frequency); 
    options.notifyTime.value = parseInt(localStorage.notifyTime);
    options.previewNum.value = parseInt(localStorage.previewNum);
    options.username.value = localStorage.username || '';
    options.password.value = localStorage.password || '';

    if( window.location.search.indexOf('focus') >= 0 ) $('#username').focus();
    validate();

    if (!options.doNotify.checked) { ghost(false); }
    localStorage.popLogin = true;
};
load();

function update() {
    //如果登录信息有变，重新登录
    if( options.username.value != localStorage.username || options.password.value != localStorage.password){
        bg.login(options.username.value, options.password.value, true);
    }else{
        bg.load('dontNoti'); //静默开始新的时间周期 不提醒有新邮件
    }

    var valNames = [
        'notifyTime',
        'previewNum',
        'username',
        'password',
        'frequency'
    ], checkNames = [
        'doNotify',
        'doNum',
        'doNotifyLogin'
    ];

    valNames.forEach(function(name){
        localStorage[name] = options[name].value;
    });

    checkNames.forEach(function(name){
        localStorage[name] = options[name].checked;
    });



    window.close();
}
function validate(){
    var inputusr = $('#username');
    if( inputusr.val() != '' && !inputusr.val().match(/[\d\w]+\\[\d\w]+/i) ){
        inputusr.parent().next().addClass('error').html('应该是"域\\用户名", 如: taobao-hz\\qiuchi ');
        return false;
    }
    return true;
}


$('#options').submit(function(){
    if ( validate() ){
        update();
    }
    return false;
});


$('#username').blur(function(){
    validate();
});
$('#username').change(function(){
    tclear(t_vali);
    t_vali = setTimeout(validate,400);
});

