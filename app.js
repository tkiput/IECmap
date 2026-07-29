// app.js - クリスマス会 × FESTA 会場ガイド メインスクリプション

// ==========================================================================
// 1. グローバル状態管理
// ==========================================================================
const state = {
  activeTab: 'home',
  mapFloor: 'hall', // 'hall', '1f', '2f'
  mapScale: 1,
  mapTranslateX: 0,
  mapTranslateY: 0,
  mapIsDragging: false,
  mapStartX: 0,
  mapStartY: 0,
  selectedPinCircleId: null,
  simulatedTimeActive: false,
  simulatedTimeMinutes: 600, // デフォルト 10:00 (10*60)
};

// ピンの座標・配置定義（SVG内のローカル座標 x, y）
const pinDefinitions = {
  "pin-hall-stage": { x: 400, y: 160, floor: 'hall' },
  "pin-hall-sub": { x: 230, y: 435, floor: 'hall' },
  "pin-101": { x: 145, y: 155, floor: '1f' },
  "pin-102": { x: 295, y: 155, floor: '1f' },
  "pin-103": { x: 505, y: 155, floor: '1f' },
  "pin-104": { x: 655, y: 155, floor: '1f' },
  "pin-201": { x: 145, y: 155, floor: '2f' },
  "pin-202": { x: 295, y: 155, floor: '2f' },
  "pin-203": { x: 505, y: 155, floor: '2f' },
  "pin-204": { x: 655, y: 155, floor: '2f' }
};

// ==========================================================================
// 2. 起動初期化
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initMapPins();
  initMapPanZoom();
  initCirclesList();
  initScheduleList();
  initTimeSimulator();
  
  // 初期タブ切り替え
  switchTab(state.activeTab);
  
  // PWA サービスワーカー登録 (必要な場合)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // 開発環境など状況に応じて登録。静的ファイルのため省略可能ですが、
      // ユーザーにPWA対応を明示するため登録コードを記述。
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration skipped or failed: ', err);
      });
    });
  }
});

// ==========================================================================
// 3. タブ切り替え制御
// ==========================================================================
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // 1. すべてのタブコンテンツとナビボタンのアクティブクラスを解除
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  // 2. 対象コンテンツとナビボタンをアクティブ化
  const targetPane = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.getElementById(`nav-${tabId}`);
  if (targetPane) targetPane.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
  
  // 3. ヘッダーのタイトル更新
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    const labels = {
      'home': 'ホーム',
      'map': '会場マップ',
      'schedule': 'タイムスケジュール',
      'circles': 'サークル一覧',
      'info': 'ご利用案内'
    };
    headerTitle.textContent = labels[tabId] || '案内';
  }
  
  // 4. マップタブ切り替え時のリセット＆再計算
  if (tabId === 'map') {
    // コンテナのリサイズに追従させるためマップ描画更新があればここで調整
    setTimeout(() => {
      applyMapTransform();
    }, 100);
  }
  
  // 5. スケジュールタブ切り替え時の現在時間更新
  if (tabId === 'schedule') {
    updateScheduleStatus();
  }
}

// ==========================================================================
// 4. カウントダウンタイマー
// ==========================================================================
function initCountdown() {
  const targetDateStr = infoData.eventDate;
  const targetDate = new Date(targetDateStr);
  
  const timerDays = document.getElementById('timer-days');
  const timerHours = document.getElementById('timer-hours');
  const timerMinutes = document.getElementById('timer-minutes');
  const timerSeconds = document.getElementById('timer-seconds');
  const finishedMsg = document.getElementById('countdown-finished-msg');
  const timerContainer = document.getElementById('countdown-timer');
  
  function updateTimer() {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
      if (timerContainer) timerContainer.classList.add('hidden');
      if (finishedMsg) finishedMsg.classList.remove('hidden');
      clearInterval(timerInterval);
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (timerDays) timerDays.textContent = String(days).padStart(2, '0');
    if (timerHours) timerHours.textContent = String(hours).padStart(2, '0');
    if (timerMinutes) timerMinutes.textContent = String(minutes).padStart(2, '0');
    if (timerSeconds) timerSeconds.textContent = String(seconds).padStart(2, '0');
  }
  
  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}

// ==========================================================================
// 5. マップ描画 ＆ パン・ズーム操作
// ==========================================================================
function initMapPins() {
  // data.js のサークルデータに基づいてピンをSVG内に動的に生成配置
  circlesData.forEach(circle => {
    const pinDef = pinDefinitions[circle.mapPinId];
    if (!pinDef) return;
    
    const pinsContainer = document.getElementById(`pins-${pinDef.floor}`);
    if (!pinsContainer) return;
    
    // ピンのSVGグループを作成
    const pinGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pinGroup.setAttribute("class", "map-pin");
    pinGroup.setAttribute("id", `pin-el-${circle.id}`);
    pinGroup.setAttribute("data-circle-id", circle.id);
    
    // 波打つアニメーション用パルス円
    const pulseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pulseCircle.setAttribute("class", "pin-pulse");
    pulseCircle.setAttribute("cx", pinDef.x);
    pulseCircle.setAttribute("cy", pinDef.y);
    pulseCircle.setAttribute("r", 8);
    pulseCircle.setAttribute("fill", "#8C3A43");
    pulseCircle.setAttribute("opacity", "0");
    
    // ピンのマーカー本体（ティアドロップ型）
    const pinMarker = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pinMarker.setAttribute("class", "pin-marker");
    // x, y を基準とするパス。上が太く下が尖ったピン形状
    const pathD = `M ${pinDef.x},${pinDef.y} c -6,-6 -10,-10 -10,-16 a 10,10 0 1 1 20,0 c 0,6 -4,10 -10,16 z`;
    pinMarker.setAttribute("d", pathD);
    pinMarker.setAttribute("fill", "#3A5F53");
    pinMarker.setAttribute("stroke", "#FFFFFF");
    pinMarker.setAttribute("stroke-width", "2");
    
    // マーカー中央の白丸
    const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    innerCircle.setAttribute("cx", pinDef.x);
    innerCircle.setAttribute("cy", pinDef.y - 16);
    innerCircle.setAttribute("r", 3.5);
    innerCircle.setAttribute("fill", "#FFFFFF");
    
    pinGroup.appendChild(pulseCircle);
    pinGroup.appendChild(pinMarker);
    pinGroup.appendChild(innerCircle);
    
    // ピンのクリックイベント
    pinGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      showMapPreview(circle.id);
    });
    
    pinsContainer.appendChild(pinGroup);
  });
}

function initMapPanZoom() {
  const viewport = document.getElementById('map-viewport');
  const container = document.getElementById('map-pan-zoom-container');
  
  if (!viewport || !container) return;
  
  // ドラッグ＆スワイプ移動
  viewport.addEventListener('mousedown', startDrag);
  viewport.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
  
  viewport.addEventListener('touchstart', startDrag, { passive: false });
  viewport.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', endDrag);
  
  // 拡大・縮小ボタンの紐付け
  document.getElementById('btn-zoom-in').addEventListener('click', () => zoom(1.3));
  document.getElementById('btn-zoom-out').addEventListener('click', () => zoom(0.7));
  document.getElementById('btn-map-reset').addEventListener('click', resetMapTransform);
  
  // マップ外タップでプレビューを閉じる
  viewport.addEventListener('click', (e) => {
    if (e.target.closest('.map-pin') === null) {
      hideMapPreview();
    }
  });
  
  // ピンチイン・ピンチアウトの変数
  let touchStartDist = 0;
  
  function startDrag(e) {
    if (e.touches && e.touches.length === 2) {
      // ピンチズーム開始
      touchStartDist = getTouchDistance(e.touches);
      return;
    }
    
    state.mapIsDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    state.mapStartX = clientX - state.mapTranslateX;
    state.mapStartY = clientY - state.mapTranslateY;
    
    if (e.cancelable) e.preventDefault();
  }
  
  function drag(e) {
    if (!state.mapIsDragging) {
      if (e.touches && e.touches.length === 2) {
        // ピンチズーム中
        if (e.cancelable) e.preventDefault();
        const dist = getTouchDistance(e.touches);
        if (touchStartDist > 0) {
          const factor = dist / touchStartDist;
          zoom(factor, true);
          touchStartDist = dist;
        }
      }
      return;
    }
    
    if (e.cancelable) e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    state.mapTranslateX = clientX - state.mapStartX;
    state.mapTranslateY = clientY - state.mapStartY;
    
    applyMapTransform();
  }
  
  function endDrag() {
    state.mapIsDragging = false;
    touchStartDist = 0;
  }
  
  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

function applyMapTransform() {
  const container = document.getElementById('map-pan-zoom-container');
  if (container) {
    container.style.transform = `translate(${state.mapTranslateX}px, ${state.mapTranslateY}px) scale(${state.mapScale})`;
  }
}

function zoom(factor, isRelative = false) {
  // 拡大縮小の境界制限 (0.6倍 〜 4倍)
  let newScale = isRelative ? state.mapScale * factor : state.mapScale * factor;
  if (factor > 1) {
    newScale = Math.min(newScale, 4.0);
  } else {
    newScale = Math.max(newScale, 0.6);
  }
  
  // ズーム中心を調整（簡易的に中心基準）
  state.mapScale = newScale;
  applyMapTransform();
}

function resetMapTransform() {
  state.mapScale = 1;
  state.mapTranslateX = 0;
  state.mapTranslateY = 0;
  applyMapTransform();
}

// フロア切り替え
function changeMapFloor(floorId) {
  state.mapFloor = floorId;
  
  // 1. ボタン切り替え
  document.querySelectorAll('.floor-selector-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-floor-${floorId}`).classList.add('active');
  
  // 2. SVGレイアウトの表示切り替え（フェードアウトさせてから切り替えてフェードイン）
  const groups = {
    'hall': document.getElementById('map-floor-hall'),
    '1f': document.getElementById('map-floor-1f'),
    '2f': document.getElementById('map-floor-2f')
  };
  
  Object.keys(groups).forEach(key => {
    if (key === floorId) {
      groups[key].classList.remove('hidden');
    } else {
      groups[key].classList.add('hidden');
    }
  });
  
  // フロアが変わったら位置をリセット
  resetMapTransform();
  hideMapPreview();
}

// ピン連動：マップ用詳細プレビュー表示
function showMapPreview(circleId) {
  const circle = circlesData.find(c => c.id === circleId);
  if (!circle) return;
  
  state.selectedPinCircleId = circleId;
  
  // すべてのピンのactive解除し、対象ピンをactiveに
  document.querySelectorAll('.map-pin').forEach(el => el.classList.remove('active'));
  const pinEl = document.getElementById(`pin-el-${circleId}`);
  if (pinEl) pinEl.classList.add('active');
  
  // カード内容の流し込み
  const previewCard = document.getElementById('map-preview-card');
  const previewImg = document.getElementById('preview-img');
  const previewLoc = document.getElementById('preview-loc');
  const previewName = document.getElementById('preview-name');
  const previewTitle = document.getElementById('preview-title');
  const detailsBtn = document.getElementById('preview-details-btn');
  
  if (previewImg) previewImg.src = circle.image || 'images/icon-512.jpg';
  if (previewLoc) previewLoc.textContent = circle.location;
  if (previewName) previewName.textContent = circle.name;
  if (previewTitle) previewTitle.textContent = circle.title;
  
  // ボタンイベント（アコーディオンへ飛ぶ）
  if (detailsBtn) {
    detailsBtn.onclick = () => {
      jumpToCircleAccordion(circleId);
    };
  }
  
  if (previewCard) previewCard.classList.remove('hidden');
}

function hideMapPreview() {
  state.selectedPinCircleId = null;
  document.querySelectorAll('.map-pin').forEach(el => el.classList.remove('active'));
  const previewCard = document.getElementById('map-preview-card');
  if (previewCard) previewCard.classList.add('hidden');
}

// ==========================================================================
// 6. サークル企画一覧 (Circles タブ)
// ==========================================================================
function initCirclesList() {
  const container = document.getElementById('circles-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  circlesData.forEach((circle, index) => {
    const indexStr = String(index + 1).padStart(2, '0');
    
    const item = document.createElement('div');
    item.className = 'circle-accordion-item';
    item.id = `circle-accordion-${circle.id}`;
    
    item.innerHTML = `
      <button class="circle-accordion-header" onclick="toggleCircleAccordion('${circle.id}')">
        <div class="circle-header-left">
          <span class="circle-number">${indexStr}</span>
          <span class="circle-list-name">${circle.name}</span>
          <span class="circle-list-loc">${circle.location}</span>
        </div>
        <span class="circle-arrow">∨</span>
      </button>
      <div class="circle-accordion-content">
        <div class="circle-accordion-inner">
          <img src="${circle.image}" alt="${circle.name}" class="circle-detail-image">
          <h4 class="circle-detail-title">${circle.title}</h4>
          <p class="circle-detail-desc">${circle.description}</p>
          <button class="btn-primary circle-detail-map-btn" onclick="focusOnMapPin('${circle.id}')">
            📍 マップで場所を確認する
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(item);
  });
}

function toggleCircleAccordion(circleId) {
  const el = document.getElementById(`circle-accordion-${circleId}`);
  if (!el) return;
  
  const isOpen = el.classList.contains('open');
  
  // 他のすべてのアコーディオンを閉じる（すっきりアコーディオン仕様）
  document.querySelectorAll('.circle-accordion-item').forEach(item => {
    item.classList.remove('open');
  });
  
  if (!isOpen) {
    el.classList.add('open');
  }
}

// サークルタブのアコーディオンへジャンプして開く
function jumpToCircleAccordion(circleId) {
  switchTab('circles');
  
  // アコーディオンを開く
  setTimeout(() => {
    document.querySelectorAll('.circle-accordion-item').forEach(item => {
      item.classList.remove('open');
    });
    
    const targetItem = document.getElementById(`circle-accordion-${circleId}`);
    if (targetItem) {
      targetItem.classList.add('open');
      // スムーズスクロール
      targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// サークル詳細からマップピンへ移動して強調表示する
function focusOnMapPin(circleId) {
  const circle = circlesData.find(c => c.id === circleId);
  if (!circle) return;
  
  const pinDef = pinDefinitions[circle.mapPinId];
  if (!pinDef) return;
  
  // 1. マップの該当フロアに切り替え
  changeMapFloor(pinDef.floor);
  
  // 2. マップタブへ切り替え
  switchTab('map');
  
  // 3. マップをピン位置に合わせてズームイン・センタリング
  // SVG viewportサイズ: 800x600。中心は400, 300
  // svg_map自体がCSSで拡大縮小されるため、コンテナの移動量を計算
  setTimeout(() => {
    const scale = 1.8;
    const viewWidth = document.getElementById('map-viewport').clientWidth;
    const viewHeight = document.getElementById('map-viewport').clientHeight;
    
    // SVGの中心(400, 300)に対するピンの位置差分
    // SVG座標比率を換算する (SVG解像度は幅800, 高さ600にアスペクト比固定される)
    // 画面サイズに対するSVGの表示倍率
    const svgDisplayWidth = viewWidth; 
    const svgDisplayHeight = (600 / 800) * svgDisplayWidth; // アスペクト比3:4
    
    // ピンのSVG内座標比率
    const ratioX = pinDef.x / 800;
    const ratioY = pinDef.y / 600;
    
    // ピンの表示上のピクセル座標
    const pinPixelX = ratioX * svgDisplayWidth;
    const pinPixelY = ratioY * svgDisplayHeight;
    
    state.mapScale = scale;
    // センタリング移動量の算出: (ビューの中心) - (拡大後のピン座標)
    state.mapTranslateX = (viewWidth / 2) - (pinPixelX * scale);
    state.mapTranslateY = (viewHeight / 2) - (pinPixelY * scale);
    
    applyMapTransform();
    
    // 4. ピンを強調表示＆プレビュー表示
    showMapPreview(circleId);
  }, 200);
}

// ==========================================================================
// 7. タイムスケジュール (Schedule タブ) & NOW判定
// ==========================================================================
function initScheduleList() {
  const container = document.getElementById('timeline-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  scheduleData.forEach((sched, index) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.id = `schedule-item-${index}`;
    
    // サークルリンクの有無判定
    let footerHtml = '';
    if (sched.circleId) {
      const circle = circlesData.find(c => c.id === sched.circleId);
      if (circle) {
        footerHtml = `
          <div class="timeline-footer">
            <span class="timeline-location">${sched.location}</span>
            <span class="timeline-circle-link">🔗 ${circle.name} の詳細</span>
          </div>
        `;
      }
    } else {
      footerHtml = `
        <div class="timeline-footer">
          <span class="timeline-location">${sched.location}</span>
        </div>
      `;
    }
    
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card" onclick="onScheduleCardClick('${sched.circleId}')">
        <div class="timeline-header">
          <span class="timeline-time">${sched.time}</span>
          <span class="timeline-badge-now">● NOW</span>
        </div>
        <div class="timeline-title">${sched.title}</div>
        ${footerHtml}
      </div>
    `;
    
    container.appendChild(item);
  });
}

function onScheduleCardClick(circleId) {
  if (circleId) {
    jumpToCircleAccordion(circleId);
  }
}

// 時刻文字列 (例 "10:00 - 10:30") をパースし、開始分・終了分を配列で返す
function parseScheduleTime(timeStr) {
  const parts = timeStr.split('-');
  if (parts.length !== 2) return [0, 0];
  
  const parseStr = (s) => {
    const timeParts = s.trim().split(':');
    if (timeParts.length !== 2) return 0;
    return parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
  };
  
  return [parseStr(parts[0]), parseStr(parts[1])];
}

// スケジュールの現在進行中の項目をハイライト更新
function updateScheduleStatus() {
  let currentMinutes = 0;
  
  if (state.simulatedTimeActive) {
    currentMinutes = state.simulatedTimeMinutes;
  } else {
    // 実システム時刻を使用
    const now = new Date();
    
    // イベント当日は 2026/12/25
    // 日付が一致しない場合は動作確認しやすいよう「11:00」をダミーの現在時刻とする
    const isEventDay = (now.getFullYear() === 2026 && (now.getMonth() + 1) === 12 && now.getDate() === 25);
    
    if (isEventDay) {
      currentMinutes = now.getHours() * 60 + now.getMinutes();
    } else {
      // イベント日ではない場合は、便宜上11:00 (660分) とみなしてハイライト確認を可能にする
      currentMinutes = now.getHours() * 60 + now.getMinutes();
      // もし9:00〜17:00の範囲外なら、動作確認用に11:00固定にする
      if (currentMinutes < 540 || currentMinutes > 1020) {
        currentMinutes = 660; 
      }
    }
  }
  
  // スケジュールデータそれぞれについて判定
  scheduleData.forEach((sched, index) => {
    const el = document.getElementById(`schedule-item-${index}`);
    if (!el) return;
    
    const [startMin, endMin] = parseScheduleTime(sched.time);
    
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      el.classList.add('now');
    } else {
      el.classList.remove('now');
    }
  });
}

// ==========================================================================
// 8. デモ時間シミュレーター
// ==========================================================================
function initTimeSimulator() {
  const toggle = document.getElementById('demo-time-toggle');
  const slider = document.getElementById('demo-time-slider');
  const display = document.getElementById('demo-time-display');
  const controls = document.getElementById('simulator-controls');
  
  if (!toggle || !slider || !display) return;
  
  // トグル切り替え
  toggle.addEventListener('change', (e) => {
    state.simulatedTimeActive = e.target.checked;
    if (state.simulatedTimeActive) {
      controls.classList.remove('hidden');
      updateFromSlider();
    } else {
      controls.classList.add('hidden');
      updateScheduleStatus();
    }
  });
  
  // スライダー変更
  slider.addEventListener('input', updateFromSlider);
  
  function updateFromSlider() {
    const val = parseInt(slider.value);
    state.simulatedTimeMinutes = val;
    
    // 時刻表示文字列の生成
    const h = Math.floor(val / 60);
    const m = val % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    display.textContent = timeStr;
    
    updateScheduleStatus();
  }
}

// ==========================================================================
// 9. お問い合わせ・ご案内 (Info タブ) Accordion
// ==========================================================================
function toggleInfoAccordion(headerBtn) {
  const parent = headerBtn.closest('.info-accordion-item');
  if (!parent) return;
  
  const isOpen = parent.classList.contains('open');
  
  // アコーディオンの開閉を切り替え
  if (isOpen) {
    parent.classList.remove('open');
  } else {
    // 他を開いたままにするか閉じるかは好みですが、ここではすっきりするために他を閉じます
    document.querySelectorAll('.info-accordion-item').forEach(item => {
      item.classList.remove('open');
    });
    parent.classList.add('open');
  }
}
