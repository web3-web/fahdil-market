// Ambil produk.json + produk lokal
let jsonProduk = [], localProduk = JSON.parse(localStorage.getItem("localProduk")) || [];
let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
let vouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
let loginData = JSON.parse(localStorage.getItem("loginData")) || {
  pemilik:{user:"FAHDiL",pass:"WEB ADMIN GANTENG.1"},
  owner:{user:"OWNERKU",pass:"OWNER MASUK 1"}
};
let userLogin = null;
const sidebar = document.getElementById("sidebar");

// Load JSON
fetch("data/produk.json")
  .then(r=>r.json())
  .then(d=>{ jsonProduk=d; renderProduk(); updateDashboard(); })
  .catch(e=>console.error(e));

// Toggle sidebar
document.getElementById("toggleSidebar")?.addEventListener("click",()=>sidebar.classList.toggle("active"));

// Auto-close sidebar on menu click
document.querySelectorAll("nav.sidebar ul li[data-page]").forEach(li=>{
  li.addEventListener("click",()=>sidebar.classList.remove("active"));
});

// Navigation
function showPage(id){
  document.querySelectorAll(".halaman").forEach(h=>h.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  if(id==="produk")renderProduk();
  if(id==="keranjang")renderKeranjang();
  if(id==="wishlist")renderWishlist();
  if(id==="riwayat")renderRiwayat();
  if(id==="voucher")renderVoucher();
  if(id==="dashboard")updateDashboard();
}

// Login/Logout
function login(role){
  const u=document.getElementById(role+"User").value;
  const p=document.getElementById(role+"Pass").value;
  if(loginData[role]&&u===loginData[role].user&&p===loginData[role].pass){
    userLogin=role; alert("Login "+role+" berhasil"); showPage("dashboard");
  } else alert("Login gagal");
}
function logout(){ userLogin=null; alert("Logout"); showPage("produk"); }

// Render produk gabungan
function renderProduk(){
  const c=document.getElementById("produkContainer");
  c.innerHTML="";
  const all=[...localProduk,...jsonProduk];
  all.forEach((p,i)=>{
    const d=document.createElement("div"); d.className="produk-card";
    d.innerHTML=`
      <img src="${p.gambar}" alt="${p.nama}">
      <h3>${p.nama}</h3><p>Rp${p.harga}</p><p>Stok:${p.stok}</p>
      <button onclick="tambahKeranjang(${i})">🛒</button>
      <button onclick="tambahWishlist(${i})">❤️</button>
      ${userLogin?`<button onclick="editProduk(${i})">✏️</button>`:""}
    `;
    c.appendChild(d);
  });
}

// Tambah produk lokal
document.getElementById("formTambah")?.addEventListener("submit",e=>{
  e.preventDefault();
  const n=document.getElementById("namaProduk").value;
  const h=+document.getElementById("hargaProduk").value;
  const s=+document.getElementById("stokProduk").value;
  const k=document.getElementById("kategoriProduk").value;
  const f=document.getElementById("gambarProduk").files[0];
  if(!n||!f)return alert("Nama & gambar wajib");
  const r=new FileReader(); r.onload=()=>{
    localProduk.push({nama:n,harga:h,stok:s,kategori:k,gambar:r.result});
    localStorage.setItem("localProduk",JSON.stringify(localProduk));
    alert("Produk ditambahkan"); renderProduk(); showPage("produk");
  }; r.readAsDataURL(f);
});

// Edit produk lokal
function editProduk(i){
  if(i>=localProduk.length) return alert("Hanya produk lokal");
  const p=localProduk[i];
  ["namaProduk","hargaProduk","stokProduk","kategoriProduk"].forEach(id=>document.getElementById(id).value=p[id.replace("Produk","").toLowerCase()]);
  localProduk.splice(i,1);
  localStorage.setItem("localProduk",JSON.stringify(localProduk));
  showPage("tambah");
}

// Keranjang/Wishlist/Riwayat
function tambahKeranjang(i){ const all=[...localProduk,...jsonProduk]; keranjang.push(all[i]); localStorage.setItem("keranjang",JSON.stringify(keranjang));alert("Masuk keranjang");}
function renderKeranjang(){document.getElementById("keranjangContainer").innerHTML=keranjang.map(p=>`<div>${p.nama}-Rp${p.harga}</div>`).join("");}
function tambahWishlist(i){const all=[...localProduk,...jsonProduk]; wishlist.push(all[i]); localStorage.setItem("wishlist",JSON.stringify(wishlist));alert("Masuk favorit");}
function renderWishlist(){document.getElementById("wishlistContainer").innerHTML=wishlist.map(p=>`<div>${p.nama}</div>`).join("");}
function renderRiwayat(){document.getElementById("riwayatContainer").innerHTML=riwayat.map(p=>`<div>${p.nama}-Rp${p.harga}</div>`).join("");}

// Checkout WA & Struk
function checkoutWA(){ lastOrder=keranjang.slice(); const txt=keranjang.map(p=>`${p.nama}-Rp${p.harga}`).join("\n"); window.open(`https://wa.me/6283131810087?text=${encodeURIComponent(txt)}`); riwayat.push(...keranjang); localStorage.setItem("riwayat",JSON.stringify(riwayat)); keranjang=[]; localStorage.setItem("keranjang","[]"); renderKeranjang();}
function cetakPDF(){const doc=new window.jspdf.jsPDF();(lastOrder.length?lastOrder:riwayat).forEach((p,i)=>doc.text(`${p.nama}-Rp${p.harga}`,10,10+i*10));doc.save("struk.pdf");}

// Voucher
function renderVoucher(){document.getElementById("voucherList").innerHTML=vouchers.map(v=>`<div>${v.kode}-${v.diskon}%</div>`).join("");}
document.getElementById("formVoucher")?.addEventListener("submit",e=>{e.preventDefault();const k=document.getElementById("kodeVoucher").value;const d=+document.getElementById("diskonVoucher").value;vouchers.push({kode:k,diskon:d}); localStorage.setItem("vouchers",JSON.stringify(vouchers)); renderVoucher();});

// Dashboard & Pengaturan
function updateDashboard(){document.getElementById("jumlahProduk").textContent=localProduk.length+jsonProduk.length;}
function editLogin(){if(!userLogin) return alert("Login dulu"); const u=document.getElementById("editUsername").value;const p=document.getElementById("editPassword").value;if(!u||!p)return alert("Isi keduanya");loginData[userLogin]={user:u,pass:p}; localStorage.setItem("loginData",JSON.stringify(loginData));alert("Login diperbarui");}

// Search
document.getElementById("searchInput")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();document.querySelectorAll(".produk-card").forEach(c=>{const t=c.querySelector("h3")?.textContent.toLowerCase();c.style.display=t&&t.includes(q)?"block":"none";});});

// Init
showPage("produk"); renderProduk(); renderKeranjang(); renderWishlist(); renderRiwayat(); renderVoucher(); updateDashboard();
