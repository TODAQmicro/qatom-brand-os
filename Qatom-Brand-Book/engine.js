/* Qatom Brand Book — slide / click-through deck engine (self-contained, no deps) */
(function(){
  var book = document.getElementById('book');
  var pages = Array.prototype.slice.call(book.querySelectorAll('.page'));
  var N = pages.length;
  var cur = 0, animating = false;
  var progress = document.getElementById('progress');
  var counter = document.getElementById('counter');
  var seclabel = document.getElementById('seclabel');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var hint = document.getElementById('hint');

  function render(){
    for (var i=0;i<N;i++){
      var p = pages[i];
      p.classList.remove('active','left','right');
      p.classList.add(i===cur ? 'active' : (i<cur ? 'left' : 'right'));
    }
    var pct = N>1 ? (cur/(N-1))*100 : 100;
    if(progress) progress.style.width = pct + '%';
    if(counter) counter.textContent = String(cur+1).padStart(2,'0') + ' / ' + String(N).padStart(2,'0');
    var run = pages[cur].getAttribute('data-run') || '';
    if(seclabel) seclabel.textContent = run.split('·')[0].trim();
    if(prevBtn) prevBtn.disabled = (cur===0);
    if(nextBtn) nextBtn.disabled = (cur===N-1);
    updateRail();
  }

  /* ---- left navigation rail ---- */
  var dividers = [];
  pages.forEach(function(p,i){ if(p.hasAttribute('data-toc')) dividers.push(i); });
  function buildRail(){
    var nav = document.getElementById('railnav'); if(!nav) return;
    var html = '<a data-i="0"><span class="rn">00</span><span class="rt">Cover</span></a>';
    dividers.forEach(function(idx){
      var toc = pages[idx].getAttribute('data-toc') || '';
      var parts = toc.split('—');
      var n = (parts[0]||'').trim(); var t = (parts[1]||toc).trim();
      html += '<a data-i="'+idx+'"><span class="rn">'+n+'</span><span class="rt">'+t+'</span></a>';
    });
    nav.innerHTML = html;
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ goTo(parseInt(a.getAttribute('data-i'),10)); closeRail(); });
    });
  }
  function updateRail(){
    var nav = document.getElementById('railnav'); if(!nav) return;
    // active section = last divider index <= cur (cover if before first divider)
    var active = 0;
    for(var k=0;k<dividers.length;k++){ if(dividers[k]<=cur) active = dividers[k]; }
    if(cur < (dividers[0]||1) && cur!==0) active = 0;
    nav.querySelectorAll('a').forEach(function(a){
      a.classList.toggle('on', parseInt(a.getAttribute('data-i'),10)===active);
    });
  }
  var rail = document.getElementById('rail');
  function closeRail(){ if(rail) rail.classList.remove('open'); }
  var rtoggle = document.getElementById('railtoggle');
  if(rtoggle) rtoggle.addEventListener('click', function(){ if(rail) rail.classList.toggle('open'); });
  function go(dir){
    var t = cur + dir;
    if (t<0 || t>N-1 || animating) return;
    animating = true;
    if (hint) hint.classList.add('hide');
    cur = t; render();
    setTimeout(function(){ animating=false; }, 260);
  }
  function goTo(i){ if(i>=0&&i<N){ cur=i; render(); } closeTOC(); }

  document.getElementById('next').addEventListener('click', function(){go(1);});
  document.getElementById('prev').addEventListener('click', function(){go(-1);});
  if(nextBtn) nextBtn.addEventListener('click', function(){go(1);});
  if(prevBtn) prevBtn.addEventListener('click', function(){go(-1);});

  document.addEventListener('keydown', function(e){
    if (e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ e.preventDefault(); go(1); }
    else if (e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); go(-1); }
    else if (e.key==='Home'){ cur=0; render(); }
    else if (e.key==='End'){ cur=N-1; render(); }
    else if (e.key==='Escape'){ closeTOC(); }
  });

  var sx=null;
  book.addEventListener('touchstart', function(e){ sx=e.touches[0].clientX; }, {passive:true});
  book.addEventListener('touchend', function(e){
    if (sx===null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx)>45) go(dx<0?1:-1);
    sx=null;
  }, {passive:true});

  var overlay = document.getElementById('overlay');
  var tocgrid = document.getElementById('tocgrid');
  function buildTOC(){
    var html='';
    pages.forEach(function(p,i){
      if (p.hasAttribute('data-toc')){
        var t=p.getAttribute('data-toc');
        var n=p.getAttribute('data-run')?p.getAttribute('data-run').split('·')[0].trim():'';
        html += '<a data-i="'+i+'"><span class="n">'+(n||('P'+(i+1)))+'</span><span class="t">'+t+'</span></a>';
      }
    });
    tocgrid.innerHTML = html;
    tocgrid.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ goTo(parseInt(a.getAttribute('data-i'),10)); });
    });
  }
  function openTOC(){ overlay.classList.add('open'); }
  function closeTOC(){ overlay.classList.remove('open'); }
  document.getElementById('tocbtn').addEventListener('click', openTOC);
  document.getElementById('tocclose').addEventListener('click', closeTOC);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeTOC(); });

  buildTOC(); buildRail(); render();
})();

/* Expression Equalizer — draggable handles (clamped to the 12–88% band) */
(function(){
  function bind(track){
    var h = track.querySelector('.eq-handle'); if(!h) return;
    var ax = track.closest('.eq-axis');
    var note = ax ? ax.querySelector('.eq-note') : null;
    function setPct(px){
      var r = track.getBoundingClientRect();
      var pct = ((px - r.left)/r.width)*100;
      pct = Math.max(12, Math.min(88, pct));
      h.style.left = pct + '%';
      if(note) note.textContent = pct<42 ? 'more digital' : (pct>58 ? 'more organic' : 'balanced');
    }
    function down(e){ e.preventDefault(); var mv=function(ev){ setPct((ev.touches?ev.touches[0]:ev).clientX); };
      var up=function(){ document.removeEventListener('mousemove',mv); document.removeEventListener('touchmove',mv);
        document.removeEventListener('mouseup',up); document.removeEventListener('touchend',up); };
      document.addEventListener('mousemove',mv); document.addEventListener('touchmove',mv,{passive:false});
      document.addEventListener('mouseup',up); document.addEventListener('touchend',up); }
    h.addEventListener('mousedown',down); h.addEventListener('touchstart',down,{passive:false});
    track.addEventListener('click',function(e){ if(e.target!==h) setPct((e.touches?e.touches[0]:e).clientX); });
  }
  document.querySelectorAll('.eq-track').forEach(bind);
})();
