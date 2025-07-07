// ============================
// FAHDiL Market - script.js
// ============================

// Ambil produk dari GitHub JSON
let produk = [];
let urlProduk = "https://raw.githubusercontent.com/web3-web/fahdil-market/utama/data/produk.json";

// Fetch data produk dari GitHub
fetch(urlProduk)
  .then(res => res.json())
  .then(data => {
    produk = data;
    renderProduk();
    updateDashboard();
  })
  .catch(err => {
    console.error("Gagal memuat data produk:", err);
  });

// Data lainnya
let keranjang = JSON.parse(localStorage.getItem("keranjang")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
let vouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
let loginData = JSON.parse(localStorage.getItem("loginData")) || {
  pemilik: { user: "FAHDiL", pass: "WEB ADMIN GANTENG.1" },
  owner: { user: "OWNERKU", pass: "OWNER MASUK 1" }
};
let userLogin = null;

// ===================
// Navigasi
// ===================
function showPage(id) {
  document.querySelectorAll(".halaman").forEach((h) => h.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  if (id === "produk") renderProduk();
  if (id === "keranjang") renderKeranjang();
  if (id === "wishlist") renderWishlist();
  if (id === "riwayat") renderRiwayat();
  if (id === "voucher") renderVoucher();
  if (id === "dashboard") updateDashboard();
}

// ===================
// Login
// ===================
function login(role) {
  const user = document.getElementById(role + "User").value;
  const pass = document.getElementById(role + "Pass").value;
  if (user === loginData[role].user && pass === loginData[role].pass) {
    alert("Login berhasil sebagai " + role.toUpperCase());
    userLogin = role;
    showPage("dashboard");
  } else {
    alert("Login gagal!");
  }
}

function logout() {
  userLogin = null;
  alert("Logout berhasil");
  showPage("produk");
}

// ===================
// Tampilkan Produk
// ===================
function renderProduk() {
  const container = document.getElementById("produkContainer");
  container.innerHTML = "";

  produk.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "produk-card";
    card.innerHTML = `
      <img src="${p.gambar}" alt="${p.nama}" />
      <h3>${p.nama}</h3>
      <p>Rp${p.harga}</p>
      <p>Stok: ${p.stok}</p>
      <p>Kategori: ${p.kategori}</p>
      <button onclick="tambahKeranjang(${i})">Beli</button>
      <button onclick="tambahWishlist(${i})">❤️</button>
    `;
    container.appendChild(card);
  });
}

// ===================
// Fungsi Keranjang
// ===================
function tambahKeranjang(i) {
  keranjang.push(produk[i]);
  localStorage.setItem("keranjang", JSON.stringify(keranjang));
  alert("Ditambahkan ke keranjang");
}

function renderKeranjang() {
  const cont = document.getElementById("keranjangContainer");
  cont.innerHTML = keranjang.map((p) => `<div>${p.nama} - Rp${p.harga}</div>`).join("");
}

// ===================
// Fungsi Wishlist
// ===================
function tambahWishlist(i) {
  wishlist.push(produk[i]);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  alert("Ditambahkan ke favorit");
}

function renderWishlist() {
  const cont = document.getElementById("wishlistContainer");
  cont.innerHTML = wishlist.map((p) => `<div>${p.nama}</div>`).join("");
}

// ===================
// Fungsi Riwayat
// ===================
function renderRiwayat() {
  const cont = document.getElementById("riwayatContainer");
  cont.innerHTML = riwayat.map((p) => `<div>${p.nama} - Rp${p.harga}</div>`).join("");
}

// ===================
// WA Checkout
// ===================
function checkoutWA() {
  const teks = keranjang.map((p) => `${p.nama} - Rp${p.harga}`).join("\n");
  window.open("https://wa.me/6283131810087?text=Pesanan:\n" + encodeURIComponent(teks));
  riwayat.push(...keranjang);
  keranjang = [];
  localStorage.setItem("riwayat", JSON.stringify(riwayat));
  localStorage.setItem("keranjang", JSON.stringify([]));
  renderKeranjang();
}

// ===================
// Cetak PDF
// ===================
function cetakPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  keranjang.forEach((p, i) => {
    doc.text(`${p.nama} - Rp${p.harga}`, 10, 10 + i * 10);
  });
  doc.save("struk_FAHDIL.pdf");
}

// ===================
// Voucher
// ===================
function renderVoucher() {
  const list = document.getElementById("voucherList");
  list.innerHTML = vouchers.map((v) => `<div>${v.kode} - ${v.diskon}%</div>`).join("");
}

document.getElementById("formVoucher")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const kode = document.getElementById("kodeVoucher").value;
  const diskon = parseInt(document.getElementById("diskonVoucher").value);
  vouchers.push({ kode, diskon });
  localStorage.setItem("vouchers", JSON.stringify(vouchers));
  renderVoucher();
});

// ===================
// Dashboard
// ===================
function updateDashboard() {
  document.getElementById("jumlahProduk").textContent = produk.length;
  let total = riwayat.reduce((sum, p) => sum + p.harga, 0);
  document.getElementById("totalOmzet").textContent = "Rp" + total;
}

// ===================
// Edit Login
// ===================
function editLogin() {
  if (!userLogin) return alert("Login dulu!");
  const user = document.getElementById("editUsername").value;
  const pass = document.getElementById("editPassword").value;
  if (user && pass) {
    loginData[userLogin] = { user, pass };
    localStorage.setItem("loginData", JSON.stringify(loginData));
    alert("Username & Password diperbarui");
  }
}

// ===================
// Sidebar Navigasi
// ===================
const sidebar = document.getElementById("sidebar");
document.getElementById("toggleSidebar")?.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// ===================
// Pencarian Produk
// ===================
const searchInput = document.getElementById("searchInput");
searchInput?.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  document.querySelectorAll(".produk-card").forEach((el) => {
    const name = el.querySelector("h3").textContent.toLowerCase();
    el.style.display = name.includes(q) ? "block" : "none";
  });
});
