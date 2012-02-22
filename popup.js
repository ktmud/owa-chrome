//Locales
const _L_have_N_mails     = _LOCALE('have_N_mails');
const _L_mark_as_read     = _LOCALE('mark_as_read');
const _L_tip_mark_as_read = _LOCALE('tip_mark_as_read');
const _L_tip_handleNow	  = _LOCALE('tip_handleNow');
const _L_tip_listLink	  = _LOCALE('tip_listLink');
const _L_recieveTime	  = _LOCALE('recieveTime');
const _L_size 			  = _LOCALE('size');
const _L_loadingWait	  = _LOCALE('loadingWait');
const _L_open			  = _LOCALE('open');
const _L_reply			  = _LOCALE('reply');
const _L_delete			  = _LOCALE('delete');
const _L_err_loadMBody 	  = _LOCALE('err_loadMBody');
const _L_tip_readMore	  = _LOCALE('tip_readMore');
const _L_noMore			  = _LOCALE('noMore');
const _L_tip_watchBack    = _LOCALE('tip_watchBack');

const NUM_UNRD = parse(localStorage.unrd); //总未读条目数 - The total number of unread items

var bg = chrome.extension.getBackgroundPage();

var occPopup   = function() {
  var HOME_URL = HOME_URL || localStorage.owaHome,
  URL_SINGLE   = HOME_URL + _URL_SINGLE_,
  URL_REPLY    = HOME_URL + _URL_REPLY_,
  setBA        = OCC.setBA,
  notify       = OCC.notify,
  openMail     = OCC.openMail,
  setNum       = OCC.setNum;

  const LOAD_DELAY  = 600; //鼠标悬停多久开始载入 - Hover your mouse over how long it begins to load
  const READ_TIME   = 1500; //给用户多少时间阅读 - To the user how much time to read
  const NUM_PERPAGE = parse(localStorage.previewNum); //每页预览的条目数 - The number of entries per page preview
  //const DO_NUM      = parse(localStorage.doNum); //是否显示邮件编号 - Whether to display the message number
  const DO_NUM      = parse(localStorage.doNum) ||
  (NUM_UNRD > NUM_PERPAGE * 2); //只有当需要翻两页以上时显示邮件编号 - The message number is displayed only when the need to turn more than two

  //最主要的信息 [{title:'',from:'',id:'',time:'',size:''}]
  var mails = parse(localStorage.mails),
  haveRead = parse(localStorage.haveRead) || []; //已经通过 预览 阅读过的邮件，一个 id 的数组


  //清扫掉已经阅读的
  if (haveRead.length >= 1) {
    for (var i = mails.length - 1; i >= 0; i--) {
      if (haveRead.indexOf(mails[i].id) != -1) {
        mails.splice(i, 1);
      }
    }
    localStorage.mails = JSON.stringify(mails);
  }

  if (!mails) {
    OCC.openMail();
    window.close();
  }

  const NUM_INSTORE = mails.length; //localStorage存入的未读条目数

  var hasPrev = false, isEnd = false, //用于控制上下翻页的状态
  mIndex  = 0, //当前项的索引
  liTotal = 0, //正显示的条目数
  //t_liTitle, //设置li title的倒计时
  t_loadMbody, //鼠标悬浮在li上载入邮件正文的倒计时
  t_read; //用户阅读正文的倒计时


  var unrd_now = NUM_UNRD;

  function genLi(start) {
    var liArr = [], i = 1;
    if (typeof start != 'undefined') mIndex = start;
    for (''; i <= NUM_PERPAGE && mIndex < NUM_INSTORE; mIndex++, i++) {
      liArr.push(genSingleLi(mails[mIndex]));
    }
    liTotal = i;
    return liArr.join('');
  }

  function genSingleLi(single) {
    return ['<li data-index="',
      mIndex, '"',
      haveRead.indexOf(single.id) >= 0 ? ' class="haveRead"' : '',
      '><a class="title" data-id="',
      single.id,
      '" title="',
      _L_tip_listLink, //在网页中打开该邮件
      '">',
      DO_NUM ? (mIndex + 1) + '. ' : '',
      single.title,
      '</a>',
      single.from,
      '<div class="more-info">',
      '<div class="meta"><span class="time">',
      _L_recieveTime, ': ',  //接收时间
      single.time,
      '<span><span class="size">',
      _L_size, ': ',  //大小
      single.size,
      '</span></div><div class="mail-body">',
      _L_loadingWait,
      '</div></div>',
    '</li>'].join('');
  }

  //mark all mails as read
  function markAllAsRead() {
    //send a post request to owa
    var post_data = {
      hidpnst: '',
      hidactbrfld: '', 
      hidcid: '', 
      hidso: '',
      hidpid: "MessageView",
      chkhd: "on",
      chkmsg: [],
      hidcmdpst: "markread"
    };

    mails.forEach(function(item) {
      post_data.chkmsg.push(item.id);
    });

    $.get(HOME_URL, function(res) {

      try {
        var fld_id = res.match(/a_sFldId\s*=\s*"([^"]*)"/)[1],
        canary = res.match(/name="hidcanary" value="([^"]*)"/)[1];
        //mtgmsg = res.match(/name="hidmtgmsg" value="([^"]*)"/)[1];

        post_data.hidcanary = canary;
        //post_data.hidmtgmsg = canary;

        $.ajax({
            url: HOME_URL + '?ae=StartPage&slUsng=0&pg=1&id=' + fld_id,
            data: post_data,
            type: 'POST',
            success: function(data) {
              bg.occLoader.sync(res);
              $('#digests li').addClass('haveRead');
              window.close();
            },
            traditional: true,
            error: function() {
              alert('oops... something is not working.');
            }
        });
      } catch (e) {
          alert('oops... something is not working.');
      }
    });
  }

  /*
  * 为邮件标题列表指派事件
  */
  function assign() {
    $('body').delegate('a', 'click', function(e) {
      e.stopImmediatePropagation();
      if (this.id == 'mark-read') {
        markAllAsRead();
        event.stopImmediatePropagation();
        return false;
      }
      if (this.hash != '#no-openmail') {
        var id = $(this).attr('data-id'),
        url = this.href || (id ? URL_SINGLE + encodeURIComponent(id) : HOME_URL);
        openMail(url);
        return false;
      }
    });

    $('#digests').delegate('li', 'click', function(ev) {
      var theLi = $(this), theMore = theLi.children('div.more-info');
      if (ev.target.nodeName == 'DIV' || theMore.is(':animated')) return;

      tclear(t_loadMbody);
      tclear(t_read);

      theMore.slideToggle(200, function() {
        theLi.toggleClass('opened');
        if (theLi.hasClass('loaded') && theLi.hasClass('opened') && !theLi.hasClass('haveRead')) t_read = setTimeout(function() { markRead(theLi); }, READ_TIME);
      });
      if (!theLi.hasClass('loaded')) loadMbody(theLi);
    });

    $('#digests').delegate('li', 'hover', function(ev) {
      var theLi = $(this);

      //tclear(t_liTitle);
      //if( !theLi.hasClass('opened') ){
      //t_liTitle = setTimeout(function(){
      //theLi.attr('title','点击预览该邮件');
    //},100);
      //}
      theLi.children('a').toggleClass('clickable');

      var theMore = theLi.children('div.more-info');

      tclear(t_loadMbody);
      tclear(t_read);

      if (ev.type == 'mouseenter') { //鼠标移入时
        theMore.animate({opacity: 1},200).css('visibility', '');
        if (theLi.hasClass('opened')) {  //如果已经展开
          if (!theLi.hasClass('haveRead')) {  //如果还是未读状态
            t_read = setTimeout(function() { markRead(theLi); }, READ_TIME);
          }
        }else {
          //延时主动展开li
          t_loadMbody = setTimeout(function() { theLi.click(); }, LOAD_DELAY);
        }
      }else {
        theMore.animate({opacity: 0},200).css('visibility', 'hidden');
      }
    });

  }

  /**
  * 载入邮件正文预览
  */
  function loadMbody(theLi) {
    var index = theLi.attr('data-index'),
    id = theLi.children('a').attr('data-id'),
    id_e = encodeURIComponent(id),
    mbody = theLi.find('.mail-body'),
    single_url = URL_SINGLE + id_e;
    reply_url = URL_REPLY + id_e;
    $.ajax({
      url: single_url,
      cache: true,
      success: function(res) {
        var res = res.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*(?:<\/style>|$)/ig, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*(?:<\/script>|$)/ig, '')
        .replace(/<img[^>]*>/ig, '')
        .replace(/<link[^>]*>/ig, '');

        var $res = $(res), bdy = $res.find('div.bdy');

        if (bdy) {
          theLi.addClass('loaded');

          var text = $(bdy).text().replace('<', '&lt;').replace('>', '&gt;'),
          btnOpen = ['<a href="', single_url, '" class="mbtn open">', _L_open, '</a>'].join(''),
          btnReply = ['<a href="', reply_url, '" class="mbtn reply">', _L_reply, '</a>'].join('');

          if (text.length > 300) text = text.slice(0, 286) + '...';

          mbody.html([text, btnReply, btnOpen].join(''));
          btnDelete = $('<a href="#no-openmail" class="mbtn delete">' + _L_delete + '</a>');
          theLi.children('a').after(btnDelete);
          btnDelete.click(function(ev) {
            ev.preventDefault();
            $res.find('input[name=hidcmdpst]').val('Del');
            var data = $res.serialize();
            $.ajax({
              url: HOME_URL + '?ae=PreFormAction&t=IPM.Note&a=Del',
              data: data,
              type: 'POST',
              success: function() {
                markRead(theLi);
                theLi.children('div.more-info').slideUp(100, function(){
                  theLi.remove();
                  if (mIndex < NUM_INSTORE - 1) {
                    var newLi = genSingleLi(mails[++mIndex]);
                    $('#digests ul').append(newLi);
                  }
                });
              }
            });
          });

          t_read = setTimeout(function() { markRead(theLi); }, READ_TIME);

        }else {
          mbody.addClass('error').html(_L_err_loadMBody);
        }
      },
      error: function() {
        mbody.addClass('error').html(_L_err_loadMBody);
      }
    });
  }

  /**
  * 标记条目为已读，更新未读条目数
  */
  function markRead(theLi) {
    if (!theLi.hasClass('loaded')) return;
    if (theLi.hasClass('haveRead')) return;

    theLi.addClass('haveRead');

    var id = theLi.children('a').attr('data-id');

    if (unrd_now > 0) unrd_now -= 1;
    localStorage.unrd = unrd_now;
    setBA(unrd_now);
    $('h1 strong').html(unrd_now);
    if (unrd_now == 0) {
      BROWSER_ACTION.setPopup({popup: ''});
      BROWSER_ACTION.setBadgeText({text: ''});
    }
    haveRead.push(id);
  }

  //-------------------PAGER------------------------------------------------------------
  function insertNext() { //插入下一页按钮
    $('<div id="next" class="btn" title="' + _L_tip_readMore + '">...</div>').appendTo('#digests').click(function() {
      tclear(t_loadMbody);
      toNext();
      if (mIndex >= NUM_INSTORE) {
        isEnd = true;
        $(this).attr('title', '').html(_L_noMore).css({background: '#fff', cursor: 'default'});
      }
    });
  }

  function toNext() {
    if (isEnd) {
      return false;
    }

    $('<ul class="mail-list">' + genLi() + '</ul>')
    .css('display', 'none')
    .insertBefore('#next')
    .slideDown(400, function() {
      //assign();
      $(this).prev().slideUp(200, function() {
        if (!hasPrev) insertPrev(); //如果没有上一页按钮
        $(this).remove(); //移除上一页的ul节点
      });
    });
  }

  function insertPrev() { //插入上一页按钮
    $('<div id="prev" class="btn" title="' + _L_tip_watchBack + '">...</div>')
    .css('display', 'none')
    .prependTo('#digests')
    .slideDown(function() {
      hasPrev = true;
    }).click(function() {
      toPrev();
    });
  }

  function toPrev() { //转到上一页
    mIndex -= (liTotal + NUM_PERPAGE) - 1;
    $('<ul class="mail-list">' + genLi() + '</ul>')
    .css('display', 'none')
    .insertAfter('#prev')
    .slideDown(400, function() {
      //assign();
      $(this).next().slideUp(200, function() {
        $(this).remove(); //移除下一页的ul节点
        //重置下一页按钮
        if (isEnd) {
          $('#next').attr('title', _L_tip_readMore).html('...').css({background: '', cursor: ''});
          isEnd = false;
        }
        //如果已经到顶，就移除上一页按钮
        if (mIndex <= NUM_PERPAGE) {
          $('#prev').slideUp(100, function() {
            $(this).remove();
            hasPrev = false;
          });
        }
      });
    });
  }
  //-------------------END---------------------------------------------


  /*
  * 开始
  */
  function go() {
    var ul = '<ul class="mail-list">' + genLi() + '</ul>',
    template = $('#template').html(),
    html = template.replace(/\{(\w*)\}/g, function(holder, val) {
      return _LOCALE(val) || '';
    });

    html = html.replace(/{num}/gi, NUM_UNRD);

    $('body').html(html);

    $('#digests').append(ul);
    assign();
    if (NUM_PERPAGE < NUM_INSTORE) insertNext();
  }

  return {
    haveRead: haveRead,
    go: function() {
      go();
    }
  };

}();

if (!NUM_UNRD) { //没有未读邮件
  OCC.openMail();
}else {
  window.onload = occPopup.go;
  window.onunload = function() {
    //把已阅读条目的id记录到localStorage
    localStorage.haveRead = JSON.stringify(occPopup.haveRead);
  };
}
