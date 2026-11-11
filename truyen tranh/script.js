// ============================================================
//  CHUYỆN VỀ BÁC — cuốn truyện tranh lật từng trang
//  Nội dung vẫn nằm trong index.html. Tệp này:
//   1) tạo nét vẽ tay cho tranh
//   2) chia các chương thành từng trang giấy
//   3) đóng thành sách và lo việc lật trang
// ============================================================

// ---------- 1) Tách mỗi bức tranh thành hai lớp: màu nước loang + nét mực run tay ----------
// Trên điện thoại, máy tính bảng thì bỏ qua bước này: bộ lọc vẽ tay rất tốn bộ nhớ, dễ làm trình duyệt bị treo.
var MAY_NHE = (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) ||
  Math.min(screen.width, screen.height) < 700;
if (!MAY_NHE) document.querySelectorAll('svg.tranh').forEach(function (svg) {
  var ns = 'http://www.w3.org/2000/svg';
  var mau = document.createElementNS(ns, 'g');
  while (svg.firstChild) mau.appendChild(svg.firstChild);
  var net = mau.cloneNode(true);
  mau.setAttribute('class', 'lop-mau'); mau.setAttribute('filter', 'url(#mau)');
  net.setAttribute('class', 'lop-net'); net.setAttribute('filter', 'url(#net)');
  svg.appendChild(mau); svg.appendChild(net);
});

(function () {
  var RONG = 640, CAO = 940;        // kích thước thiết kế của một trang giấy
  var CAO_RUOT = 860, HO = 16;      // chiều cao phần chứa nội dung, khoảng hở giữa các khối
  var goc = document.documentElement;
  goc.classList.add('co-sach');

  function tao(the, lop, html) {
    var e = document.createElement(the);
    if (lop) e.className = lop;
    if (html) e.innerHTML = html;
    return e;
  }
  var HOA_SEN = '<svg class="hoa" viewBox="-36 -60 72 66" aria-hidden="true"><use href="#sen" class="hong"/></svg>';

  // ---------- 2) Chia nội dung thành các trang ----------
  var cacTrang = [];      // mỗi phần tử: { ruot: phần tử .ruot, bia: có phải bìa không }
  var batDau = {};        // id chương -> số thứ tự trang bắt đầu

  // khuôn đo: đặt thử từng khối vào để biết nó cao bao nhiêu
  var khuonDo = tao('div', 'ruot do');
  document.body.appendChild(khuonDo);

  function chuanBiKhoi(khoi, thuTu) {
    if (khoi.classList.contains('khung') && !khoi.classList.contains('rong')) {
      khoi.classList.add('ngang');                      // tranh nhỏ: tranh một bên, lời kể một bên
      if (thuTu % 2) khoi.classList.add('dao');
      var thoai = khoi.querySelector('.thoai');
      if (thoai) {                                      // lời Bác đưa ra cạnh tranh cho dễ đọc
        thoai.classList.add('ben');
        var chuThich = khoi.querySelector('figcaption');
        chuThich.insertBefore(thoai, chuThich.firstChild);
      }
    }
    return khoi;
  }

  // chia một dãy khối thành ít trang nhất, các trang đầy đều nhau nhất
  function chiaDeu(khoi) {
    khoi.forEach(function (k) { khuonDo.appendChild(k); });
    var cao = khoi.map(function (k) { return k.offsetHeight; });
    var n = khoi.length, totNhat = null;
    function laTieuDe(k) { return k.tagName === 'HEADER' || k.tagName === 'H3'; }
    for (var mat = 0; mat < (1 << (n - 1)); mat++) {     // mỗi bit = có ngắt trang sau khối i hay không
      var nhom = [[]], hopLe = true, lonNhat = 0;
      for (var i = 0; i < n; i++) {
        nhom[nhom.length - 1].push(i);
        if (i < n - 1 && (mat >> i) & 1) { if (laTieuDe(khoi[i])) hopLe = false; nhom.push([]); }
      }
      nhom.forEach(function (g) {
        var tong = g.reduce(function (s, j) { return s + cao[j]; }, 0) + HO * (g.length - 1);
        if (tong > CAO_RUOT && g.length > 1) hopLe = false;
        lonNhat = Math.max(lonNhat, tong);
      });
      if (!hopLe) continue;
      if (!totNhat || nhom.length < totNhat.nhom.length ||
          (nhom.length === totNhat.nhom.length && lonNhat < totNhat.lonNhat)) {
        totNhat = { nhom: nhom, lonNhat: lonNhat };
      }
    }
    return totNhat.nhom.map(function (g) {
      var ruot = tao('div', 'ruot');
      var tong = 0;
      g.forEach(function (j) { ruot.appendChild(khoi[j]); tong += cao[j]; });
      var du = CAO_RUOT - tong - HO * (g.length - 1);
      var hinh = g.filter(function (j) { return khoi[j].classList.contains('khung'); });
      var nho = hinh.filter(function (j) { return khoi[j].classList.contains('ngang'); });
      // trang còn rộng chỗ thì cho tranh và chữ to hơn (soatTrang sẽ kiểm tra lại cho chắc)
      if (hinh.length && nho.length === hinh.length && du > 62 * nho.length + 20) ruot.classList.add('lon');
      if (hinh.length === 1 && !nho.length && g.length <= 2) {
        ruot.classList.add('mot');
        if (g.length === 1) ruot.insertAdjacentHTML('beforeend', HOA_SEN);
      }
      return ruot;
    });
  }

  function dungTrang() {
    // --- bìa trước ---
    var bia = tao('div', 'ruot');
    var biaCu = document.querySelector('.bia-giay');
    while (biaCu.firstChild) bia.appendChild(biaCu.firstChild);
    var nutMo = bia.querySelector('.nut');
    if (nutMo) { nutMo.textContent = 'Mở sách'; nutMo.setAttribute('href', '#mo'); }
    cacTrang.push({ ruot: bia, bia: true });

    // --- trang tên sách + cách đọc ---
    cacTrang.push({ ruot: tao('div', 'ruot giua',
      HOA_SEN + '<p class="ten-sach">Chuyện về Bác</p><hr class="gach-ngang">' +
      '<p>Truyện tranh lịch sử gồm 10 chương<br>1890 – 1969</p>' +
      '<p class="cach-doc"><b>Cách đọc</b>Bấm vào trang bên phải để lật tới, trang bên trái để lật lui. ' +
      'Bạn cũng có thể nắm trang giấy mà kéo, vuốt trên điện thoại, hoặc dùng phím ← →.</p>') });

    // --- trang mục lục (điền sau khi biết số trang) ---
    var mucLuc = tao('div', 'ruot');
    cacTrang.push({ ruot: mucLuc });

    // --- các chương và lời kết ---
    var dsChuong = [];
    document.querySelectorAll('main .chuong').forEach(function (chuong) {
      var than = chuong.querySelector('.trang'), khoi = [], dem = 0;
      Array.prototype.slice.call(than.children).forEach(function (con) {
        if (con.classList.contains('luoi')) {
          Array.prototype.slice.call(con.children).forEach(function (k) { khoi.push(chuanBiKhoi(k, dem++)); });
        } else khoi.push(con);
      });
      batDau[chuong.id] = cacTrang.length;
      var tieuDe = chuong.querySelector('.dau h2'), moc = chuong.querySelector('.dau .moc');
      var so = chuong.querySelector('.dau .so');
      dsChuong.push({ id: chuong.id, so: so ? so.textContent : '', ten: tieuDe.textContent, nam: moc ? moc.textContent : '' });
      chiaDeu(khoi).forEach(function (ruot) { cacTrang.push({ ruot: ruot, danhSo: true }); });
    });

    // --- trang "Hết" và bìa sau; chèn thêm một trang hoa sen nếu tổng số trang bị lẻ ---
    if (cacTrang.length % 2 === 1) cacTrang.push({ ruot: tao('div', 'ruot giua', HOA_SEN) });
    cacTrang.push({ ruot: tao('div', 'ruot giua',
      HOA_SEN + '<p class="het">Hết</p><hr class="gach-ngang"><p>Cảm ơn bạn đã đọc đến trang cuối cùng.</p>' +
      '<a class="nut" href="#bia">Đọc lại từ đầu</a>') });
    var chan = document.querySelector('footer');
    cacTrang.push({ bia: true, ruot: tao('div', 'ruot',
      HOA_SEN + '<p class="phu">' + (chan ? chan.textContent : '') + '</p>' +
      '<p class="tac-gia">Được thực hiện bởi sinh viên Mai Phương Thuý - mã sv 110598 - CNT65NC</p>') });
    cacTrang[cacTrang.length - 1].ruot.style.justifyContent = 'center';

    // --- điền mục lục ---
    var html = '<h2 class="ml-dau">Mục lục</h2><ol class="ml">';
    dsChuong.forEach(function (c) {
      html += '<li><a href="#' + c.id + '"><span class="ten">' + (c.id === 'ket' ? '' : c.so.replace('Chương ', '') + '. ') + c.ten +
        '</span><span class="nam-ml">' + c.nam + '</span><span class="cham-cham"></span><span class="st">' + batDau[c.id] + '</span></a></li>';
    });
    mucLuc.innerHTML = html + '</ol>';
    khuonDo.remove();
  }

  // ---------- 3) Đóng sách ----------
  var mucLucTren = document.querySelector('.muc-luc');
  var san = tao('div', 'san');
  var sach = tao('div', 'sach');
  san.appendChild(sach);
  var thanhDK = tao('div', 'dieu-khien',
    '<button class="lui" type="button">‹ Trước</button><span class="vi-tri" aria-live="polite"></span>' +
    '<button class="toi" type="button">Sau ›</button>' +
    '<button class="tieng phu-tro" type="button" aria-pressed="true">Tiếng giấy: bật</button>' +
    '<button class="toan" type="button">Toàn màn hình</button>');
  mucLucTren.insertAdjacentElement('afterend', san);
  san.insertAdjacentElement('afterend', thanhDK);

  var cacTo = [];       // các tờ giấy
  var daLat = 0;        // số tờ đã lật sang trái
  var cheDoDon = null;  // true: màn hình hẹp, mỗi lần xem một trang
  var tiLe = 1;

  function taoMat(trang, lop, soTrang) {
    var mat = tao('div', 'mat ' + lop + (trang && trang.bia ? ' bia-mat' : ''));
    if (trang) {
      mat.appendChild(trang.ruot);
      if (trang.danhSo) mat.appendChild(tao('span', 'so-trang', String(soTrang)));
    }
    return mat;
  }

  function dongSach(don) {
    var trangDangXem = cheDoDon === null ? 0 : (cheDoDon ? daLat : Math.max(0, 2 * daLat - 1));
    cheDoDon = don;
    sach.innerHTML = '';
    sach.classList.toggle('don', don);
    cacTo = [];
    var buoc = don ? 1 : 2;
    for (var i = 0; i < cacTrang.length; i += buoc) {
      var to = tao('div', 'to');
      to.appendChild(taoMat(cacTrang[i], 'truoc', i));
      to.appendChild(taoMat(don ? null : cacTrang[i + 1], 'sau', i + 1));
      sach.appendChild(to);
      cacTo.push(to);
    }
    daLat = soToCuaTrang(trangDangXem);
    cacTo.forEach(function (to, i) {
      to.style.transition = 'none';
      to.classList.toggle('da-lat', i < daLat);
      xepLop(to, i);
    });
    if (!daSoat) { daSoat = true; soatTrang(); }
    sach.offsetWidth;                                   // buộc trình duyệt vẽ lại rồi mới bật chuyển động
    cacTo.forEach(function (to) { to.style.transition = ''; });
    capNhat();
  }
  var daSoat = false;

  // Chỉ giữ vài tờ quanh chỗ đang đọc, các tờ ở xa thì tạm cất đi cho nhẹ máy
  function cuaSo() {
    cacTo.forEach(function (to, i) {
      var gan = (i >= daLat - 3 && i <= daLat + 2) || to.classList.contains('dang-lat');
      to.style.display = gan ? '' : 'none';
    });
  }

  // sau khi sách đã lên trang: trang nào bị tràn thì bỏ kiểu chữ to, rồi chia đều khoảng hở
  function soatTrang() {
    cacTrang.forEach(function (trang) {
      var ruot = trang.ruot;
      if (trang.bia || ruot.classList.contains('giua') || ruot.querySelector('.ml')) return;
      function tong() {
        var t = 0;
        Array.prototype.forEach.call(ruot.children, function (c) { t += c.offsetHeight; });
        return t + HO * (ruot.children.length - 1);
      }
      if (tong() > CAO_RUOT) ruot.classList.remove('lon');
      if (tong() > CAO_RUOT) ruot.classList.remove('mot');
      var du = CAO_RUOT - tong(), n = ruot.children.length;
      ruot.style.gap = Math.round(Math.max(HO, Math.min(46, HO + du / (n + 1)))) + 'px';
    });
  }

  function soToCuaTrang(p) { return cheDoDon ? Math.min(p, cacTo.length - 1) : Math.ceil(p / 2); }
  function lonNhat() { return cheDoDon ? cacTo.length - 1 : cacTo.length; }
  function xepLop(to, i) { to.style.zIndex = to.classList.contains('da-lat') ? i + 1 : cacTo.length - i; }

  // co giãn cuốn sách cho vừa màn hình
  function canChinh() {
    var w = san.clientWidth, h = san.clientHeight;
    var don = w < 820 || w < h * 1.05;
    if (don !== cheDoDon) dongSach(don);
    var rongSach = don ? RONG : RONG * 2;
    tiLe = Math.min((w - (don ? 16 : 40)) / rongSach, (h - 28) / CAO);
    datViTri();
  }
  function datViTri() {
    var lech = 0;                                       // sách đang gấp thì đưa bìa vào giữa
    if (!cheDoDon) { if (daLat === 0) lech = -RONG / 2; else if (daLat === cacTo.length) lech = RONG / 2; }
    sach.style.transform = 'translateX(' + (lech * tiLe) + 'px) scale(' + tiLe + ')';
  }

  // ---------- lật trang ----------
  var demLat = 0;
  function latDen(dich) {
    dich = Math.max(0, Math.min(lonNhat(), dich));
    if (dich === daLat) return;
    boGoiY();
    var toi = dich > daLat, ds = [];
    if (toi) for (var i = daLat; i < dich; i++) ds.push(i);
    else for (var j = daLat - 1; j >= dich; j--) ds.push(j);
    // nhảy xa: các tờ ở giữa đổi chỗ ngay, chỉ hai tờ cuối lật cho thấy
    while (ds.length > 2) {
      var bo = ds.shift(), toBo = cacTo[bo];
      toBo.style.transition = 'none';
      toBo.classList.toggle('da-lat', toi);
      xepLop(toBo, bo);
      toBo.offsetWidth;
      toBo.style.transition = '';
    }
    var tre = 140;
    ds.forEach(function (i, k) {
      setTimeout(function () {
        var to = cacTo[i];
        if (!to) return;
        to.style.transition = ''; to.style.transform = '';
        to.style.zIndex = 300 + (++demLat);
        to.classList.add('dang-lat');
        to.classList.toggle('da-lat', toi);
        tiengGiay();
        clearTimeout(to._hen);
        to._hen = setTimeout(function () { to.classList.remove('dang-lat'); xepLop(to, i); cuaSo(); }, 900);
      }, k * tre);
    });
    daLat = dich;
    capNhat();
  }

  var nutLui = thanhDK.querySelector('.lui'), nutToi = thanhDK.querySelector('.toi');
  var viTri = thanhDK.querySelector('.vi-tri'), thanhTD = document.querySelector('.tien-do i');
  var lienKet = mucLucTren.querySelectorAll('a');

  function capNhat() {
    datViTri();
    cuaSo();
    var cuoi = cacTrang.length - 1, chu;
    var trai = cheDoDon ? daLat : 2 * daLat - 1, phai = cheDoDon ? daLat : 2 * daLat;
    if (phai === 0) chu = 'Bìa';
    else if (trai >= cuoi) chu = 'Bìa sau';
    else if (cheDoDon) chu = 'Trang ' + daLat + ' / ' + (cuoi - 1);
    else chu = 'Trang ' + trai + (phai < cuoi ? '–' + phai : '') + ' / ' + (cuoi - 1);
    viTri.textContent = chu;
    nutLui.disabled = daLat === 0;
    nutToi.disabled = daLat === lonNhat();
    if (thanhTD) thanhTD.style.width = (daLat / lonNhat() * 100) + '%';
    // tô sáng chương đang đọc trên thanh mục lục
    var dang = null;
    Object.keys(batDau).forEach(function (id) {
      if (batDau[id] <= Math.min(phai, cuoi) && (dang === null || batDau[id] > batDau[dang])) dang = id;
    });
    lienKet.forEach(function (a) {
      var dung = a.getAttribute('href') === '#' + dang;
      a.classList.toggle('dang-doc', dung);
      if (dung) mucLucTren.scrollLeft = a.offsetLeft - mucLucTren.clientWidth / 2 + a.clientWidth / 2;
    });
    try { history.replaceState(null, '', dang ? '#' + dang : location.pathname + location.search); } catch (e) {}
  }

  function boGoiY() { cacTo.forEach(function (t) { t.classList.remove('goi-y'); }); daGoiY = true; }
  var daGoiY = false;

  // ---------- tiếng giấy sột soạt (tự tạo bằng Web Audio, không cần tệp âm thanh) ----------
  var coTieng = true, amThanh = null;
  function tiengGiay() {
    if (!coTieng) return;
    try {
      amThanh = amThanh || new (window.AudioContext || window.webkitAudioContext)();
      if (amThanh.state === 'suspended') amThanh.resume();
      var dai = 0.42, t = amThanh.currentTime;
      var bo = amThanh.createBuffer(1, amThanh.sampleRate * dai, amThanh.sampleRate), d = bo.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random());
      var nguon = amThanh.createBufferSource(); nguon.buffer = bo;
      var loc = amThanh.createBiquadFilter(); loc.type = 'bandpass'; loc.Q.value = 0.8;
      loc.frequency.setValueAtTime(900, t); loc.frequency.exponentialRampToValueAtTime(3200, t + dai * 0.6);
      loc.frequency.exponentialRampToValueAtTime(1400, t + dai);
      var to = amThanh.createGain();
      to.gain.setValueAtTime(0.0001, t); to.gain.exponentialRampToValueAtTime(0.11, t + 0.09);
      to.gain.exponentialRampToValueAtTime(0.03, t + dai * 0.6); to.gain.exponentialRampToValueAtTime(0.0001, t + dai);
      nguon.connect(loc); loc.connect(to); to.connect(amThanh.destination);
      nguon.start(t); nguon.stop(t + dai);
    } catch (e) {}
  }

  // ---------- điều khiển: nút bấm, bàn phím, liên kết ----------
  nutLui.addEventListener('click', function () { latDen(daLat - 1); });
  nutToi.addEventListener('click', function () { latDen(daLat + 1); });
  var nutTieng = thanhDK.querySelector('.tieng');
  nutTieng.addEventListener('click', function () {
    coTieng = !coTieng;
    nutTieng.textContent = (coTieng ? 'Tiếng giấy: bật' : 'Tiếng giấy: tắt');
    nutTieng.setAttribute('aria-pressed', coTieng);
  });
  var nutToan = thanhDK.querySelector('.toan');
  if (!document.documentElement.requestFullscreen) nutToan.style.display = 'none';
  nutToan.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', function () {
    nutToan.textContent = document.fullscreenElement ? 'Thoát toàn màn hình' : 'Toàn màn hình';
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('button,a') && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); latDen(daLat + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); latDen(daLat - 1); }
    else if (e.key === 'Home') latDen(0);
    else if (e.key === 'End') latDen(lonNhat());
  });

  function moTheoDau(dau) {                              // "#c3" -> lật tới chương 3
    var id = dau.replace('#', '');
    if (id === 'mo') { latDen(1); return true; }
    if (id === 'bia') { latDen(0); return true; }
    if (batDau[id] == null) return false;
    latDen(soToCuaTrang(batDau[id]));
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (a && moTheoDau(a.getAttribute('href'))) e.preventDefault();
  });

  // ---------- kéo trang giấy bằng chuột hoặc ngón tay ----------
  var keo = null;
  san.addEventListener('pointerdown', function (e) {
    if (e.button || e.target.closest('a,button')) return;
    var khung = sach.getBoundingClientRect();
    var benPhai = cheDoDon ? true : e.clientX >= khung.left + khung.width / 2;
    keo = { x: e.clientX, benPhai: benPhai, to: null, toi: false, tienDo: 0, rong: RONG * tiLe, trongSach:
      e.clientX >= khung.left && e.clientX <= khung.right && e.clientY >= khung.top && e.clientY <= khung.bottom };
  });
  san.addEventListener('pointermove', function (e) {
    if (!keo) return;
    var dx = e.clientX - keo.x;
    if (!keo.to) {
      if (Math.abs(dx) < 8) return;
      var toi = dx < 0;
      if (!cheDoDon && toi !== keo.benPhai) { keo = null; return; }   // phải kéo trang từ mép ngoài vào gáy
      var chiSo = toi ? daLat : daLat - 1;
      if (chiSo < 0 || chiSo >= cacTo.length || (toi && daLat >= lonNhat())) { keo = null; return; }
      boGoiY();
      keo.to = cacTo[chiSo]; keo.toi = toi; keo.chiSo = chiSo;
      keo.to.style.transition = 'none'; keo.to.style.visibility = 'visible';
      keo.to.style.zIndex = 300 + (++demLat);
      try { san.setPointerCapture(e.pointerId); } catch (err) {}
    }
    var p = Math.max(0, Math.min(1, Math.abs(dx) / (keo.rong * (cheDoDon ? 0.9 : 1.5))));
    if ((dx < 0) !== keo.toi) p = 0;
    keo.tienDo = p;
    keo.to.style.transform = 'rotateY(' + (keo.toi ? -180 * p : -180 + 180 * p) + 'deg)';
  });
  function thaKeo(e) {
    if (!keo) return;
    var k = keo; keo = null;
    if (!k.to) {                                         // không kéo: coi như một cú bấm vào trang
      if (!k.trongSach || e.type === 'pointercancel') return;
      if (cheDoDon) {
        var khung = sach.getBoundingClientRect();
        latDen(daLat + (e.clientX < khung.left + khung.width * 0.3 ? -1 : 1));
      } else latDen(daLat + (k.benPhai ? 1 : -1));
      return;
    }
    var to = k.to, xong = k.tienDo > 0.25;
    to.offsetWidth;
    to.style.transition = ''; to.style.transform = ''; to.style.visibility = '';
    if (xong) {
      to.classList.toggle('da-lat', k.toi);
      daLat += k.toi ? 1 : -1;
      tiengGiay();
      capNhat();
    }
    clearTimeout(to._hen);
    to._hen = setTimeout(function () { xepLop(to, k.chiSo); }, 900);
  }
  san.addEventListener('pointerup', thaKeo);
  san.addEventListener('pointercancel', thaKeo);

  // ---------- khởi động ----------
  function batDauChay() {
    var dauBanDau = location.hash.slice(1);         // nhớ lại #c3... trước khi sách tự cập nhật địa chỉ
    dungTrang();
    canChinh();
    window.addEventListener('resize', canChinh);
    if (dauBanDau && batDau[dauBanDau] != null) {
      daLat = soToCuaTrang(batDau[dauBanDau]);
      cacTo.forEach(function (to, i) {
        to.style.display = ''; to.style.transition = 'none'; to.classList.toggle('da-lat', i < daLat); xepLop(to, i);
      });
      sach.offsetWidth;
      cacTo.forEach(function (to) { to.style.transition = ''; });
      capNhat();
    } else if (cacTo[0]) cacTo[0].classList.add('goi-y');   // bìa hé nhẹ, mời người đọc mở sách
  }
  // chờ phông chữ tải xong rồi mới đo và chia trang (tối đa 1,5 giây)
  var daChay = false;
  function chay() { if (!daChay) { daChay = true; batDauChay(); } }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(chay); setTimeout(chay, 1500); }
  else chay();
})();
