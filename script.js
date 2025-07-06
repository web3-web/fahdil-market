// File: script.js - Ultimate Stable Version

(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // 1. Storage fallback
    var storage;
    try {
      storage = window.localStorage;
    } catch (e) {
      storage = {
        _data: {},
        getItem: function(key) { return this._data[key] || null; },
        setItem: function(key, value) { this._data[key] = value; }
      };
    }

    // 2. Helpers
    function load(key) {
      try {
        return JSON.parse(storage.getItem(key)) || [];
      } catch (e) {
        return [];
      }
    }
    function save(key, data) {
      try {
        storage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    }

    // 3. Data initialization
    var produk   = load('produk');
    var keranjang= load('keranjang');
    var wishlist = load('wishlist');
    var riwayat  = load('riwayat');
    var vouchers = load('vouchers');
    var lastOrder = [];
    var loginData = (function() {
      try {
        return JSON.parse(storage.getItem('loginData'));
      } catch (e) {
        return null;
      }
    })() || {
      pemilik: { user: 'FAHDiL', pass: 'WEB ADMIN.1' },
      owner:   { user: 'OWNERKU', pass: 'OWNER MASUK 1' }
    };
    var userLogin = null;

    // 4. Sidebar toggle
    var sidebar   = document.getElementById('sidebar');
    var toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('active');
      });
    }

    // 5. Update sidebar menu items
    function updateMenu() {
      var adminPages = ['tambah','dashboard','voucher','pengaturan','struk'];
      var items = document.querySelectorAll('nav.sidebar ul li[data-page]');
      for (var i = 0; i < items.length; i++) {
        var li = items[i];
        var page = li.getAttribute('data-page');
        if (adminPages.indexOf(page) !== -1) {
          li.style.display = userLogin ? 'block' : 'none';
        }
        if (page === 'login-pemilik' || page === 'login-owner') {
          li.style.display = userLogin ? 'none' : 'block';
        }
      }
    }

    // 6. Page navigation
    window.showPage = function(id) {
      var secs = document.querySelectorAll('.halaman');
      for (var i = 0; i < secs.length; i++) secs[i].classList.remove('active');
      var sec = document.getElementById(id);
      if (sec) sec.classList.add('active');
      if (sidebar) sidebar.classList.remove('active');
      updateMenu();
      // Dispatch render calls
      if (id === 'produk')    renderProduk();
      if (id === 'keranjang') renderKeranjang();
      if (id === 'wishlist')  renderWishlist();
      if (id === 'riwayat')   renderRiwayat();
      if (id === 'voucher')   renderVoucher();
      if (id === 'dashboard') updateDashboard();
    };

    // 7. Login / Logout
    window.login = function(role) {
      var u = document.getElementById(role + 'User').value;
      var p = document.getElementById(role + 'Pass').value;
      if (loginData[role] && u === loginData[role].user && p === loginData[role].pass) {
        userLogin = role;
        save('loginData', loginData);
        alert('Login berhasil sebagai ' + role);
        showPage('dashboard');
      } else {
        alert('Login gagal');
      }
    };
    window.logout = function() {
      userLogin = null;
      alert('Logout berhasil');
      showPage('produk');
    };

    // 8. Render product list
    window.renderProduk = function() {
      var c = document.getElementById('produkContainer');
      if (!c) return;
      c.innerHTML = '';
      for (var i = 0; i < produk.length; i++) {
        var p = produk[i];
        var card = document.createElement('div');
        card.className = 'produk-card';
        card.innerHTML =
          '<img src="' + p.gambar + '" alt="' + p.nama + '" />' +
          '<h3>' + p.nama + '</h3>' +
          '<p>Rp' + p.harga.toLocaleString() + '</p>' +
          '<p>Stok: ' + p.stok + '</p>' +
          '<p>Kategori: ' + p.kategori + '</p>' +
          '<button onclick="tambahKeranjang(' + i + ')" class="btn warna-warni">Beli</button>' +
          '<button onclick="tambahWishlist(' + i + ')" class="btn">❤️</button>' +
          (userLogin ? '<button onclick="editProduk(' + i + ')" class="btn">✏️ Edit</button>' : '');
        c.appendChild(card);
      }
    };

    // 9. Add / Edit Produk
    var formTambah = document.getElementById('formTambah');
    if (formTambah) {
      formTambah.addEventListener('submit', function(e) {
        e.preventDefault();
        var n = document.getElementById('namaProduk').value;
        var h = parseInt(document.getElementById('hargaProduk').value) || 0;
        var s = parseInt(document.getElementById('stokProduk').value) || 0;
        var k = document.getElementById('kategoriProduk').value;
        var f = document.getElementById('gambarProduk').files[0];
        if (!n || !f) { alert('Nama & gambar wajib diisi'); return; }
        var reader = new FileReader();
        reader.onload = function() {
          produk.push({ nama: n, harga: h, stok: s, kategori: k, gambar: reader.result });
          save('produk', produk);
          alert('Produk disimpan');
          renderProduk();
          showPage('produk');
        };
        reader.readAsDataURL(f);
      });
    }
    window.editProduk = function(i) {
      var p = produk[i];
      if (!p) return;
      document.getElementById('namaProduk').value    = p.nama;
      document.getElementById('hargaProduk').value   = p.harga;
      document.getElementById('stokProduk').value    = p.stok;
      document.getElementById('kategoriProduk').value= p.kategori;
      produk.splice(i,1);
      save('produk', produk);
      showPage('tambah');
    };

    // 10. Keranjang, Wishlist, Riwayat
    window.tambahKeranjang = function(i) {
      keranjang.push(produk[i]);
      save('keranjang', keranjang);
      alert('Ditambahkan ke keranjang');
    };
    window.renderKeranjang = function() {
      var c = document.getElementById('keranjangContainer');
      if (!c) return;
      c.innerHTML = '';
      for (var i = 0; i < keranjang.length; i++) {
        c.innerHTML += '<div>' + keranjang[i].nama + ' - Rp' + keranjang[i].harga + '</div>';
      }
    };

    window.tambahWishlist = function(i) {
      wishlist.push(produk[i]);
      save('wishlist', wishlist);
      alert('Ditambahkan ke favorit');
    };
    window.renderWishlist = function() {
      var c = document.getElementById('wishlistContainer');
      if (!c) return;
      c.innerHTML = '';
      for (var i = 0; i < wishlist.length; i++) {
        c.innerHTML += '<div>' + wishlist[i].nama + '</div>';
      }
    };

    window.renderRiwayat = function() {
      var c = document.getElementById('riwayatContainer');
      if (!c) return;
      c.innerHTML = '';
      for (var i = 0; i < riwayat.length; i++) {
        c.innerHTML += '<div>' + riwayat[i].nama + ' - Rp' + riwayat[i].harga + '</div>';
      }
    };

    // 11. Checkout & Struk
    window.checkoutWA = function() {
      lastOrder = keranjang.slice();
      var txt = '';
      for (var i = 0; i < keranjang.length; i++) {
        txt += keranjang[i].nama + ' - Rp' + keranjang[i].harga + '\\n';
      }
      window.open('https://wa.me/6283131810087?text=' + encodeURIComponent(txt));
      riwayat = riwayat.concat(keranjang);
      save('riwayat', riwayat);
      keranjang = [];
      save('keranjang', keranjang);
      renderKeranjang();
    };

    window.cetakPDF = function() {
      var doc = new window.jspdf.jsPDF();
      var data = lastOrder.length ? lastOrder : riwayat;
      for (var i = 0; i < data.length; i++) {
        doc.text(data[i].nama + ' - Rp' + data[i].harga, 10, 10 + i * 10);
      }
      doc.save('struk_FAHDIL.pdf');
    };

    // 12. Voucher
    window.renderVoucher = function() {
      var c = document.getElementById('voucherList');
      if (!c) return;
      c.innerHTML = '';
      for (var i = 0; i < vouchers.length; i++) {
        c.innerHTML += '<div>' + vouchers[i].kode + ' - ' + vouchers[i].diskon + '%</div>';
      }
    };
    var formVoucher = document.getElementById('formVoucher');
    if (formVoucher) {
      formVoucher.addEventListener('submit', function(e) {
        e.preventDefault();
        var code = document.getElementById('kodeVoucher').value;
        var disc = parseInt(document.getElementById('diskonVoucher').value) || 0;
        if (!code) { alert('Masukkan kode voucher'); return; }
        vouchers.push({ kode: code, diskon: disc });
        save('vouchers', vouchers);
        renderVoucher();
      });
    }

    // 13. Dashboard & Pengaturan
    window.updateDashboard = function() {
      var el = document.getElementById('jumlahProduk');
      if (el) el.textContent = produk.length;
    };
    window.editLogin = function() {
      if (!userLogin) { alert('Harap login dulu'); return; }
      var u = document.getElementById('editUsername').value;
      var p = document.getElementById('editPassword').value;
      if (!u || !p) { alert('Isi username & password baru'); return; }
      loginData[userLogin] = { user: u, pass: p };
      storage.setItem('loginData', JSON.stringify(loginData));
      alert('Login diperbarui');
    };

    // 14. Search
    var search = document.getElementById('searchInput');
    if (search) {
      search.addEventListener('input', function() {
        var q = this.value.toLowerCase();
        var cards = document.querySelectorAll('.produk-card');
        for (var i = 0; i < cards.length; i++) {
          var h = cards[i].querySelector('h3');
          cards[i].style.display = (h && h.textContent.toLowerCase().includes(q)) ? 'block' : 'none';
        }
      });
    }

    // 15. Initialize all
    updateMenu();
    showPage('produk');
    renderProduk();
    renderKeranjang();
    renderWishlist();
    renderRiwayat();
    renderVoucher();
  });
})();