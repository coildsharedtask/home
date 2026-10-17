// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

// Live timeline: reads the visitor's own clock, no manual edits ever needed
(function liveTimeline() {
  const track = document.getElementById('timeline-track');
  const progress = document.getElementById('tl-progress');
  if (!track || !progress) return;

  const items = Array.from(track.querySelectorAll('.tl-item[data-date]'));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const dates = items.map(item => new Date(item.dataset.date + 'T00:00:00'));

  let lastDoneIdx = -1;
  let nextIdx = -1;
  items.forEach((item, i) => {
    if (dates[i].getTime() < todayTime) {
      item.classList.add('done');
      lastDoneIdx = i;
    } else if (nextIdx === -1) {
      nextIdx = i;
    }
  });

  // If "today" lands exactly on a milestone's date, tag that row in place
  // instead of drawing a separate floating marker at the same spot —
  // otherwise the floating pill sits right on top of the row's own text.
  const isToday = nextIdx !== -1 && dates[nextIdx].getTime() === todayTime;

  if (nextIdx !== -1) {
    const nextItem = items[nextIdx];
    nextItem.classList.add('next');
    if (isToday) nextItem.classList.add('is-today');
    const h4 = nextItem.querySelector('h4');
    const pill = document.createElement('span');
    pill.className = 'tl-pill';
    pill.textContent = isToday ? 'Today' : 'Up next';
    h4.appendChild(pill);
  }

  // Between milestones: open up some room above the next row so the marker
  // and its label have a clear gap of their own to sit in.
  const betweenMilestones = !isToday && lastDoneIdx !== -1 && nextIdx !== -1;
  if (betweenMilestones) items[nextIdx].classList.add('tl-after-now');

  let nowDot = null;
  let nowLabel = null;
  if (!isToday) {
    nowDot = document.createElement('div');
    nowDot.className = 'tl-now-dot';
    nowLabel = document.createElement('div');
    nowLabel.className = 'tl-now-label';
    nowLabel.textContent = 'Today · ' + today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    track.appendChild(nowDot);
    track.appendChild(nowLabel);
  }

  function place() {
    const trackTop = track.getBoundingClientRect().top;
    const dotCenters = items.map(item => {
      const r = item.querySelector('.tl-dot').getBoundingClientRect();
      return (r.top + r.height / 2) - trackTop;
    });

    let fillPx;
    if (nextIdx === -1) {
      fillPx = dotCenters[dotCenters.length - 1];
    } else if (isToday) {
      fillPx = dotCenters[nextIdx];
    } else if (lastDoneIdx === -1) {
      fillPx = 0;
    } else {
      // Move through the empty space between the two rows rather than from dot
      // to dot, so the marker never lands beside a row's own text (e.g. a
      // revised date's struck-through original) and its label lines up with it.
      const rects = item => Array.from(item.querySelectorAll('.tl-date, .tl-body'), el => el.getBoundingClientRect());
      const gapTop = Math.max(...rects(items[lastDoneIdx]).map(r => r.bottom)) - trackTop;
      const gapBottom = Math.min(...rects(items[nextIdx]).map(r => r.top)) - trackTop;
      const half = nowLabel.offsetHeight / 2;
      const dStart = dates[lastDoneIdx].getTime();
      const dEnd = dates[nextIdx].getTime();
      const frac = Math.max(0, Math.min(1, (todayTime - dStart) / (dEnd - dStart)));
      const lo = gapTop + half;
      const hi = gapBottom - half;
      fillPx = hi > lo ? lo + frac * (hi - lo) : (gapTop + gapBottom) / 2;
    }

    progress.style.height = fillPx + 'px';
    if (nowDot) nowDot.style.top = fillPx + 'px';
    if (nowLabel) nowLabel.style.top = fillPx + 'px';
  }

  // Re-measure once web fonts have loaded and whenever the layout width
  // changes, since both shift row heights and therefore the dot positions.
  requestAnimationFrame(place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(place);
  });
})();
