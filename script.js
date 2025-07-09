// script.js

// Supabase & localStorage init
const SUPA = window.SUPA;
['keranjang','wishlist','riwayat','vouchers','pendingConfirm'].forEach(k=>{
  if (!localStorage.getItem(k)) localStorage.setItem(k,'[]');
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
let userLogin = null,
    appliedDisc = 0;

// DOM refs
const sidebar        = document.getElementById('sidebar'),
      toggleSidebar  = document.getElementById('toggleSidebar'),
      searchInput    = document.getElementById('searchInput'),
      produkContainer= document.getElementById('produkContainer');

const adminPages = ['tambah','voucher','dashboard','pengaturan','struk','konfirmasi'];
const isAdmin    = () => ['pemilik','owner'].includes(userLogin);

// Update sidebar visibility
function updateMenu(){
  document.querySelectorAll('nav#sidebar li[data-page]').forEach(li=>{
    const page = li.getAttribute('data-page');
    if (adminPages.includes(page)) {
      li.style.display = isAdmin() ? 'block' : 'none';
    } else if (page==='login-pemilik' || page==='login-owner') {
      li.style.display = isAdmin() ? 'none' : 'block';
    }
  });
}

// Sidebar toggle & autoclose
toggleSidebar.addEventListener('click', () => sidebar.classList.toggle('active'));
document.querySelectorAll('nav#sidebar li[data-page]').forEach(li =>
  li.addEventListener('click', () => sidebar.classList.remove('active'))
);

// Page navigation w/ guard
window.showPage = id => {
  if (adminPages.includes(id) && !isAdmin()) {
    alert('Silakan login sebagai Pemilik/Owner.');
    id = 'login-pemilik';
  }
  document.querySelectorAll('.halaman').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  if (id==='produk') loadProduk();
  if (id==='checkout') updateCheckout();
  if (id==='konfirmasi') renderKonfirmasi();
};

// Login / Logout
window.login = role => {
  const u = document.getElementById(role+'User').value;
  const p = document.getElementById(role+'Pass').value;
  if (loginData[role] && u===loginData[role].user && p===loginData[role].pass) {
    userLogin = role;
    alert('Login berhasil sebagai '+role);
    updateMenu();
    showPage('dashboard');
    updateDashboard();
  } else alert('Login gagal');
};
window.logout = () => {
  userLogin = null;
  appliedDisc = 0;
  alert('Logout berhasil');
  updateMenu();
  showPage('produk');
};

// Load & render products
async function loadProduk(){
  produkContainer.innerHTML = '⏳ Memuat produk...';
  const { data, error } = await SUPA.from('produk')
    .select('*').order('id',{ascending:false});
  if (error) return produkContainer.innerHTML = '<p>⚠️ Gagal memuat produk</p>';

  produkContainer.innerHTML = data.map(p=>`
    <div class="produk-card">
      <img src="${p.gambar}" alt="${p.nama}">
      <h3>${p.nama}</h3>
      <p>Rp${p.harga}</p>
      ${isAdmin() ? `<button onclick="prepareEdit(${p.id})" class="btn warna-warni">✏️ Edit</button>
                    <button onclick="deleteProduct(${p.id})" class="btn warna-warni">🗑️ Hapus</button>` : ''}
      <button onclick="tambahKeranjang(${p.id})" class="btn warna-warni">🛒 Beli</button>
      <button onclick="tambahWishlist(${p.id})" class="btn warna-warni">❤️</button>
    </div>
  `).join('');
  searchInput.dispatchEvent(new Event('input'));
}
loadProduk();

// Delete product (admin only)
window.deleteProduct = async id => {
  if (!confirm('Yakin hapus produk?')) return;
  const { error } = await SUPA.from('produk').delete().eq('id', id);
  if (error) return alert('Gagal hapus: '+error.message);
  alert('Produk dihapus');
  loadProduk();
};

// Prepare edit
window.prepareEdit = async id => {
  const { data: p } = await SUPA.from('produk').select('*').eq('id', id).single();
  document.getElementById('namaProduk').value     = p.nama;
  document.getElementById('hargaProduk').value    = p.harga;
  document.getElementById('stokProduk').value     = p.stok;
  document.getElementById('kategoriProduk').value = p.kategori;
  showPage('tambah');
  document.getElementById('formTambah').onsubmit = async e => {
    e.preventDefault();
    await SUPA.from('produk').update({
      nama: document.getElementById('namaProduk').value,
      harga: +document.getElementById('hargaProduk').value,
      stok: +document.getElementById('stokProduk').value,
      kategori: document.getElementById('kategoriProduk').value
    }).eq('id', id);
    alert('Produk diperbarui');
    loadProduk();
    showPage('produk');
    document.getElementById('formTambah').onsubmit = submitForm;
  };
};

// Submit new product
function submitForm(e) {
  e.preventDefault();
  const nama = document.getElementById('namaProduk').value;
  const harga= +document.getElementById('hargaProduk').value;
  const stok = +document.getElementById('stokProduk').value;
  const kategori = document.getElementById('kategoriProduk').value;
  const file = document.getElementById('gambarProduk').files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    await SUPA.from('produk').insert([{ nama,harga,stok,kategori,gambar:reader.result }]);
    alert('Produk disimpan');
    loadProduk();
    showPage('produk');
  };
  if (file) reader.readAsDataURL(file);
}
document.getElementById('formTambah').addEventListener('submit', submitForm);

// Cart & Wishlist
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

// History & Voucher & Confirmation functions omitted for brevity...
// Ensure renderRiwayat(), renderVoucher(), applyVoucher(), renderKonfirmasi(), confirmOrder(), rejectOrder(), checkoutWA(), cetakPDF(), updateDashboard(), editLogin(), search filter are exactly as before.

updateMenu();
showPage('produk');
