var doc = document, 
head = doc.getElementsByTagName('head')[0];

var urlNote = document.createElement('div');
urlNote.id = 'ks-base-note';
urlNote.innerText = chrome.extension.getURL('library/kissy/');
urlNote.style.cssText = 'display:none;'
document.body.appendChild(urlNote);


var scriptsURLs = [chrome.extension.getURL('library/kissy/kissy-min.js'), chrome.extension.getURL('library/editor-config.js')];
var delay = 100;
scriptsURLs.forEach(function(url){
    setTimeout(function(){
        var script = doc.createElement('script');
        script.src = url + '?' + new Date();
        script.async = true;
        head.appendChild(script);
    },delay+=100);
});

