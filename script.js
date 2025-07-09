// script.js – Lengkap & Final dengan semua fungsi

// Supabase & localStorage init
const SUPA = window.SUPA;
['keranjang','wishlist','riwayat','vouchers','pendingConfirm'].forEach(k => {
  if (!localStorage.getItem(k)) localStorage.setItem(k, '[]');
});
let keranjang      = JSON.parse(localStorage.getItem('keranjang'));
let wishlist       = JSON.parse(localStorage.getItem('wishlist'));
let riwayat        = JSON.parse(localStorage.getItem('riwayat'));
let vouchers       = JSON.parse(localStorage.getItem('vouchers'));
let pendingConfirm = JSON.parse(localStorage.getItem('pendingConfirm'));

const loginData = {
  pemilik: { user: 'FAHDiL', pass: 'WEB_ADMIN_123' },
  owner:   { user: 'OWNERKU', pass: 'OWNER_PASS' }
};
let userLogin   = null;
let appliedDisc = 0;

// DOM refs
document.addEventListener('DOMContentLoaded', () => {
  const sidebar         = document.getElementById('sidebar');
  const toggleSidebar   = document.getElementById('toggleSidebar');
  const searchInput     = document.getElementById('searchInput');
  const produkContainer = document.getElementById('produkContainer');

  const adminPages = ['tambah','voucher','dashboard','pengaturan','struk','konfirmasi'];
  const isAdmin    = () => ['pemilik','owner'].includes(userLogin);

  // Update sidebar menu visibility
  function updateMenu() {
    document.querySelectorAll('nav#sidebar li[data-page]').forEach(li => {
      const page = li.getAttribute('data-page');
      if (adminPages.includes(page)) {
        li.style.display = isAdmin() ? 'block' : 'none';
      } else if (page === 'login-pemilik' || page === 'login-owner') {
        li.style.display = isAdmin() ? 'none' : 'block';
      }
    });
  }

  // Sidebar toggle & autoclose
  toggleSidebar.addEventListener('click', () => sidebar.classList.toggle('active'));
  document.querySelectorAll('nav#sidebar li[data-page]').forEach(li =>
    li.addEventListener('click', () => sidebar.classList.remove('active'))
  );

  // Navigation w/ guard
  window.showPage = id => {
    if (adminPages.includes(id) && !isAdmin()) {
      alert('Silakan login sebagai Pemilik/Owner.');
      id = 'login-pemilik';
    }
    document.querySelectorAll('.halaman').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    if (id === 'produk') loadProduk();
    if (id === 'riwayat') renderRiwayat();
    if (id === 'voucher') renderVoucher();
    if (id === 'checkout') updateCheckout();
    if (id === 'struk') cetakPDF();
    if (id === 'dashboard') updateDashboard();
    if (id === 'konfirmasi') renderKonfirmasi();
  };

  // Login / Logout
  window.login = role => {
    const u = document.getElementById(role + 'User').value;
    const p = document.getElementById(role + 'Pass').value;
    if (loginData[role] && u === loginData[role].user && p === loginData[role].pass) {
      userLogin = role;
      alert('Login berhasil sebagai ' + role);
      updateMenu();
      showPage('dashboard');
    } else alert('Login gagal');
  };
  window.logout = () => {
    userLogin = null;
    appliedDisc = 0;
    alert('Logout berhasil');
    updateMenu();
    showPage('produk');
  };

  // Load & Render Produk
  async function loadProduk() {
    produkContainer.innerHTML = '⏳ Memuat produk...';
    const { data, error } = await SUPA.from('produk').select('*').order('id', { ascending: false });
    if (error) {
      produkContainer.innerHTML = '<p>⚠️ Gagal memuat produk</p>';
      return;
    }
    produkContainer.innerHTML = data.map(p => `
      <div class="produk-card">
        <img src="${p.gambar}" alt="${p.nama}">
        <h3>${p.nama}</h3>
        <p>Rp${p.harga}</p>
        ${isAdmin() ? `<button onclick="prepareEdit(${p.id})" class="btn warna-warni">✏️ Edit</button>
                      <button onclick="deleteProduct(${p.id})" class="btn warna-warni">🗑️ Hapus</button>` : ''}
        <button onclick="tambahKeranjang(${p.id})" class="btn warna-warni">🛒 Beli</button>
        <button onclick="tambahWishlist(${p.id})" class="btn warna-warni">❤️</button>
      </div>`).join('');
    searchInput.dispatchEvent(new Event('input'));
  }
  loadProduk();

  // Delete Produk (Admin)
  window.deleteProduct = async id => {
    if (!confirm('Yakin hapus produk?')) return;
    const { error } = await SUPA.from('produk').delete().eq('id', id);
    if (error) return alert('Gagal hapus: ' + error.message);
    alert('Produk dihapus');
    loadProduk();
  };

  // Prepare Edit Produk
  window.prepareEdit = async id => {
    const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
    ['namaProduk','hargaProduk','stokProduk','kategoriProduk'].forEach((fid,i) =>
      document.getElementById(fid).value = [p.nama,p.harga,p.stok,p.kategori][i]
    );
    showPage('tambah');
    document.getElementById('formTambah').onsubmit = async e => {
      e.preventDefault();
      await SUPA.from('produk').update({
        nama: document.getElementById('namaProduk').value,
        harga:+document.getElementById('hargaProduk').value,
        stok:+document.getElementById('stokProduk').value,
        kategori: document.getElementById('kategoriProduk').value
      }).eq('id', id);
      alert('Produk diperbarui');
      loadProduk();
      showPage('produk');
      document.getElementById('formTambah').onsubmit = submitForm;
    };
  };

  // Submit New Produk
  function submitForm(e) {
    e.preventDefault();
    const nama     = document.getElementById('namaProduk').value;
    const harga    = +document.getElementById('hargaProduk').value;
    const stok     = +document.getElementById('stokProduk').value;
    const kategori = document.getElementById('kategoriProduk').value;
    const file     = document.getElementById('gambarProduk').files[0];
    const reader   = new FileReader();
    reader.onload = async () => {
      await SUPA.from('produk').insert([{ nama,harga,stok,kategori,gambar:reader.result }]);
      alert('Produk disimpan');
      loadProduk();
      showPage('produk');
    };
    if (file) reader.readAsDataURL(file);
  }
  document.getElementById('formTambah').addEventListener('submit', submitForm);

  // Keranjang
  window.tambahKeranjang = async id => {
    const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
    keranjang.push(p);
    localStorage.setItem('keranjang', JSON.stringify(keranjang));
    renderKeranjang();
  };
  function renderKeranjang() {
    document.getElementById('keranjangContainer').innerHTML =
      keranjang.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
  }

  // Wishlist
  window.tambahWishlist = async id => {
    const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
    wishlist.push(p);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    renderWishlist();
  };
  function renderWishlist() {
    document.getElementById('wishlistContainer').innerHTML =
      wishlist.map(p=>`<div>${p.nama}</div>`).join('');
  }

  // Riwayat Pesanan
  function renderRiwayat() {
    document.getElementById('riwayatContainer').innerHTML =
      riwayat.map((p,i)=>`<div>${i+1}. ${p.nama} - Rp${p.harga}</div>`).join('');
  }

  // Voucher
  window.renderVoucher = () => {
    document.getElementById('voucherList').innerHTML =
      vouchers.map(v=>`<div>${v.kode} — ${v.diskon}%</div>`).join('');
  };
  document.getElementById('formVoucher').addEventListener('submit', e => {
    e.preventDefault();
    const kode    = document.getElementById('kodeVoucher').value.trim();
    const diskon  = +document.getElementById('diskonVoucher').value;
    vouchers.push({ kode, diskon });
    localStorage.setItem('vouchers', JSON.stringify(vouchers));
    renderVoucher();
  });
  window.applyVoucher = () => {
    const code = document.getElementById('applyVoucher').value.trim();
    const v = vouchers.find(x=>x.kode===code);
    if (!v) return alert('Voucher tidak ditemukan');
    appliedDisc = v.diskon;
    document.getElementById('statusVoucher').textContent = `Diskon ${v.diskon}%`;
    alert('Voucher diterapkan');
  };

  // Checkout Manual & WA
  function salin(id) {
    const t = document.getElementById(id).textContent;
    navigator.clipboard.writeText(t).then(()=>alert(`✅ ${id.toUpperCase()} disalin`));
  }
  window.updateCheckout = () => {
    const total = keranjang.reduce((s,p)=>s+p.harga,0);
    document.getElementById('totalBayar').textContent = `Rp${total.toLocaleString()}`;
    const method = document.getElementById('paymentMethod').value;
    const daftar = keranjang.map((p,i)=>`${i+1}. ${p.nama} - Rp${p.harga}`).join('
');
    const pesan = `Pesanan:
${daftar}

Total: Rp${total.toLocaleString()}
Bayar via: ${method}

Saya sudah transfer via ${method}.`;
    const wa = document.getElementById('waCheckout');
    wa.href = `https://wa.me/6283131810087?text=${encodeURIComponent(pesan)}`;
    alert('Link WA siap!');
  };

  // Cetak Struk PDF
  window.cetakPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    keranjang.forEach((p,i)=> doc.text(`${i+1}. ${p.nama} - Rp${p.harga}`, 10, 10 + i*10));
    doc.save('struk_FAHDIL.pdf');
  };

  // Dashboard & Pengaturan
  function updateDashboard() {
    document.getElementById('jumlahProduk').textContent = produkContainer.children.length;
    const totalOmzet = riwayat.reduce((sum,p)=>sum+p.harga,0);
    document.getElementById('totalOmzet').textContent = `Rp${totalOmzet.toLocaleString()}`;
  }
  window.editLogin = () => {
    if (!userLogin) return alert('Login dulu!');
    loginData[userLogin] = {
      user: document.getElementById('editUsername').value,
      pass: document.getElementById('editPassword').value
    };
    alert('Login diperbarui');
  };

  // Konfirmasi Pembayaran (Admin)
  function renderKonfirmasi() {
    const container = document.getElementById('konfirmasiContainer');
    container.innerHTML = pendingConfirm.map((o,i)=>`
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
    localStorage.setItem('riwayat', JSON.stringify(riwayat));
    localStorage.setItem('pendingConfirm', JSON.stringify(pendingConfirm));
    renderKonfirmasi();
    alert('Pembayaran dikonfirmasi');
  };
  window.rejectOrder = i => {
    pendingConfirm.splice(i,1);
    localStorage.setItem('pendingConfirm', JSON.stringify(pendingConfirm));
    renderKonfirmasi();
    alert('Pembayaran ditolak');
  };

  // Live Search
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    document.querySelectorAll('.produk-card').forEach(c => {
      const name = c.querySelector('h3').textContent.toLowerCase();
      c.style.display = name.includes(q) ? 'block' : 'none';
    });
  });

  updateMenu();
  showPage('produk');
});
