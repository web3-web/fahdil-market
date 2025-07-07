// File: script.js – Final dengan Admin Guard & Voucher
(function(){
  document.addEventListener('DOMContentLoaded',()=>{
    // Storage fallback
    let storage;
    try { storage=localStorage;}catch{storage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v}}}
    const load=(k,def)=>{try{const v=storage.getItem(k);return v?JSON.parse(v):def}catch{return def}},
          save=(k,v)=>{try{storage.setItem(k,JSON.stringify(v))}catch{}}

    // Data
    let jsonProduk=[], localProduk=load('localProduk',[]), keranjang=load('keranjang',[]),
        wishlist=load('wishlist',[]), riwayat=load('riwayat',[]), vouchers=load('vouchers',[]),
        loginData=load('loginData',{pemilik:{user:'FAHDiL',pass:'WEB ADMIN GANTENG.1'},owner:{user:'OWNERKU',pass:'OWNER MASUK 1'}}),
        userLogin=null, appliedDisc=0;
    const sidebar=document.getElementById('sidebar');

    // Fetch JSON
    fetch('data/produk.json').then(r=>r.json()).then(d=>{jsonProduk=d;renderProduk();updateDashboard();}).catch(console.error);

    // Sidebar toggle
    document.getElementById('toggleSidebar')?.addEventListener('click',()=>sidebar.classList.toggle('active'));    
    // Autoclose
    document.querySelectorAll('nav.sidebar li[data-page]').forEach(li=>li.addEventListener('click',()=>sidebar.classList.remove('active')));

    // Guard
    const adminPages=['tambah','voucher','dashboard','pengaturan','struk'], isAdmin=()=>userLogin==='pemilik'||userLogin==='owner';
    const updateMenu=()=>{
      document.querySelectorAll('nav.sidebar li[data-page]').forEach(li=>{
        const p=li.getAttribute('data-page');
        if(adminPages.includes(p)) li.style.display=isAdmin()?'block':'none';
        if(p==='login-pemilik'||p==='login-owner') li.style.display=isAdmin()?'none':'block';
      });
    };
    updateMenu();

    // showPage
    window.showPage=id=>{if(adminPages.includes(id)&&!isAdmin())return showPage('login-pemilik');
      document.querySelectorAll('.halaman').forEach(s=>s.classList.remove('active'));
      document.getElementById(id)?.classList.add('active');
      sidebar.classList.remove('active');
      if(id==='produk')renderProduk();if(id==='keranjang')renderKeranjang();
      if(id==='wishlist')renderWishlist();if(id==='riwayat')renderRiwayat();
      if(id==='voucher')renderVoucher();if(id==='dashboard')updateDashboard();
    };

    // login/logout
    window.login=role=>{const u=document.getElementById(role+'User').value,p=document.getElementById(role+'Pass').value;
      if(loginData[role]&&u===loginData[role].user&&p===loginData[role].pass){userLogin=role;save('loginData',loginData);
        alert('Login '+role+' berhasil');updateMenu();showPage('dashboard');}else alert('Login gagal');};
    window.logout=()=>{userLogin=null;appliedDisc=0;document.getElementById('statusVoucher').textContent='Tidak Ada';
      alert('Logout berhasil');updateMenu();showPage('produk');};

    // renderProduk
    window.renderProduk=()=>{const c=document.getElementById('produkContainer');if(!c)return;c.innerHTML='';
      [...localProduk,...jsonProduk].forEach((p,i)=>{const d=document.createElement('div');d.className='produk-card';
        d.innerHTML=`<img src="${p.gambar}"/><h3>${p.nama}</h3><p>Rp${p.harga}</p><p>Stok:${p.stok}</p>
          <button onclick="tambahKeranjang(${i})">🛒</button><button onclick="tambahWishlist(${i})">❤️</button>
          ${isAdmin()?`<button onclick="editProduk(${i})">✏️</button>`:''}`;
        c.appendChild(d);
      });
    };

    // formTambah
    document.getElementById('formTambah')?.addEventListener('submit',e=>{e.preventDefault();
      const n=document.getElementById('namaProduk').value,h=+document.getElementById('hargaProduk').value,s=+document.getElementById('stokProduk').value,k=document.getElementById('kategoriProduk').value,f=document.getElementById('gambarProduk').files[0];
      if(!n||!f)return alert('Nama & gambar wajib');const r=new FileReader();r.onload=()=>{localProduk.push({nama:n,harga:h,stok:s,kategori:k,gambar:r.result});save('localProduk',localProduk);
        alert('Produk ditambahkan');renderProduk();showPage('produk');};r.readAsDataURL(f);
    });

    window.editProduk=i=>{if(i>=localProduk.length)return alert('Hanya produk lokal');const p=localProduk[i];
      ['namaProduk','hargaProduk','stokProduk','kategoriProduk'].forEach(id=>document.getElementById(id).value=p[id.replace('Produk','').toLowerCase()]);
      localProduk.splice(i,1);save('localProduk',localProduk);showPage('tambah');};

    // cart,wishlist,riwayat
    window.tambahKeranjang=i=>{const p=[...localProduk,...jsonProduk][i];keranjang.push(p);save('keranjang',keranjang);alert('Keranjang');};
    window.renderKeranjang=()=>document.getElementById('keranjangContainer').innerHTML=keranjang.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');
    window.tambahWishlist=i=>{const p=[...localProduk,...jsonProduk][i];wishlist.push(p);save('wishlist',wishlist);alert('Favorit');};
    window.renderWishlist=()=>document.getElementById('wishlistContainer').innerHTML=wishlist.map(p=>`<div>${p.nama}</div>`).join('');
    window.renderRiwayat=()=>document.getElementById('riwayatContainer').innerHTML=riwayat.map(p=>`<div>${p.nama} - Rp${p.harga}</div>`).join('');

    // voucher apply
    window.applyVoucher=()=>{const code=document.getElementById('applyVoucher').value.trim();const v=vouchers.find(x=>x.kode===code);
      if(!v)return alert('Voucher tidak ditemukan');appliedDisc=v.diskon;document.getElementById('statusVoucher').textContent=`Kode ${code} — Diskon ${v.diskon}%`;alert('Voucher diterapkan');};

    // checkout
    window.checkoutWA=()=>{let cart=[...keranjang];if(appliedDisc)cart=cart.map(p=>({...p,harga:Math.round(p.harga*(100-appliedDisc)/100)}));const txt=cart.map(p=>`${p.nama} - Rp${p.harga}`).join('\n');window.open(`https://wa.me/6283131810087?text=${encodeURIComponent(txt)}`);
      riwayat.push(...cart);save('riwayat',riwayat);keranjang=[];save('keranjang',keranjang);renderKeranjang();appliedDisc=0;document.getElementById('statusVoucher').textContent='Tidak Ada';};
    window.cetakPDF=()=>{const doc=new window.jspdf.jsPDF();keranjang.forEach((p,i)=>doc.text(`${p.nama} - Rp${p.harga}`,10,10+i*10));doc.save('struk.pdf');};

    // voucher render
    window.renderVoucher=()=>document.getElementById('voucherList').innerHTML=vouchers.map(v=>`<div>${v.kode} — ${v.diskon}%</div>`).join('');
    document.getElementById('formVoucher')?.addEventListener('submit',e=>{e.preventDefault();const k=document.getElementById('kodeVoucher').value;const d=+document.getElementById('diskonVoucher').value;vouchers.push({kode:k,diskon:d});save('vouchers',vouchers);renderVoucher();});

    // dashboard & editLogin
    window.updateDashboard=()=>document.getElementById('jumlahProduk').textContent=localProduk.length+jsonProduk.length;
    window.editLogin=()=>{if(!userLogin)return alert('Login dulu');const u=document.getElementById('editUsername').value,p=document.getElementById('editPassword').value;if(!u||!p)return alert('Isi username & password baru');loginData[userLogin]={user:u,pass:p};save('loginData',loginData);alert('Login diperbarui');};

    // search
    document.getElementById('searchInput')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.produk-card').forEach(c=>{const t=c.querySelector('h3')?.textContent.toLowerCase();c.style.display=t&&t.includes(q)?'block':'none';});});

    // init all
    showPage('produk');renderProduk();renderKeranjang();renderWishlist();renderRiwayat();renderVoucher();updateDashboard();
  });
})();
