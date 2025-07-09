// script.js

// Supabase & localStorage init
const SUPA = window.SUPA;
['keranjang','wishlist','riwayat','vouchers','pendingConfirm'].forEach(k=>{
  if (!localStorage.getItem(k)) localStorage.setItem(k, '[]');
});
let keranjang      = JSON.parse(localStorage.getItem('keranjang'));
let wishlist       = JSON.parse(localStorage.getItem('wishlist'));
let riwayat        = JSON.parse(localStorage.getItem('riwayat'));
let vouchers       = JSON.parse(localStorage.getItem('vouchers'));
let pendingConfirm = JSON.parse(localStorage.getItem('pendingConfirm'));

const loginData = {
  pemilik:{user:'FAHDiL',pass:'WEB_ADMIN_123'},
  owner:  {user:'OWNERKU',pass:'OWNER_PASS'}
};
let userLogin=null, appliedDisc=0;

// DOM refs
const sidebar=document.getElementById('sidebar'),
      toggleSidebar=document.getElementById('toggleSidebar'),
      searchInput=document.getElementById('searchInput'),
      produkContainer=document.getElementById('produkContainer');

const adminPages=['tambah','voucher','dashboard','pengaturan','struk','konfirmasi'];
const isAdmin=()=>['pemilik','owner'].includes(userLogin);

// update sidebar menu visibility
function updateMenu(){
  document.querySelectorAll('nav#sidebar li[data-page]').forEach(li=>{
    const page=li.getAttribute('data-page');
    if (adminPages.includes(page)) {
      li.style.display = isAdmin() ? 'block' : 'none';
    } else if (page==='login-pemilik'||page==='login-owner') {
      li.style.display = isAdmin() ? 'none' : 'block';
    }
  });
}

// sidebar toggle & autoclose
toggleSidebar.addEventListener('click',()=>sidebar.classList.toggle('active'));
document.querySelectorAll('nav#sidebar li[data-page]').forEach(li=>
  li.addEventListener('click',()=>sidebar.classList.remove('active'))
);

// page navigation w/ guard
window.showPage=id=>{
  if (adminPages.includes(id) && !isAdmin()) {
    alert('Login Pemilik/Owner dulu');
    id='login-pemilik';
  }
  document.querySelectorAll('.halaman').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  if (id==='produk') loadProduk();
  if (id==='checkout') updateCheckout();
  if (id==='konfirmasi') renderKonfirmasi();
};

// login/logout
window.login=role=>{
  const u=document.getElementById(role+'User').value,
        p=document.getElementById(role+'Pass').value;
  if (loginData[role] && u===loginData[role].user && p===loginData[role].pass) {
    userLogin=role; alert('Login berhasil');
    updateMenu(); showPage('dashboard'); updateDashboard();
  } else alert('Login gagal');
};
window.logout=()=>{
  userLogin=null; appliedDisc=0; alert('Logout berhasil');
  updateMenu(); showPage('produk');
};

// load & render produk
async function loadProduk(){
  produkContainer.innerHTML='⏳ Memuat produk...';
  const {data,error}=await SUPA.from('produk').select('*').order('id',{ascending:false});
  if (error) return produkContainer.innerHTML='<p>⚠️ Gagal memuat produk</p>';
  produkContainer.innerHTML=data.map(p=>`
    <div class="produk-card">
      <img src="${p.gambar}" alt="${p.nama}">
      <h3>${p.nama}</h3><p>Rp${p.harga}</p>
      ${isAdmin()?`<button onclick="prepareEdit(${p.id})" class="btn warna-warni">✏️ Edit</button>
      <button onclick="deleteProduct(${p.id})" class="btn warna-warni">🗑️ Hapus</button>`:''}
      <button onclick="tambahKeranjang(${p.id})" class="btn warna-warni">🛒 Beli</button>
      <button onclick="tambahWishlist(${p.id})" class="btn warna-warni">❤️</button>
    </div>
  `).join('');
  searchInput.dispatchEvent(new Event('input'));
}
loadProduk();

// delete product (admin)
window.deleteProduct=async id=>{
  if (!confirm('Hapus produk ini?')) return;
  const{error}=await SUPA.from('produk').delete().eq('id',id);
  if (error) return alert('Gagal: '+error.message);
  alert('Terhapus'); loadProduk();
};

// prepare edit
window.prepareEdit=async id=>{
  const{data:p}=await SUPA.from('produk').select('*').eq('id',id).single();
  document.getElementById('namaProduk').value=p.nama;
  document.getElementById('hargaProduk').value=p.harga;
  document.getElementById('stokProduk').value=p.stok;
  document.getElementById('kategoriProduk').value=p.kategori;
  showPage('tambah');
  document.getElementById('formTambah').onsubmit=async e=>{
    e.preventDefault();
    await SUPA.from('produk').update({
      nama:document.getElementById('namaProduk').value,
      harga:+document.getElementById('hargaProduk').value,
      stok:+document.getElementById('stokProduk').value,
      kategori:document.getElementById('kategoriProduk').value
    }).eq('id',id);
    alert('Diperbarui'); loadProduk(); showPage('produk');
    document.getElementById('formTambah').onsubmit=submitForm;
  };
};

// submit baru
function submitForm(e){
  e.preventDefault();
  const nama=document.getElementById('namaProduk').value,
        harga=+document.getElementById('hargaProduk').value,
        stok=+document.getElementById('stokProduk').value,
        kategori=document.getElementById('kategoriProduk').value,
        file=document.getElementById('gambarProduk').files[0],
        reader=new FileReader();
  reader.onload=async()=>{
    await SUPA.from('produk').insert([{nama,harga,stok,kategori,gambar:reader.result}]);
    alert('Disimpan'); loadProduk(); showPage('produk');
  };
  if(file) reader.readAsDataURL(file);
}
document.getElementById('formTambah').addEventListener('submit',submitForm);

// keranjang
window.tambahKeranjang=async id=>{
  const{data:p}=await SUPA.from('produk').select('*').eq('id',id).single();
  keranjang.push(p); localStorage.setItem('keranjang',JSON.stringify(keranjang)); renderKeranjang();
};
function renderKeranjang(){
  document.getElementById('keranjangContainer').innerHTML=
    keranjang.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
}

// wishlist
window.tambahWishlist=async id=>{
  const{data:p}=await SUPA.from('produk').select('*').eq('id',id).single();
  wishlist.push(p); localStorage.setItem('wishlist',JSON.stringify(wishlist)); renderWishlist();
};
function renderWishlist(){
  document.getElementById('wishlistContainer').innerHTML=
    wishlist.map(p=>`<div>${p.nama}</div>`).join('');
}

// riwayat
function renderRiwayat(){
  document.getElementById('riwayatContainer').innerHTML=
    riwayat.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
}

// voucher
window.renderVoucher=()=>{
  document.getElementById('voucherList').innerHTML=
    vouchers.map(v=>`<div>${v.kode} — ${v.diskon}%</div>`).join('');
};
document.getElementById('formVoucher').addEventListener('submit',e=>{
  e.preventDefault();
  const kode=document.getElementById('kodeVoucher').value,
        diskon=+document.getElementById('diskonVoucher').value;
  vouchers.push({kode,diskon}); localStorage.setItem('vouchers',JSON.stringify(vouchers)); renderVoucher();
});
window.applyVoucher=()=>{
  const code=document.getElementById('applyVoucher').value.trim(),
        v=vouchers.find(x=>x.kode===code);
  if(!v) return alert('Voucher tidak ada');
  appliedDisc=v.diskon; document.getElementById('statusVoucher').textContent=`Diskon ${v.diskon}%`;
  alert('Voucher diterapkan');
};

// konfirmasi manual
function renderKonfirmasi(){
  const c=document.getElementById('konfirmasiContainer');
  if(!pendingConfirm.length){c.innerHTML='<p>Tidak ada order.</p>';return;}
  c.innerHTML=pendingConfirm.map(o=>`
    <div class="konf-card">
      <p><strong>${o.nama}</strong> — Rp${o.total.toLocaleString()}</p>
      <p><small>${o.waktu}</small></p>
      ${o.dibayar
        ?'<span class="status-paid">✔️ Dibayar</span>'
        :`<button onclick="confirmOrder(${o.id})" class="btn warna-warni">Konfirmasi</button>
           <button onclick="rejectOrder(${o.id})" class="btn warna-warni">Tolak</button>`}
    </div>
  `).join('');
}
window.confirmOrder=id=>{
  pendingConfirm=pendingConfirm.map(o=>o.id===id?{...o,dibayar:true}:o);
  localStorage.setItem('pendingConfirm',JSON.stringify(pendingConfirm));
  const paid=pendingConfirm.find(o=>o.id===id);
  if(paid) { riwayat.push({nama:paid.nama,harga:paid.total}); localStorage.setItem('riwayat',JSON.stringify(riwayat)); }
  renderKonfirmasi();
};
window.rejectOrder=id=>{
  pendingConfirm=pendingConfirm.filter(o=>o.id!==id);
  localStorage.setItem('pendingConfirm',JSON.stringify(pendingConfirm)); renderKonfirmasi();
};

// salin & update checkout
function salin(id){
  const t=document.getElementById(id).textContent;
  navigator.clipboard.writeText(t).then(()=>alert(`✅ ${id.toUpperCase()} disalin`));
}
function updateCheckout(){
  const total=keranjang.reduce((s,p)=>s+p.harga,0);
  document.getElementById('totalBayar').textContent=`Rp${total.toLocaleString()}`;
  const method=document.getElementById('paymentMethod').value;
  const daftar=keranjang.map((p,i)=>`${i+1}. ${p.nama} - Rp${p.harga.toLocaleString()}`).join('\n');
  const pesan=`Pesanan:\n${daftar}\n\nTotal: Rp${total.toLocaleString()}\nPembayaran via: ${method}\n\nSaya sudah transfer via ${method}.`;
  document.getElementById('waCheckout').href=`https://wa.me/6283131810087?text=${encodeURIComponent(pesan)}`;
  alert('Link WA siap');
}

// checkoutWA, cetakPDF, updateDashboard, editLogin, search filter (sama seperti sebelumnya)

updateMenu();
showPage('produk');
