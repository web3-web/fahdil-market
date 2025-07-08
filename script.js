// File: script.js (loaded with defer)

// — Supabase client
const SUPA = window.SUPA;

// — Init localStorage keys
['keranjang','wishlist','riwayat','vouchers','pendingConfirm'].forEach(k=>{
  if (localStorage.getItem(k)===null) localStorage.setItem(k,'[]');
});

// — State
let keranjang       = JSON.parse(localStorage.getItem('keranjang'));
let wishlist        = JSON.parse(localStorage.getItem('wishlist'));
let riwayat         = JSON.parse(localStorage.getItem('riwayat'));
let vouchers        = JSON.parse(localStorage.getItem('vouchers'));
let pendingConfirm  = JSON.parse(localStorage.getItem('pendingConfirm'));

const loginData = {
  pemilik: { user:'FAHDiL',   pass:'WEB_ADMIN_123' },
  owner:   { user:'OWNERKU',  pass:'OWNER_PASS' }
};
let userLogin   = null;
let appliedDisc = 0;

// — DOM refs
const sidebar         = document.getElementById('sidebar');
const toggleSidebar   = document.getElementById('toggleSidebar');
const searchInput     = document.getElementById('searchInput');
const produkContainer = document.getElementById('produkContainer');

// — Admin pages
const adminPages = ['tambah','voucher','dashboard','pengaturan','struk','konfirmasi'];
const isAdmin    = () => ['pemilik','owner'].includes(userLogin);

// — Update sidebar menu visibility
function updateMenu(){
  document.querySelectorAll('nav#sidebar li[data-page]').forEach(li=>{
    const page = li.getAttribute('data-page');
    if (adminPages.includes(page)){
      li.style.display = isAdmin() ? 'block' : 'none';
    }
    if (page==='login-pemilik'||page==='login-owner'){
      li.style.display = isAdmin() ? 'none' : 'block';
    }
  });
}

// — Sidebar toggle & autoclose
toggleSidebar.addEventListener('click',()=>sidebar.classList.toggle('active'));
document.querySelectorAll('nav#sidebar li[data-page]').forEach(li=>
  li.addEventListener('click',()=>sidebar.classList.remove('active'))
);

// — Page navigation with guard
window.showPage = id=>{
  if (adminPages.includes(id) && !isAdmin()){
    alert('Silakan login sebagai Pemilik/Owner terlebih dahulu.');
    id='login-pemilik';
  }
  document.querySelectorAll('.halaman').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  if (id==='produk') loadProduk();
  if (id==='checkout') updateCheckout();
  if (id==='konfirmasi') renderKonfirmasi();
};

// — Login / Logout
window.login = role=>{
  const u=document.getElementById(role+'User').value;
  const p=document.getElementById(role+'Pass').value;
  if (loginData[role]&&u===loginData[role].user&&p===loginData[role].pass){
    userLogin=role; alert('Login berhasil');
    updateMenu(); showPage('dashboard'); updateDashboard();
  } else alert('Login gagal');
};
window.logout=()=>{
  userLogin=null; appliedDisc=0; alert('Logout berhasil');
  updateMenu(); showPage('produk');
};

// — Load & render produk
async function loadProduk(){
  produkContainer.innerHTML='⏳ Memuat produk...';
  const {data,error}=await SUPA.from('produk').select('*').order('id',{ascending:false});
  if (error){ produkContainer.innerHTML='<p>⚠️ Gagal memuat produk</p>'; return; }
  produkContainer.innerHTML=data.map(p=>`
    <div class="produk-card">
      <img src="${p.gambar}" alt="${p.nama}"><h3>${p.nama}</h3>
      <p>Rp${p.harga}</p>
      ${isAdmin()?`<button onclick="prepareEdit(${p.id})" class="btn warna-warni">✏️ Edit</button>`:''}
      <button onclick="tambahKeranjang(${p.id})" class="btn warna-warni">🛒 Beli</button>
      <button onclick="tambahWishlist(${p.id})" class="btn warna-warni">❤️</button>
    </div>
  `).join('');
  searchInput.dispatchEvent(new Event('input'));
}
loadProduk();

// — Prepare edit
window.prepareEdit=async id=>{
  const {data:p}=await SUPA.from('produk').select('*').eq('id',id).single();
  ['namaProduk','hargaProduk','stokProduk','kategoriProduk'].forEach(f=>
    document.getElementById(f).value=p[f.replace('Produk','')]||p[f]
  );
  showPage('tambah');
  document.getElementById('formTambah').onsubmit=async e=>{
    e.preventDefault();
    await SUPA.from('produk').update({
      nama:document.getElementById('namaProduk').value,
      harga:+document.getElementById('hargaProduk').value,
      stok:+document.getElementById('stokProduk').value,
      kategori:document.getElementById('kategoriProduk').value
    }).eq('id',id);
    alert('Produk diperbarui'); loadProduk(); showPage('produk');
    document.getElementById('formTambah').onsubmit=submitForm;
  };
};

// — Submit baru
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
    alert('Produk disimpan'); loadProduk(); showPage('produk');
  };
  if(file)reader.readAsDataURL(file);
}
document.getElementById('formTambah').addEventListener('submit',submitForm);

// — Keranjang
window.tambahKeranjang=async id=>{
  const{data:p}=await SUPA.from('produk').select('*').eq('id',id).single();
  keranjang.push(p); localStorage.setItem('keranjang',JSON.stringify(keranjang)); renderKeranjang();
};
function renderKeranjang(){
  document.getElementById('keranjangContainer').innerHTML=
    keranjang.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
}

// — Wishlist
window.tambahWishlist=async id=>{
  const{data:p}=await SUPA.from('produk').select('*').eq('id',id).single();
  wishlist.push(p); localStorage.setItem('wishlist',JSON.stringify(wishlist)); renderWishlist();
};
function renderWishlist(){
  document.getElementById('wishlistContainer').innerHTML=
    wishlist.map(p=>`<div>${p.nama}</div>`).join('');
}

// — Riwayat
function renderRiwayat(){
  document.getElementById('riwayatContainer').innerHTML=
    riwayat.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
}

// — Voucher
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
  if(!v)return alert('Voucher tidak ditemukan');
  appliedDisc=v.diskon; document.getElementById('statusVoucher').textContent=`Diskon ${v.diskon}%`;
  alert('Voucher diterapkan');
};

// — Salin & Update Checkout
function salin(id){
  const t=document.getElementById(id).textContent;
  navigator.clipboard.writeText(t).then(()=>alert(`✅ ${id.toUpperCase()} disalin: ${t}`));
}
function updateCheckout(){
  const total=keranjang.reduce((s,p)=>s+p.harga,0);
  document.getElementById('totalBayar').textContent=`Rp${total.toLocaleString()}`;
  const list=keranjang.map(p=>`${p.nama} - Rp${p.harga.toLocaleString()}`).join('\n');
  const msg=`${list}\n\nTotal: Rp${total.toLocaleString()}\n\nSaya sudah transfer via bank. Mohon konfirmasi.`;
  document.getElementById('waCheckout').href=`https://wa.me/6283131810087?text=${encodeURIComponent(msg)}`;
}

// — Konfirmasi Manual (Admin)
function renderKonfirmasi(){
  const c=document.getElementById('konfirmasiContainer');
  if(!pendingConfirm.length){c.innerHTML='<p>Tidak ada order menunggu konfirmasi.</p>';return;}
  c.innerHTML=pendingConfirm.map(o=>`
    <div class="konf-card">
      <p><strong>${o.nama}</strong> — Rp${o.total.toLocaleString()}</p>
      <p><small>${o.waktu}</small></p>
      ${o.dibayar
        ?'<span class="status-paid">✔️ Sudah Dibayar</span>'
        :(`<button onclick="confirmOrder(${o.id})" class="btn warna-warni">Konfirmasi</button>
           <button onclick="rejectOrder(${o.id})" class="btn warna-warni">Tolak</button>`)}
    </div>
  `).join('');
}
window.confirmOrder=id=>{
  pendingConfirm=pendingConfirm.map(o=>o.id===id?{...o,dibayar:true}:o);
  localStorage.setItem('pendingConfirm',JSON.stringify(pendingConfirm));
  const paid=pendingConfirm.find(o=>o.id===id);
  if(paid){riwayat.push({nama:paid.nama,harga:paid.total});localStorage.setItem('riwayat',JSON.stringify(riwayat));}
  renderKonfirmasi();
};
window.rejectOrder=id=>{
  pendingConfirm=pendingConfirm.filter(o=>o.id!==id);
  localStorage.setItem('pendingConfirm',JSON.stringify(pendingConfirm));
  renderKonfirmasi();
};

// — Checkout & Cetak
window.checkoutWA=()=>{
  let cart=[...keranjang];if(appliedDisc)cart=cart.map(p=>({...p,harga:Math.round(p.harga*(100-appliedDisc)/100)}));
  const teks=cart.map(p=>`${p.nama} - Rp${p.harga}`).join('\n');
  window.open(`https://wa.me/6283131810087?text=${encodeURIComponent(teks)}`);
  riwayat.push(...cart);localStorage.setItem('riwayat',JSON.stringify(riwayat));
  keranjang=[];localStorage.setItem('keranjang','[]');renderKeranjang();appliedDisc=0;
};
window.cetakPDF=(()=>{const{jsPDF}=window.jspdf;return()=>{const d=new jsPDF();keranjang.forEach((p,i)=>d.text(`${p.nama} - Rp${p.harga}`,10,10+i*10));d.save('struk.pdf');}})();

// — Dashboard & Pengaturan
function updateDashboard(){
  document.getElementById('jumlahProduk').textContent=produkContainer.children.length;
  const tot=riwayat.reduce((a,p)=>a+p.harga,0);
  document.getElementById('totalOmzet').textContent=`Rp${tot}`;
}
window.editLogin=()=>{
  if(!userLogin)return alert('Login dulu');
  loginData[userLogin]={user:document.getElementById('editUsername').value,pass:document.getElementById('editPassword').value};
  alert('Login diperbarui');
};

// — Cari Produk
searchInput.addEventListener('input',()=>{const q=searchInput.value.toLowerCase();document.querySelectorAll('.produk-card').forEach(c=>{c.style.display=c.querySelector('h3').textContent.toLowerCase().includes(q)?'block':'none';});});

// — Inisialisasi & Default Page
updateMenu();
showPage('produk');
