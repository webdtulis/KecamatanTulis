const defaultCenter = [-6.94, 109.81];
const defaultZoom = 13;

// MENONAKTIFKAN TOMBOL ZOOM (+ / -)
const map = L.map('map', { zoomControl: false }).setView(defaultCenter, defaultZoom);

L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: 'Google Satellite' }).addTo(map);

map.createPane('paneMasking'); map.getPane('paneMasking').style.zIndex = 350; map.getPane('paneMasking').style.pointerEvents = 'none';
map.createPane('paneDesa'); map.getPane('paneDesa').style.zIndex = 400; 

const grupDesaKKN = L.featureGroup().addTo(map);
const grupIkonPotensi = L.featureGroup().addTo(map); 
let layerMasking; 
let semuaLubangDesa = []; 
const batasDunia = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
const daftarWarna = ['#FFD166', '#06D6A0', '#EF476F', '#118AB2', '#F78C6B', '#83D475', '#FF9F1C', '#CB4335', '#2ECC71', '#F39C12'];
let indeksWarna = 0;
let desaTerpilih = null;
let radarChartInstance = null; 

// VARIABEL GAME SYSTEM
let bgmPlaying = false;
let currentTime = 0; // 0: Siang, 1: Sore, 2: Malam
let currentWeather = 0; // 0: Cerah, 1: Hujan, 2: Daun Gugur
let weatherInterval;

// ==========================================
// SISTEM MISI OTOMATIS (DYNAMIC QUEST SYSTEM)
// ==========================================
let questActive = false;
let misiSaatIni = null; 

// Index array statistik: [0: Pertanian, 1: Kelautan, 2: UMKM, 3: Pariwisata, 4: Infrastruktur]
const daftarKategori = ["Pertanian", "Kelautan", "UMKM", "Pariwisata", "Infrastruktur"];
const awalanCerita = [
    "Wali kota sedang mencari rekomendasi!",
    "Investor luar kota sedang melirik wilayah kita!",
    "Sekelompok turis butuh petunjuk jalan!",
    "Dinas daerah butuh laporan KKN cepat!",
    "Penduduk desa tetangga butuh studi banding!"
];

/// ==========================================
// KAMUS DATA (Update Real KKN 2026)
// Statistik urutannya: [Pertanian, Kelautan, UMKM, Pariwisata, Infrastruktur] (Skala 0-100)
// ==========================================
const dataDetailDesa = {
    "Tulis": { 
        deskripsi: "Desa Tulis memiliki potensi besar sebagai pusat pertumbuhan wilayah dan kawasan investasi strategis berkat dukungan lokasi dan perkembangan infrastruktur di sekitarnya, termasuk pengaruh dari Kawasan Industri Terpadu Batang (KITB).", 
        potensiUtama: "Infrastruktur", 
        icon: "🏭", 
        statistik: [50, 10, 85, 30, 96], 
        logo: "tulis.png" 
    },
    "Beji": { 
        deskripsi: "Desa Beji memiliki potensi utama di bidang perkebunan dan pertanian, termasuk sentra pembibitan kelapa nasional, lokasi penunjang kawasan industri strategis, serta pasar tradisional yang menggerakkan ekonomi lokal.", 
        potensiUtama: "Pertanian", 
        icon: "🌴", 
        statistik: [90, 5, 80, 30, 75], 
        logo: "beji.png" 
    },
    "Wringingintung": { 
        deskripsi: "Desa Wringingintung memiliki potensi utama pada sektor pertanian, perdagangan, dan industri, serta letaknya yang strategis sebagai jalur pendukung kawasan industri Batang Industrial Park (BIP).", 
        potensiUtama: "Infrastruktur", 
        icon: "🛣️", 
        statistik: [85, 0, 75, 20, 88], 
        logo: "wringingintung.png" 
    },
    "Jrakahpayung": { 
        deskripsi: "Desa Jrakahpayung memiliki potensi utama di sektor pertanian, peternakan, serta pengolahan produk lokal seperti UMKM ikan asap dan BUMDes telur asin, yang terus dikembangkan melalui penataan data profil desa serta program pengelolaan lingkungan mandiri.", 
        potensiUtama: "UMKM", 
        icon: "🧺", 
        statistik: [85, 60, 95, 30, 60], 
        logo: "jrakahpayung.png" 
    },
    "Kaliboyo": { 
        deskripsi: "Desa Kaliboyo memiliki Potensi yang meliputi letak geografis yang sangat strategis, perkembangan sektor perdagangan serta industri pengolahan, serta potensi wisata tirta arung jeram (rafting) di aliran Sungai Kaliboyo.", 
        potensiUtama: "Pariwisata", 
        icon: "🛶", 
        statistik: [40, 30, 70, 95, 75], 
        logo: "kaliboyo.png" 
    },
    "Kebumen": { 
        deskripsi: "Desa Kebumen memiliki potensi utama di sektor pertanian, letak geografis yang strategis dekat jalur Pantura, serta perkonomian warga yang ditopang oleh aktivitas buruh, perdagangan, dan pegawai.", 
        potensiUtama: "UMKM", 
        icon: "🏪", 
        statistik: [80, 0, 85, 20, 80], 
        logo: "kebumen.png" 
    },
    "Kedungsegog": { 
        deskripsi: "Desa Kedungsegog memiliki potensi besar pada sektor pertanian dengan lahan sawah seluas 164 hektare dan tegalan atau lahan kering seluas 212 hektare. Sektor ekonomi warga juga ditopang oleh produk unggulan olahan pangan seperti UMKM telur asin dan aneka produk lokal.", 
        potensiUtama: "Pertanian", 
        icon: "🌾", 
        statistik: [98, 30, 85, 10, 60], 
        logo: "" 
    },
    "Posong": { 
        deskripsi: "Desa Posong memiliki potensi besar pada sektor perkebunan dan pertanian, serta letak strategis yang bersinggungan langsung dengan kawasan Proyek Strategis Nasional Kawasan Industri Terpadu Batang (KITB).", 
        potensiUtama: "Infrastruktur", 
        icon: "🚜", 
        statistik: [80, 0, 60, 20, 90], 
        logo: "posong.png" 
    },
    "Sembojo": { 
        deskripsi: "Desa Sembojo memiliki potensi besar pada sektor pertaniaan, perkebunan, serta letak strategis yang masuk dalam kawasan pengembangan Kawasan Industri Terpadu Batang (KITB). Desa ini juga terpilih menjadi lokasi program gerai Koperasi Desa Merah Putih untuk menggerakkan ekonomi warga.", 
        potensiUtama: "UMKM", 
        icon: "🤝", 
        statistik: [85, 0, 88, 20, 85], 
        logo: "sembojo.png" 
    },
    "Simbangdesa": { 
        deskripsi: "Desa Simbangdesa memiliki potensi utama di sektor pertanian dan kelembagaan ekonomi desa melalui Badan Usaha Milik Desa (BUMDes) Simbang Jaya. Sebagian besar warga bekerja sebagai petani yang mengolah lahan subur, sementara pemerintah desa aktif mengembangkan kapasitas pengelolaan ekonomi dan ketahanan pangan.", 
        potensiUtama: "Pertanian", 
        icon: "🌱", 
        statistik: [88, 0, 85, 30, 60], 
        logo: "simbangdesa.png" 
    }
};

// Fungsi Meracik Misi Otomatis
function buatMisiOtomatis() {
    let indexKategori = Math.floor(Math.random() * daftarKategori.length);
    let namaKategori = daftarKategori[indexKategori];
    let skorTertinggi = -1;
    let targetDesa = "";

    // Cari skor tertinggi secara dinamis
    for (let desa in dataDetailDesa) {
        let skorDesaIni = dataDetailDesa[desa].statistik[indexKategori];
        if (skorDesaIni > skorTertinggi) {
            skorTertinggi = skorDesaIni;
            targetDesa = desa;
        }
    }

    let ceritaAcak = awalanCerita[Math.floor(Math.random() * awalanCerita.length)];
    return {
        target: targetDesa,
        text: `${ceritaAcak} Temukan desa dengan potensi ${namaKategori.toUpperCase()} paling tinggi (Skor ${skorTertinggi})!`
    };
}

// AUDIO PLAYER HELPER
function playSFX(id) {
    let audio = document.getElementById(id);
    if(audio) { audio.currentTime = 0; audio.play().catch(e=>console.log("SFX Blocked")); }
}

function renderGrafikRPG(dataStatistik) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy(); 
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Pertanian', 'Kelautan', 'UMKM', 'Pariwisata', 'Infrastruktur'],
            datasets: [{
                label: 'Status Desa', data: dataStatistik,
                backgroundColor: 'rgba(101, 163, 13, 0.4)', borderColor: '#3f6212', pointBackgroundColor: '#eab308', pointBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, layout: { padding: 20 },
            scales: { r: { angleLines: { color: 'rgba(92, 58, 33, 0.3)' }, grid: { color: 'rgba(92, 58, 33, 0.3)' }, pointLabels: { color: '#5c3a21', font: { family: 'Nunito', weight: 'bold', size: 11 } }, ticks: { display: false }, min: 0, max: 100 } },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#8b5a2b', titleFont: {family: 'Nunito'}, bodyFont: {family: 'Nunito'} } }
        }
    });
}

// PEMROSESAN DATA
if (typeof kumpulanDesaKKN !== 'undefined') {
    kumpulanDesaKKN.forEach(dataDesa => {
        const warnaDesa = daftarWarna[indeksWarna % daftarWarna.length];
        indeksWarna++;

        L.geoJSON(dataDesa, {
            pane: 'paneDesa', 
            style: function () { return { color: '#ffffff', weight: 2, fillColor: warnaDesa, fillOpacity: 0.35, dashArray: null }; },
            onEachFeature: function (feature, layer) {
                const namaDesa = feature.properties.NAMOBJ || "Desa KKN";
                const detail = dataDetailDesa[namaDesa] || { potensiUtama: "Umum", icon: "⭐", statistik: [50,50,50,50,50] };

                let lubangDesaIni = [];
                if (feature.geometry.type === "Polygon") { lubangDesaIni.push(feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]])); } 
                else if (feature.geometry.type === "MultiPolygon") { feature.geometry.coordinates.forEach(polygon => { lubangDesaIni.push(polygon[0].map(coord => [coord[1], coord[0]])); }); }
                layer.lubangMasking = lubangDesaIni;
                lubangDesaIni.forEach(lubang => semuaLubangDesa.push(lubang));

                // Ikon Potensi Melayang
                const centerPoint = layer.getBounds().getCenter();
                const iconMarker = L.marker(centerPoint, {
                    icon: L.divIcon({ className: '', html: `<div class="potensi-icon" title="${detail.potensiUtama}">${detail.icon}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] })
                }).addTo(grupIkonPotensi);

                const onClickAction = function () {
                    playSFX('audio-click'); 
                    desaTerpilih = layer; 
                    map.fitBounds(layer.getBounds(), { padding: [20, 20], animate: true, duration: 1.5 });
                    if (layerMasking) layerMasking.setLatLngs([batasDunia, ...layer.lubangMasking]);

                    grupDesaKKN.eachLayer(function (l) {
                        if (l === layer) { l.setStyle({ fillOpacity: 0.0, weight: 5, color: '#FFD700', dashArray: '12, 12' }); l.bringToFront(); } 
                        else { l.setStyle({ fillOpacity: 0.0, weight: 0, dashArray: null }); }
                    });

                    document.getElementById('info-title').innerText = "Desa " + namaDesa;
                    document.getElementById('info-desc').innerText = detail.deskripsi;
                    let elLogo = document.getElementById('info-logo');
                    if (detail.logo && detail.logo.trim() !== "") { elLogo.src = detail.logo; elLogo.style.display = "block"; } else { elLogo.style.display = "none"; }
                    
                    renderGrafikRPG(detail.statistik);
                    document.getElementById('info-panel').classList.add('tampil');

                    // PENGECEKAN MISI RAHASIA
                    if(questActive && misiSaatIni && namaDesa === misiSaatIni.target) {
                        playSFX('audio-success');
                        questActive = false; // Misi ditutup
                        misiSaatIni = null; 

                        let btnQuest = document.getElementById('btn-quest');
                        btnQuest.innerText = "✅ Misi Berhasil!";
                        setTimeout(() => { btnQuest.innerText = "📜 Papan Misi"; }, 3000); // Tombol kembali seperti semula
                        
                        let winObj = document.createElement('div');
                        winObj.className = 'win-text';
                        winObj.innerText = "QUEST CLEARED!";
                        document.getElementById('confetti-overlay').appendChild(winObj);
                        setTimeout(() => { winObj.remove(); }, 2500);
                    }
                };

                layer.on('click', onClickAction);
                iconMarker.on('click', onClickAction); 
                
                // ===== BAGIAN YANG DITAMBAHKAN UNTUK EFEK KEDAP-KEDIP =====
                layer.on('mouseover', function () { 
                    if (desaTerpilih === null) { 
                        this.setStyle({ fillOpacity: 0.7, weight: 3 }); 
                        this.bringToFront(); 
                        
                        // FITUR BARU: Kalau ini desa target misi, berikan animasi berkedip
                        if(questActive && misiSaatIni && namaDesa === misiSaatIni.target) {
                            if(this._path) this._path.classList.add('desa-rahasia');
                        }
                    } 
                });
                
                layer.on('mouseout', function () { 
                    if (desaTerpilih === null) { 
                        this.setStyle({ fillOpacity: 0.35, weight: 2 }); 
                        // Hapus efek saat mouse pergi
                        if(this._path) this._path.classList.remove('desa-rahasia');
                    } 
                });
                // =========================================================

            }
        }).addTo(grupDesaKKN);
    });

    layerMasking = L.polygon([batasDunia, ...semuaLubangDesa], { pane: 'paneMasking', stroke: false, fillColor: '#1b2614', fillOpacity: 0.8 }).addTo(map);
    if (grupDesaKKN.getLayers().length > 0) { map.fitBounds(grupDesaKKN.getBounds(), { animate: false }); }
}

// ==========================================
// FUNGSI INTERAKTIF GAME UI
// ==========================================

window.toggleBGM = function() {
    let bgm = document.getElementById('audio-bgm');
    let btn = document.getElementById('btn-bgm');
    if(bgmPlaying) { bgm.pause(); btn.innerText = "🎵 Musik: MATI"; bgmPlaying = false; } 
    else { bgm.play().catch(e=>console.log("Audio block")); btn.innerText = "🎵 Musik: NYALA"; bgmPlaying = true; }
};

window.changeTime = function() {
    playSFX('audio-click');
    currentTime = (currentTime + 1) % 3;
    let overlay = document.getElementById('time-overlay');
    let btn = document.getElementById('btn-time');
    
    if(currentTime === 0) { overlay.className = 'time-siang'; btn.innerText = "☀️ Waktu: Siang"; }
    else if(currentTime === 1) { overlay.className = 'time-sore'; btn.innerText = "🌅 Waktu: Sore"; }
    else { overlay.className = 'time-malam'; btn.innerText = "🌙 Waktu: Malam"; }
};

window.changeWeather = function() {
    playSFX('audio-click');
    currentWeather = (currentWeather + 1) % 3;
    let btn = document.getElementById('btn-weather');
    let wOverlay = document.getElementById('weather-overlay');
    wOverlay.innerHTML = ''; 
    clearInterval(weatherInterval);

    if(currentWeather === 0) { btn.innerText = "🌤️ Cuaca: Cerah"; }
    else if(currentWeather === 1) { 
        btn.innerText = "🌧️ Cuaca: Hujan"; 
        weatherInterval = setInterval(() => { createWeatherParticle('raindrop'); }, 50);
    }
    else { 
        btn.innerText = "🍂 Cuaca: Gugur"; 
        weatherInterval = setInterval(() => { createWeatherParticle('leafdrop'); }, 300);
    }
};

function createWeatherParticle(className) {
    let wOverlay = document.getElementById('weather-overlay');
    let el = document.createElement('div');
    el.className = className;
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-50px';
    el.style.animationDuration = (Math.random() * 1 + 1) + 's';
    wOverlay.appendChild(el);
    setTimeout(() => { el.remove(); }, 2000);
}

window.toggleQuest = function() {
    playSFX('audio-click');
    let modal = document.getElementById('quest-modal');
    let btn = document.getElementById('btn-quest');

    if (modal.classList.contains('hidden')) { 
        if (!questActive) {
            misiSaatIni = buatMisiOtomatis(); 
            document.getElementById('quest-text').innerHTML = `<strong>"${misiSaatIni.text}"</strong>`;
            btn.innerText = "🔍 Misi Berjalan..."; 
            questActive = true;
        }
        modal.classList.remove('hidden'); 
    } 
    else { 
        modal.classList.add('hidden'); 
    }
};

map.on('click', function(e) {
    let particle = document.createElement('div');
    particle.className = 'harvest-particle';
    particle.innerText = '✨'; 
    particle.style.left = e.originalEvent.pageX + 'px';
    particle.style.top = e.originalEvent.pageY + 'px';
    document.getElementById('confetti-overlay').appendChild(particle);
    setTimeout(() => { particle.remove(); }, 1000); 
});

window.resetPeta = function() {
    playSFX('audio-click');
    desaTerpilih = null; 
    if (grupDesaKKN.getLayers().length > 0) { map.fitBounds(grupDesaKKN.getBounds(), { animate: true, duration: 1.5 }); }
    if (layerMasking && semuaLubangDesa.length > 0) { layerMasking.setLatLngs([batasDunia, ...semuaLubangDesa]); }
    grupDesaKKN.eachLayer(function (l) { l.setStyle({ fillOpacity: 0.35, weight: 2, color: '#ffffff', dashArray: null }); });
    const panelInfo = document.getElementById('info-panel');
    if (panelInfo) { panelInfo.classList.remove('tampil'); }
};