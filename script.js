/* ==========================================================
   Body Scent — script.js (shared by every page)
   Each feature runs only if its page elements exist:
   - product.html : #filter-bar, #product-list
   - order.html   : #orderForm, #customerName, #contact, #items, #total, #note
   - admin.html   : #ordersTable tbody
   ========================================================== */

/* ---------- Config ---------- */
var ORDER_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyIyiGm7rC_EPFluQi6SV4q4Sf4XXESC_gOZBan7xM_nCsYYMbQrOk_lCs_D2LyGhxjrA/exec';

var ORDERS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT1sRSatohaOWduUDWlFfU9XHRkgVCu218qNjE2bb-3UPxHcdyU2AWGM1KZkip_tHux2fUjdUtqDaR_/pub?gid=0&single=true&output=csv';

var MOODS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'fresh', label: 'Fresh' },
  { key: 'sweet', label: 'Sweet' },
  { key: 'confident', label: 'Confident' },
  { key: 'romance', label: 'Romance' }
];

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('product-list')) initProductPage();
  if (document.getElementById('orderForm')) initOrderPage();
  if (document.querySelector('#ordersTable tbody')) initAdminPage();
});

/* ==========================================================
   1) product.html
   ========================================================== */
function initProductPage() {
  var list = document.getElementById('product-list');
  var bar = document.getElementById('filter-bar');

  fetch('products.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (products) {
      renderProducts(list, products);
      renderFilterBar(bar, list);

      // Auto-filter from ?mood=xxx
      var mood = new URLSearchParams(window.location.search).get('mood');
      applyFilter(bar, list, isValidMood(mood) ? mood : 'all');
    })
    .catch(function (error) {
      console.error(error);
      list.textContent = 'ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง';
    });
}

function isValidMood(mood) {
  return MOODS.some(function (m) { return m.key === mood; });
}

function renderProducts(list, products) {
  list.textContent = '';

  products.forEach(function (p) {
    var card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-mood', p.mood);

    // image
    var media = document.createElement('div');
    media.className = 'product-media';
    var img = document.createElement('img');
    img.src = p.image;
    img.alt = p.name;
    img.loading = 'lazy';
    media.appendChild(img);

    // meta: mood dot + size (roll-on has no size)
    var meta = document.createElement('div');
    meta.className = 'product-meta';
    var dot = document.createElement('span');
    dot.className = 'mood-dot';
    var sizeText = document.createElement('span');
    sizeText.textContent = p.size ? p.size : (p.type === 'rollon' ? 'โรลออน' : '');
    meta.appendChild(dot);
    meta.appendChild(sizeText);

    // name
    var name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = p.name;

    // footer: price + order button
    var foot = document.createElement('div');
    foot.className = 'product-foot';

    var price = document.createElement('span');
    price.className = 'price';
    price.appendChild(document.createTextNode(String(p.price)));
    var unit = document.createElement('small');
    unit.textContent = 'บาท';
    price.appendChild(unit);

    var btn = document.createElement('a');
    btn.className = 'btn btn--small';
    btn.textContent = 'สั่งซื้อ';
    btn.href =
      'order.html?item=' + encodeURIComponent(p.name) +
      '&price=' + encodeURIComponent(p.price);

    foot.appendChild(price);
    foot.appendChild(btn);

    card.appendChild(media);
    card.appendChild(meta);
    card.appendChild(name);
    card.appendChild(foot);
    list.appendChild(card);
  });
}

function renderFilterBar(bar, list) {
  if (!bar) return;
  bar.textContent = '';

  MOODS.forEach(function (m) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.textContent = m.label;
    btn.setAttribute('data-filter', m.key);
    btn.addEventListener('click', function () {
      applyFilter(bar, list, m.key);
    });
    bar.appendChild(btn);
  });
}

function applyFilter(bar, list, mood) {
  var cards = list.querySelectorAll('.product-card');
  Array.prototype.forEach.call(cards, function (card) {
    card.hidden = !(mood === 'all' || card.getAttribute('data-mood') === mood);
  });

  if (bar) {
    var buttons = bar.querySelectorAll('.filter-btn');
    Array.prototype.forEach.call(buttons, function (b) {
      var active = b.getAttribute('data-filter') === mood;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
}

/* ==========================================================
   2) order.html
   ========================================================== */
function initOrderPage() {
  var form = document.getElementById('orderForm');
  var params = new URLSearchParams(window.location.search);

  // Fill BOTH #items and #total from the URL
  var item = params.get('item');
  var price = params.get('price');
  var itemsField = document.getElementById('items');
  var totalField = document.getElementById('total');

  if (item !== null && itemsField) itemsField.value = item;
  if (price !== null && totalField) totalField.value = price;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var payload = {
      customerName: valueOf('customerName'),
      contact: valueOf('contact'),
      items: valueOf('items'),
      total: valueOf('total'),
      note: valueOf('note')
    };

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    fetch(ORDER_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(() => { window.location.href = 'thankyou.html'; })
    .catch(error => {
      console.error(error);
      if (submitBtn) submitBtn.disabled = false;
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    });
  });
}

function valueOf(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* ==========================================================
   3) admin.html
   ========================================================== */
function initAdminPage() {
  var tbody = document.querySelector('#ordersTable tbody');
  var COLUMNS = 6; // date, name, contact, items, total, note

  showMessageRow(tbody, COLUMNS, 'กำลังโหลดข้อมูล...');

  fetch(ORDERS_CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text);

      // drop header row and fully empty rows
      var data = rows.slice(1).filter(function (row) {
        return row.some(function (cell) { return cell.trim() !== ''; });
      });

      // Sheet rows are appended in time order, so reverse = newest first
      data.reverse();

      if (data.length === 0) {
        showMessageRow(tbody, COLUMNS, 'ยังไม่มีรายการสั่งซื้อ');
        return;
      }

      tbody.textContent = '';
      data.forEach(function (row) {
        var tr = document.createElement('tr');
        for (var i = 0; i < COLUMNS; i++) {
          var td = document.createElement('td');
          td.textContent = row[i] !== undefined ? row[i] : '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    })
    .catch(function (error) {
      console.error(error);
      showMessageRow(tbody, COLUMNS, 'ไม่สามารถโหลดข้อมูลได้ กรุณารีเฟรชหน้าอีกครั้ง');
    });
}

function showMessageRow(tbody, colspan, message) {
  tbody.textContent = '';
  var tr = document.createElement('tr');
  var td = document.createElement('td');
  td.colSpan = colspan;
  td.textContent = message;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

/* Minimal CSV parser (RFC 4180 style, no external library).
   Handles quoted fields, commas and line breaks inside quotes,
   escaped quotes (""), CRLF / LF line endings, and a leading BOM. */
function parseCSV(text) {
  var rows = [];
  var row = [];
  var field = '';
  var inQuotes = false;
  var i = 0;

  if (text.charCodeAt(0) === 0xFEFF) i = 1; // strip BOM

  for (; i < text.length; i++) {
    var ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++; // CRLF
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  // last field / row without trailing newline
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
