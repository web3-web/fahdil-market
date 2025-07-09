// script.js – Lengkap & Rapi

// ══ Inisialisasi ══
const SUPA = window.SUPA;
['keranjang','wishlist','riwayat','vouchers','pendingConfirm']
  .forEach(k => localStorage.getItem(k) || localStorage.setItem(k, '[]'));

let keranjang      = JSON.parse(localStorage.getItem('keranjang'));
let wishlist       = JSON.parse(localStorage.getItem('wishlist'));
let riwayat        = JSON.parse(localStorage.getItem('riwayat'));
let vouchers       = JSON.parse(localStorage.getItem('vouchers'));
let pendingConfirm = JSON.parse(localStorage.getItem('pendingConfirm'));

const loginData = {
  pemilik: { user: 'FAHDiL', pass: 'WEB_ADMIN_123' },
  owner:   { user: 'OWNERKU', pass: 'OWNER_PASS' }
};
let userLogin = null, appliedDisc = 0;

// ══ DOMContentLoaded ══
document.addEventListener('DOMContentLoaded', () => {
  const sidebar         = document.getElementById('sidebar');
  const toggleSidebar   = document.getElementById('toggleSidebar');
  const searchInput     = document.getElementById('searchInput');
  const produkContainer = document.getElementById('produkContainer');

  const adminPages = ['tambah','voucher','dashboard','pengaturan','struk','konfirmasi'];
  const isAdmin    = () => ['pemilik','owner'].includes(userLogin);

  // — Sidebar menu visibility
  function updateMenu() {
    document.querySelectorAll('nav#sidebar li[data-page]').forEach(li => {
      const page = li.dataset.page;
      if (adminPages.includes(page)) {
        li.style.display = isAdmin() ? 'block' : 'none';
      } else if (['login-pemilik','login-owner'].includes(page)) {
        li.style.display = isAdmin() ? 'none' : 'block';
      }
    });
  }

  // — Toggle sidebar
  toggleSidebar.addEventListener('click', () => sidebar.classList.toggle('active'));
  document.querySelectorAll('nav#sidebar li[data-page]').forEach(li =>
    li.addEventListener('click', () => sidebar.classList.remove('active'))
  );

  // — Navigation guard & loader
  window.showPage = id => {
    if (adminPages.includes(id) && !isAdmin()) {
      alert('Silakan login sebagai admin.');
      id = 'login-pemilik';
    }
    document.querySelectorAll('.halaman').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');

    switch (id) {
      case 'produk':    loadProduk();       break;
      case 'riwayat':   renderRiwayat();    break;
      case 'voucher':   renderVoucher();    break;
      case 'checkout':  updateCheckout();   break;
      case 'struk':     cetakPDF();         break;
      case 'dashboard': updateDashboard();  break;
      case 'konfirmasi':renderKonfirmasi(); break;
    }
  };

  // ══ Auth ══
  window.login = role => {
    const u = document.getElementById(role+'User').value;
    const p = document.getElementById(role+'Pass').value;
    if (loginData[role] && u===loginData[role].user && p===loginData[role].pass) {
      userLogin = role; alert('Login sukses '+role);
      updateMenu(); showPage('dashboard');
    } else alert('Login gagal');
  };
  window.logout = () => {
    userLogin = null; appliedDisc = 0;
    alert('Logout berhasil'); updateMenu(); showPage('produk');
  };

  // ══ Produk ══
  async function loadProduk() {
    produkContainer.innerHTML = '⏳ Memuat produk...';
    const { data, error } = await SUPA.from('produk').select('*').order('id',{ascending:false});
    if (error) return produkContainer.innerHTML = '<p>⚠️ Gagal memuat</p>';

    produkContainer.innerHTML = data.map(p => `
      <div class="produk-card">
        <img src="${p.gambar}" alt="${p.nama}">
        <h3>${p.nama}</h3>
        <p>Rp${p.harga}</p>
        ${isAdmin() ? `<button onclick="prepareEdit(${p.id})" class="btn warna-warni">✏️ Edit</button>
                       <button onclick="deleteProduct(${p.id})" class="btn warna-warni">🗑️ Hapus</button>` : ''}
        <button onclick="tambahKeranjang(${p.id})" class="btn warna-warni">🛒 Beli</button>
        <button onclick="tambahWishlist(${p.id})" class="btn warna-warni">❤️ Favorit</button>
      </div>
    `).join('');
    searchInput.dispatchEvent(new Event('input'));
  }
  loadProduk();

  window.deleteProduct = async id => {
    if (!confirm('Hapus produk?')) return;
    const { error } = await SUPA.from('produk').delete().eq('id', id);
    if (error) alert('Error: '+error.message);
    else loadProduk();
  };

  window.prepareEdit = async id => {
    const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
    ['namaProduk','hargaProduk','stokProduk','kategoriProduk']
      .forEach((fid,i)=>document.getElementById(fid).value=[p.nama,p.harga,p.stok,p.kategori][i]);
    showPage('tambah');
    document.getElementById('formTambah').onsubmit = async e => {
      e.preventDefault();
      await SUPA.from('produk')
        .update({
          nama: document.getElementById('namaProduk').value,
          harga:+document.getElementById('hargaProduk').value,
          stok:+document.getElementById('stokProduk').value,
          kategori:document.getElementById('kategoriProduk').value
        }).eq('id', id);
      loadProduk(); showPage('produk');
    };
  };

  document.getElementById('formTambah').addEventListener('submit', e => {
    e.preventDefault();
    const file = document.getElementById('gambarProduk').files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      await SUPA.from('produk').insert([{
        nama: document.getElementById('namaProduk').value,
        harga:+document.getElementById('hargaProduk').value,
        stok:+document.getElementById('stokProduk').value,
        kategori:document.getElementById('kategoriProduk').value,
        gambar: reader.result
      }]);
      loadProduk(); showPage('produk');
    };
    if (file) reader.readAsDataURL(file);
  });

  // ══ Keranjang & Wishlist ══
  window.tambahKeranjang = async id => {
    const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
    keranjang.push(p); localStorage.setItem('keranjang',JSON.stringify(keranjang)); renderKeranjang();
  };
  function renderKeranjang() {
    document.getElementById('keranjangContainer').innerHTML =
      keranjang.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
  }

  window.tambahWishlist = async id => {
    const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
    wishlist.push(p); localStorage.setItem('wishlist',JSON.stringify(wishlist)); renderWishlist();
  };
  function renderWishlist() {
    document.getElementById('wishlistContainer').innerHTML =
      wishlist.map(p=>`<div>${p.nama}</div>`).join('');
  }

  // ══ Riwayat ══
  function renderRiwayat() {
    document.getElementById('riwayatContainer').innerHTML =
      riwayat.map((p,i)=>`<div>${i+1}. ${p.nama} - Rp${p.harga}</div>`).join('');
  }

  // ══ Voucher ══
  function renderVoucher() {
    document.getElementById('voucherList').innerHTML =
      vouchers.map(v=>`<div>${v.kode} — ${v.diskon}%</div>`).join('');
  }
  document.getElementById('formVoucher').addEventListener('submit', e => {
    e.preventDefault();
    vouchers.push({
      kode: document.getElementById('kodeVoucher').value.trim(),
      diskon: +document.getElementById('diskonVoucher').value
    });
    localStorage.setItem('vouchers', JSON.stringify(vouchers));
    renderVoucher();
  });
  window.applyVoucher = () => {
    const code = document.getElementById('applyVoucher').value.trim();
    const v = vouchers.find(x=>x.kode===code);
    if (!v) return alert('Voucher tidak ditemukan');
    appliedDisc = v.diskon;
    document.getElementById('statusVoucher').textContent = `Diskon ${v.diskon}%`;
  };

  // ══ Checkout & WA ══
  function salin(id) {
    navigator.clipboard.writeText(document.getElementById(id).textContent)
      .then(()=>alert(`${id.toUpperCase()} disalin`));
  }
  window.updateCheckout = () => {
    const total = keranjang.reduce((s,p)=>s+p.harga,0);
    document.getElementById('totalBayar').textContent = `Rp${total.toLocaleString()}`;
    const m = document.getElementById('paymentMethod').value;
    const daftar = keranjang.map((p,i)=>`${i+1}. ${p.nama} - Rp${p.harga}`).join('\\n');
    const teks = `Pesanan:\\n${daftar}\\n\\nTotal: Rp${total.toLocaleString()}\\nBayar via: ${m}`;
    document.getElementById('waCheckout').href =
      `https://wa.me/6283131810087?text=${encodeURIComponent(teks)}`;
  };

  // ══ Cetak Struk ══
  window.cetakPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    keranjang.forEach((p,i)=>doc.text(`${i+1}. ${p.nama} - Rp${p.harga}`,10,10+i*10));
    doc.save('struk_FAHDIL.pdf');
  };

  // ══ Dashboard ══
  function updateDashboard() {
    document.getElementById('jumlahProduk').textContent = produkContainer.children.length;
    const totalOmzet = riwayat.reduce((sum,p)=>sum+p.harga,0);
    document.getElementById('totalOmzet').textContent = `Rp${totalOmzet.toLocaleString()}`;
  }

  // ══ Pengaturan Login ══
  window.editLogin = () => {
    if (!userLogin) return alert('Login dulu!');
    loginData[userLogin] = {
      user: document.getElementById('editUsername').value,
      pass: document.getElementById('editPassword').value
    };
    alert('Login diperbarui');
  };

  // ══ Konfirmasi Pembayaran ══
  function renderKonfirmasi() {
    document.getElementById('konfirmasiContainer').innerHTML = pendingConfirm.map((o,i)=>`
      <div class="konf-card">
        <p><strong>${o.nama}</strong> - Rp${o.harga}</p>
        <p>Metode: ${o.metode}</p>
        <button onclick="confirmOrder(${i})" class="btn warna-warni">✔️ Konfirmasi</button>
        <button onclick="rejectOrder(${i})" class="btn warna-warni">✖️ Tolak</button>
      </div>
    `).join('');
  }
  window.confirmOrder = i => {
    riwayat.push(pendingConfirm[i]);
    pendingConfirm.splice(i,1);
    localStorage.setItem('riwayat',JSON.stringify(riwayat));
    localStorage.setItem('pendingConfirm',JSON.stringify(pendingConfirm));
    renderKonfirmasi();
    alert('Dikonfirmasi');
  };
  window.rejectOrder = i => {
    pendingConfirm.splice(i,1);
    localStorage.setItem('pendingConfirm',JSON.stringify(pendingConfirm));
    renderKonfirmasi();
    alert('Ditolak');
  };

  // ══ Live Search ══
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    document.querySelectorAll('.produk-card').forEach(c => {
      c.style.display = c.querySelector('h3').textContent.toLowerCase().includes(q)
        ? 'block' : 'none';
    });
  });

  // ══ Initialize ══
  updateMenu();
  showPage('produk');
});
