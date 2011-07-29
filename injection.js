//注入每个owa页面的文件

var bodyHtml = document.body.innerHTML;

function onRequest(request, sender, sendRes){
    var response = {};
    if( request.theAct && request.theAct == 'tabUpdated'){
        //如果找得到加入垃圾邮件的链接
        if( document.getElementById('lnkHdrjunk') ) {
            response.needReSync = true;
            response.res = bodyHtml;
        }
        sendRes(response);
    }
}

chrome.extension.onRequest.addListener(onRequest);
