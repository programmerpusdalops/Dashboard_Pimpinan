'use strict';
const bcrypt = require('bcryptjs');
const {
    User, DisasterEvent, Casualty, Shelter, Refugee, HealthReport,
    Warehouse, InventoryItem, LogisticsShipment, OperationTask, DecisionLog,
    BudgetAllocation, DailyExpenditure, Instruction, sequelize
} = require('../src/models');

// ── Helpers ─────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const dayMs = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * dayMs);
const dateOnly = (d) => d.toISOString().split('T')[0];

async function seedBulk() {
    try {
        await sequelize.authenticate();
        console.log('🌱 Starting BULK seed — populating with large dataset...\n');

        // ══════════════════════════════════════════════════════════
        // 1. USERS (10 users across different roles)
        // ══════════════════════════════════════════════════════════
        const hash = await bcrypt.hash('admin123', 10);
        const hashPimpinan = await bcrypt.hash('pimpinan123', 10);

        const usersData = [
            { email: 'superadmin@bpbd.sulteng.go.id', name: 'Super Administrator', password_hash: hash, role: 'superadmin', opd: 'BPBD Provinsi' },
            { email: 'admin@bpbd.sulteng.go.id', name: 'Admin BPBD', password_hash: hash, role: 'admin', opd: 'BPBD Provinsi' },
            { email: 'operator1@bpbd.sulteng.go.id', name: 'Petugas Pusdalops 1', password_hash: hash, role: 'operator', opd: 'BPBD Provinsi' },
            { email: 'operator2@bpbd.sulteng.go.id', name: 'Petugas Pusdalops 2', password_hash: hash, role: 'operator', opd: 'BPBD Provinsi' },
            { email: 'operator3@bpbd.sulteng.go.id', name: 'Petugas Lapangan Palu', password_hash: hash, role: 'operator', opd: 'BPBD Kota Palu' },
            { email: 'operator4@bpbd.sulteng.go.id', name: 'Petugas Lapangan Poso', password_hash: hash, role: 'operator', opd: 'BPBD Kab. Poso' },
            { email: 'kalaksa@bpbd.sulteng.go.id', name: 'Kalaksa BPBD', password_hash: hashPimpinan, role: 'pimpinan', opd: 'BPBD Provinsi' },
            { email: 'gubernur@bpbd.sulteng.go.id', name: 'Gubernur Sulawesi Tengah', password_hash: hashPimpinan, role: 'pimpinan', opd: 'Pemprov Sulteng' },
            { email: 'wagub@bpbd.sulteng.go.id', name: 'Wakil Gubernur Sulteng', password_hash: hashPimpinan, role: 'pimpinan', opd: 'Pemprov Sulteng' },
            { email: 'kadis.pu@bpbd.sulteng.go.id', name: 'Kadis PU Sulteng', password_hash: hash, role: 'admin', opd: 'Dinas PU' },
        ];

        const users = [];
        for (const u of usersData) {
            const [user] = await User.findOrCreate({ where: { email: u.email }, defaults: u });
            users.push(user);
        }
        const [superadmin, admin, op1, op2, op3, op4, kalaksa, gubernur, wagub, kadisPU] = users;
        console.log(`  ✅ ${users.length} users created/found`);

        // ══════════════════════════════════════════════════════════
        // 2. DISASTER EVENTS (15 events — various types, severities, statuses)
        // ══════════════════════════════════════════════════════════
        const eventsData = [
            // Active - Kritis
            { title: 'Banjir Bandang Sigi', type: 'banjir', status: 'tanggap_darurat', severity: 'kritis', location_name: 'Kec. Dolo Selatan, Kab. Sigi', latitude: -1.09, longitude: 119.92, start_date: dateOnly(daysAgo(3)), description: 'Banjir bandang akibat curah hujan ekstrem. Jembatan penghubung putus, ratusan rumah terendam.', posko_leader: 'Brigjen TNI Andi Sulaeman', posko_leader_position: 'Danrem 132 Tadulako' },
            { title: 'Gempa M 6.2 Poso', type: 'gempa', status: 'tanggap_darurat', severity: 'kritis', location_name: 'Poso Pesisir Utara', latitude: -1.35, longitude: 120.73, start_date: dateOnly(daysAgo(5)), description: 'Gempa dangkal M6.2 mengakibatkan kerusakan masif pada bangunan. Aftershock terus terjadi.', posko_leader: 'Kol. Inf. Pratama', posko_leader_position: 'Dandim 1308' },
            { title: 'Banjir Lahar Dingin Lore Lindu', type: 'banjir', status: 'tanggap_darurat', severity: 'kritis', location_name: 'Lore Lindu, Kab. Sigi', latitude: -1.48, longitude: 120.10, start_date: dateOnly(daysAgo(2)), description: 'Material vulkanik ikut terbawa banjir dari hulu sungai.', posko_leader: 'Camat Lore Utara', posko_leader_position: 'Incident Commander' },

            // Active - Berat
            { title: 'Longsor Jalur Kebun Kopi', type: 'longsor', status: 'tanggap_darurat', severity: 'berat', location_name: 'Trans Sulawesi KM 42, Sigi', latitude: -0.74, longitude: 120.02, start_date: dateOnly(daysAgo(4)), description: 'Material longsor 50m menutupi jalur trans. 3 kendaraan tertimbun.', posko_leader: 'Kabalai Jalan Sulteng', posko_leader_position: 'Koordinator Lapangan' },
            { title: 'Banjir Rob Kota Palu', type: 'banjir', status: 'tanggap_darurat', severity: 'berat', location_name: 'Pesisir Talise, Kota Palu', latitude: -0.88, longitude: 119.88, start_date: dateOnly(daysAgo(1)), description: 'Air laut pasang tinggi dikombinasi dengan gelombang tinggi. Permukiman pesisir terendam.', posko_leader: 'Lurah Talise', posko_leader_position: 'Koordinator Posko' },
            { title: 'Longsor Parigi Moutong', type: 'longsor', status: 'tanggap_darurat', severity: 'berat', location_name: 'Kec. Kasimbar, Kab. Parigi Moutong', latitude: -0.52, longitude: 120.08, start_date: dateOnly(daysAgo(6)), description: 'Longsor menyerang 3 desa sekaligus, mengisolasi akses jalan.', posko_leader: 'Camat Kasimbar', posko_leader_position: 'Koordinator Darurat' },

            // Active - Sedang
            { title: 'Kebakaran Hutan Morowali', type: 'karhutla', status: 'siaga', severity: 'sedang', location_name: 'Bungku Tengah, Kab. Morowali', latitude: -2.31, longitude: 121.72, start_date: dateOnly(daysAgo(7)), description: 'Titik api di lahan gambut dekat permukiman. Api menjalar perlahan.', posko_leader: 'Kepala BPBD Morowali', posko_leader_position: 'Penanggung Jawab' },
            { title: 'Angin Kencang Banggai', type: 'angin_kencang', status: 'siaga', severity: 'sedang', location_name: 'Kab. Banggai', latitude: -1.56, longitude: 122.58, start_date: dateOnly(daysAgo(2)), description: 'Angin kencang merusak atap rumah warga dan pohon tumbang.', posko_leader: 'Sekda Banggai', posko_leader_position: 'Ketua Posko' },
            { title: 'Banjir Donggala', type: 'banjir', status: 'tanggap_darurat', severity: 'sedang', location_name: 'Kec. Banawa, Kab. Donggala', latitude: -0.68, longitude: 119.73, start_date: dateOnly(daysAgo(3)), description: 'Sungai Palu meluap di bagian hilir Donggala.', posko_leader: 'Camat Banawa', posko_leader_position: 'Koordinator Lapangan' },
            { title: 'Gempa M 5.0 Banggai Kepulauan', type: 'gempa', status: 'siaga', severity: 'sedang', location_name: 'Kab. Banggai Kepulauan', latitude: -1.63, longitude: 123.48, start_date: dateOnly(daysAgo(1)), description: 'Gempa moderat, getaran dirasakan warga. Monitoring aftershock.', posko_leader: 'Kepala BPBD Bangkep', posko_leader_position: 'Penanggung Jawab' },

            // Active - Ringan
            { title: 'Kebakaran Lahan Tojo Una-Una', type: 'karhutla', status: 'siaga', severity: 'ringan', location_name: 'Kab. Tojo Una-Una', latitude: -1.14, longitude: 121.60, start_date: dateOnly(daysAgo(1)), description: 'Kebakaran lahan perkebunan skala kecil. Dalam proses pemadaman.', posko_leader: 'Camat Tojo', posko_leader_position: 'Koordinator' },
            { title: 'Angin Puting Beliung Buol', type: 'angin_kencang', status: 'siaga', severity: 'ringan', location_name: 'Kab. Buol', latitude: 0.74, longitude: 121.41, start_date: dateOnly(daysAgo(0)), description: 'Angin puting beliung beberapa menit merusak 10 atap rumah.', posko_leader: 'Lurah Buol Selatan', posko_leader_position: 'Koordinator' },

            // Completed / pemulihan
            { title: 'Banjir Bandang Palu Timur (Maret)', type: 'banjir', status: 'pemulihan', severity: 'berat', location_name: 'Palu Timur, Kota Palu', latitude: -0.90, longitude: 119.89, start_date: dateOnly(daysAgo(25)), end_date: dateOnly(daysAgo(12)), description: 'Banjir bandang bulan lalu. Fase pemulihan masih berjalan.', posko_leader: 'Walikota Palu', posko_leader_position: 'Ketua Gugus Tugas' },
            { title: 'Longsor Kulawi (Februari)', type: 'longsor', status: 'selesai', severity: 'sedang', location_name: 'Kulawi, Kab. Sigi', latitude: -1.40, longitude: 119.99, start_date: dateOnly(daysAgo(50)), end_date: dateOnly(daysAgo(35)), description: 'Sudah selesai ditangani.', posko_leader: 'Camat Kulawi', posko_leader_position: 'Koordinator' },
            { title: 'Gempa Susulan Palu (Jan)', type: 'gempa', status: 'selesai', severity: 'ringan', location_name: 'Kota Palu', latitude: -0.89, longitude: 119.87, start_date: dateOnly(daysAgo(75)), end_date: dateOnly(daysAgo(70)), description: 'Gempa susulan ringan. Penanganan selesai.', posko_leader: 'BPBD Kota Palu', posko_leader_position: 'Penanggung Jawab' },
        ];

        const events = [];
        for (const e of eventsData) {
            const [event] = await DisasterEvent.findOrCreate({
                where: { title: e.title },
                defaults: { ...e, created_by: admin.id },
            });
            events.push(event);
        }
        console.log(`  ✅ ${events.length} disaster events created/found`);

        // ══════════════════════════════════════════════════════════
        // 3. CASUALTIES (one per event)
        // ══════════════════════════════════════════════════════════
        const casualtiesData = [
            // Banjir Sigi (kritis)
            { event_idx: 0, meninggal: 4, luka_berat: 18, luka_ringan: 67, hilang: 2, rumah_rusak_berat: 78, rumah_rusak_sedang: 145, rumah_rusak_ringan: 210, fasilitas_publik_rusak: 6, akses_jalan_putus: 3 },
            // Gempa Poso (kritis)
            { event_idx: 1, meninggal: 8, luka_berat: 45, luka_ringan: 156, hilang: 1, rumah_rusak_berat: 220, rumah_rusak_sedang: 410, rumah_rusak_ringan: 560, fasilitas_publik_rusak: 18, akses_jalan_putus: 2 },
            // Lahar dingin Lore (kritis)
            { event_idx: 2, meninggal: 3, luka_berat: 12, luka_ringan: 34, hilang: 5, rumah_rusak_berat: 45, rumah_rusak_sedang: 89, rumah_rusak_ringan: 120, fasilitas_publik_rusak: 3, akses_jalan_putus: 4 },
            // Longsor Kebun Kopi (berat)
            { event_idx: 3, meninggal: 1, luka_berat: 5, luka_ringan: 12, hilang: 0, rumah_rusak_berat: 3, rumah_rusak_sedang: 8, rumah_rusak_ringan: 15, fasilitas_publik_rusak: 0, akses_jalan_putus: 5 },
            // Banjir Rob Palu (berat)
            { event_idx: 4, meninggal: 0, luka_berat: 3, luka_ringan: 28, hilang: 0, rumah_rusak_berat: 22, rumah_rusak_sedang: 78, rumah_rusak_ringan: 135, fasilitas_publik_rusak: 2, akses_jalan_putus: 1 },
            // Longsor Parigi (berat)
            { event_idx: 5, meninggal: 2, luka_berat: 8, luka_ringan: 19, hilang: 3, rumah_rusak_berat: 35, rumah_rusak_sedang: 62, rumah_rusak_ringan: 88, fasilitas_publik_rusak: 4, akses_jalan_putus: 6 },
            // Karhutla Morowali (sedang)
            { event_idx: 6, meninggal: 0, luka_berat: 0, luka_ringan: 5, hilang: 0, rumah_rusak_berat: 2, rumah_rusak_sedang: 8, rumah_rusak_ringan: 12, fasilitas_publik_rusak: 0, akses_jalan_putus: 0 },
            // Angin Kencang Banggai (sedang)
            { event_idx: 7, meninggal: 0, luka_berat: 2, luka_ringan: 15, hilang: 0, rumah_rusak_berat: 18, rumah_rusak_sedang: 42, rumah_rusak_ringan: 67, fasilitas_publik_rusak: 1, akses_jalan_putus: 0 },
            // Banjir Donggala (sedang)
            { event_idx: 8, meninggal: 0, luka_berat: 1, luka_ringan: 22, hilang: 0, rumah_rusak_berat: 12, rumah_rusak_sedang: 55, rumah_rusak_ringan: 90, fasilitas_publik_rusak: 2, akses_jalan_putus: 1 },
            // Gempa Bangkep (sedang)
            { event_idx: 9, meninggal: 0, luka_berat: 0, luka_ringan: 8, hilang: 0, rumah_rusak_berat: 5, rumah_rusak_sedang: 20, rumah_rusak_ringan: 35, fasilitas_publik_rusak: 1, akses_jalan_putus: 0 },
            // Karhutla Tojo (ringan)
            { event_idx: 10, meninggal: 0, luka_berat: 0, luka_ringan: 2, hilang: 0, rumah_rusak_berat: 0, rumah_rusak_sedang: 1, rumah_rusak_ringan: 3, fasilitas_publik_rusak: 0, akses_jalan_putus: 0 },
            // Angin Buol (ringan)
            { event_idx: 11, meninggal: 0, luka_berat: 0, luka_ringan: 3, hilang: 0, rumah_rusak_berat: 2, rumah_rusak_sedang: 8, rumah_rusak_ringan: 10, fasilitas_publik_rusak: 0, akses_jalan_putus: 0 },
            // Banjir Palu Timur pemulihan
            { event_idx: 12, meninggal: 1, luka_berat: 6, luka_ringan: 45, hilang: 0, rumah_rusak_berat: 34, rumah_rusak_sedang: 98, rumah_rusak_ringan: 167, fasilitas_publik_rusak: 5, akses_jalan_putus: 2 },
            // Longsor Kulawi selesai
            { event_idx: 13, meninggal: 0, luka_berat: 2, luka_ringan: 10, hilang: 0, rumah_rusak_berat: 8, rumah_rusak_sedang: 15, rumah_rusak_ringan: 22, fasilitas_publik_rusak: 1, akses_jalan_putus: 1 },
            // Gempa Palu selesai
            { event_idx: 14, meninggal: 0, luka_berat: 0, luka_ringan: 4, hilang: 0, rumah_rusak_berat: 0, rumah_rusak_sedang: 3, rumah_rusak_ringan: 8, fasilitas_publik_rusak: 0, akses_jalan_putus: 0 },
        ];

        for (const c of casualtiesData) {
            const { event_idx, ...data } = c;
            await Casualty.findOrCreate({
                where: { event_id: events[event_idx].id },
                defaults: { ...data, event_id: events[event_idx].id, recorded_at: new Date(), updated_by: op1.id },
            });
        }
        console.log(`  ✅ ${casualtiesData.length} casualty records created/found`);

        // ══════════════════════════════════════════════════════════
        // 4. SHELTERS (2-4 per active event = ~30 shelters)
        // ══════════════════════════════════════════════════════════
        const shelterNames = [
            // Event 0: Banjir Sigi
            { event_idx: 0, name: 'Posko Utama Dolo', location_name: 'Halaman Kantor Camat Dolo', lat: -1.08, lng: 119.92, capacity: 500, occ: 480, status: 'aktif', pic: 'Camat Dolo' },
            { event_idx: 0, name: 'Posko GOR Sigi', location_name: 'GOR Kab. Sigi', lat: -1.07, lng: 119.91, capacity: 800, occ: 690, status: 'aktif', pic: 'TNI AD' },
            { event_idx: 0, name: 'Posko Masjid Al-Ikhlas Dolo', location_name: 'Masjid Al-Ikhlas', lat: -1.09, lng: 119.93, capacity: 200, occ: 200, status: 'penuh', pic: 'DKM Al-Ikhlas' },
            // Event 1: Gempa Poso
            { event_idx: 1, name: 'Posko Alun-alun Poso', location_name: 'Alun-alun Sintuwu Maroso', lat: -1.39, lng: 120.75, capacity: 2000, occ: 1540, status: 'aktif', pic: 'BPBD Poso' },
            { event_idx: 1, name: 'Posko Lapangan Tenis Poso', location_name: 'Lap. Tenis Kota Poso', lat: -1.38, lng: 120.74, capacity: 600, occ: 580, status: 'aktif', pic: 'Polres Poso' },
            { event_idx: 1, name: 'Posko RSUD Poso', location_name: 'Halaman RSUD Poso', lat: -1.40, lng: 120.76, capacity: 300, occ: 245, status: 'aktif', pic: 'Direktur RSUD' },
            { event_idx: 1, name: 'Posko Gereja GKST Poso', location_name: 'Gereja GKST Pusat', lat: -1.38, lng: 120.73, capacity: 400, occ: 370, status: 'aktif', pic: 'Pendeta Samuel' },
            // Event 2: Lahar Lore
            { event_idx: 2, name: 'Posko SD Lore Utara', location_name: 'SD Negeri Lore Utara', lat: -1.47, lng: 120.11, capacity: 300, occ: 270, status: 'aktif', pic: 'Kepala Desa Lore' },
            { event_idx: 2, name: 'Posko Balai Desa Kamarora', location_name: 'Balai Desa Kamarora', lat: -1.50, lng: 120.09, capacity: 150, occ: 150, status: 'penuh', pic: 'Kadus Kamarora' },
            // Event 3: Longsor Kebun Kopi
            { event_idx: 3, name: 'Posko Pos TNI KM 42', location_name: 'Pos Komando KM 42', lat: -0.75, lng: 120.03, capacity: 100, occ: 45, status: 'aktif', pic: 'Danposramil' },
            // Event 4: Banjir Rob Palu
            { event_idx: 4, name: 'Posko Talise Utara', location_name: 'Balai Kelurahan Talise', lat: -0.87, lng: 119.88, capacity: 400, occ: 320, status: 'aktif', pic: 'Lurah Talise' },
            { event_idx: 4, name: 'Posko Pantai Talise', location_name: 'Pendopo Pantai Talise', lat: -0.88, lng: 119.89, capacity: 250, occ: 210, status: 'aktif', pic: 'Tagana Palu' },
            // Event 5: Longsor Parigi
            { event_idx: 5, name: 'Posko SMP 1 Kasimbar', location_name: 'SMP N 1 Kasimbar', lat: -0.53, lng: 120.09, capacity: 350, occ: 310, status: 'aktif', pic: 'Camat Kasimbar' },
            { event_idx: 5, name: 'Posko Masjid Raya Kasimbar', location_name: 'Masjid Raya Kasimbar', lat: -0.52, lng: 120.07, capacity: 200, occ: 185, status: 'aktif', pic: 'Imam Masjid' },
            { event_idx: 5, name: 'Posko Desa Ogotua', location_name: 'Balai Desa Ogotua', lat: -0.54, lng: 120.10, capacity: 150, occ: 135, status: 'aktif', pic: 'Kepala Desa' },
            // Event 7: Angin Banggai
            { event_idx: 7, name: 'Posko Kelurahan Luwuk', location_name: 'Kantor Kelurahan Luwuk', lat: -1.57, lng: 122.59, capacity: 200, occ: 120, status: 'aktif', pic: 'Lurah Luwuk' },
            // Event 8: Banjir Donggala
            { event_idx: 8, name: 'Posko Kecamatan Banawa', location_name: 'Kantor Kec. Banawa', lat: -0.69, lng: 119.74, capacity: 300, occ: 245, status: 'aktif', pic: 'Camat Banawa' },
            { event_idx: 8, name: 'Posko Lapangan Donggala', location_name: 'Lapangan Umum Donggala', lat: -0.67, lng: 119.73, capacity: 500, occ: 380, status: 'aktif', pic: 'BPBD Donggala' },
            // Event 12: Pemulihan Palu Timur
            { event_idx: 12, name: 'Posko Pemulihan Palu Timur', location_name: 'Gedung Serba Guna Palu Timur', lat: -0.91, lng: 119.90, capacity: 600, occ: 210, status: 'aktif', pic: 'Satgas Pemulihan' },
        ];

        const shelters = [];
        for (const s of shelterNames) {
            const [shelter] = await Shelter.findOrCreate({
                where: { name: s.name },
                defaults: {
                    event_id: events[s.event_idx].id,
                    name: s.name, location_name: s.location_name,
                    latitude: s.lat, longitude: s.lng,
                    capacity: s.capacity, current_occupancy: s.occ,
                    status: s.status, pic_name: s.pic,
                },
            });
            shelters.push(shelter);
        }
        console.log(`  ✅ ${shelters.length} shelters created/found`);

        // ══════════════════════════════════════════════════════════
        // 5. REFUGEES (one per shelter)
        // ══════════════════════════════════════════════════════════
        for (const sh of shelters) {
            const occ = sh.current_occupancy || rand(50, 300);
            const balita = Math.round(occ * 0.12);
            const anak = Math.round(occ * 0.25);
            const lansia = Math.round(occ * 0.10);
            const bumil = Math.round(occ * 0.02);
            const disab = Math.round(occ * 0.01);
            const dewasa = occ - balita - anak - lansia;

            await Refugee.findOrCreate({
                where: { shelter_id: sh.id },
                defaults: {
                    shelter_id: sh.id, total_jiwa: occ,
                    balita, anak, dewasa, lansia,
                    ibu_hamil: bumil, disabilitas: disab,
                    recorded_date: dateOnly(new Date()), updated_by: pick([op1, op2, op3, op4]).id,
                },
            });
        }
        console.log(`  ✅ ${shelters.length} refugee records created/found`);

        // ══════════════════════════════════════════════════════════
        // 6. HEALTH REPORTS (2-3 per shelter = ~50+ reports)
        // ══════════════════════════════════════════════════════════
        const diseases = [
            { name: 'Diare', severity: 'sedang', notes: 'Kualitas air menurun, sanitasi belum memadai.' },
            { name: 'ISPA', severity: 'ringan', notes: 'Debu dan kelembapan tinggi.' },
            { name: 'Gatal-gatal', severity: 'ringan', notes: 'Minimnya air bersih untuk mandi.' },
            { name: 'Demam Berdarah', severity: 'kritis', notes: 'Genangan air menjadi sarang nyamuk.' },
            { name: 'Leptospirosis', severity: 'sedang', notes: 'Kontak dengan air banjir terkontaminasi.' },
            { name: 'Campak', severity: 'sedang', notes: 'Kepadatan pengungsi memudahkan penularan.' },
            { name: 'Infeksi Kulit', severity: 'ringan', notes: 'Kondisi sanitasi darurat.' },
            { name: 'Trauma Psikologis', severity: 'sedang', notes: 'Pendampingan psikososial diperlukan.' },
            { name: 'Typoid', severity: 'sedang', notes: 'Sumber air tercemar, konsumsi makanan mentah.' },
            { name: 'Pneumonia', severity: 'kritis', notes: 'Balita dan lansia rentan di cuaca dingin pengungsian.' },
        ];

        let healthCount = 0;
        for (const sh of shelters) {
            const numDiseases = rand(2, 4);
            const selected = [];
            for (let i = 0; i < numDiseases; i++) {
                let d;
                do { d = pick(diseases); } while (selected.includes(d.name));
                selected.push(d.name);

                await HealthReport.findOrCreate({
                    where: { shelter_id: sh.id, disease_name: d.name },
                    defaults: {
                        shelter_id: sh.id, disease_name: d.name,
                        case_count: rand(5, 150), severity: d.severity,
                        notes: d.notes, reported_by: pick([op1, op2, op3, op4]).id,
                    },
                });
                healthCount++;
            }
        }
        console.log(`  ✅ ${healthCount} health reports created/found`);

        // ══════════════════════════════════════════════════════════
        // 7. WAREHOUSES (8 warehouses across the province)
        // ══════════════════════════════════════════════════════════
        const warehousesData = [
            { name: 'Gudang Utama BPBD Provinsi', level: 'provinsi', location_name: 'Kota Palu', lat: -0.90, lng: 119.88, capacity_pct: 65, status: 'aktif' },
            { name: 'Gudang BPBD Kab. Sigi', level: 'kabupaten', location_name: 'Sigi Biromaru', lat: -1.05, lng: 119.95, capacity_pct: 30, status: 'aktif' },
            { name: 'Gudang BPBD Kab. Poso', level: 'kabupaten', location_name: 'Kota Poso', lat: -1.39, lng: 120.74, capacity_pct: 20, status: 'aktif' },
            { name: 'Gudang Logistik TNI Palu', level: 'provinsi', location_name: 'Makorem 132 Tadulako', lat: -0.89, lng: 119.87, capacity_pct: 78, status: 'aktif' },
            { name: 'Gudang BNPB Regional Sulteng', level: 'provinsi', location_name: 'Bandara Mutiara SIS Al-Jufri', lat: -0.92, lng: 119.90, capacity_pct: 82, status: 'aktif' },
            { name: 'Gudang Kecamatan Dolo', level: 'kecamatan', location_name: 'Dolo, Sigi', lat: -1.08, lng: 119.93, capacity_pct: 12, status: 'aktif' },
            { name: 'Gudang BPBD Donggala', level: 'kabupaten', location_name: 'Banawa, Donggala', lat: -0.68, lng: 119.73, capacity_pct: 45, status: 'aktif' },
            { name: 'Gudang BPBD Parigi Moutong', level: 'kabupaten', location_name: 'Parigi', lat: -0.52, lng: 120.09, capacity_pct: 38, status: 'aktif' },
        ];

        const warehouses = [];
        for (const w of warehousesData) {
            const [wh] = await Warehouse.findOrCreate({
                where: { name: w.name },
                defaults: { ...w, latitude: w.lat, longitude: w.lng },
            });
            warehouses.push(wh);
        }
        console.log(`  ✅ ${warehouses.length} warehouses created/found`);

        // ══════════════════════════════════════════════════════════
        // 8. INVENTORY ITEMS (5-8 items per warehouse = ~50+ items)
        // ══════════════════════════════════════════════════════════
        const inventoryTemplates = [
            { item_name: 'Beras 25kg', unit: 'Karung', category: 'logistik', stock: [50, 500], dailyC: [5, 30], minT: 20 },
            { item_name: 'Mie Instan', unit: 'Dus', category: 'logistik', stock: [20, 300], dailyC: [10, 40], minT: 30 },
            { item_name: 'Air Mineral 600ml', unit: 'Dus', category: 'logistik', stock: [100, 800], dailyC: [20, 60], minT: 50 },
            { item_name: 'Selimut', unit: 'Lembar', category: 'logistik', stock: [50, 400], dailyC: [2, 10], minT: 20 },
            { item_name: 'Terpal 4x6m', unit: 'Lembar', category: 'logistik', stock: [10, 100], dailyC: [1, 5], minT: 10 },
            { item_name: 'Pakaian Layak Pakai', unit: 'Set', category: 'logistik', stock: [30, 200], dailyC: [3, 15], minT: 15 },
            { item_name: 'Genset 5000W', unit: 'Unit', category: 'peralatan', stock: [2, 15], dailyC: [0, 1], minT: 2 },
            { item_name: 'Velbed / Tempat Tidur Lipat', unit: 'Unit', category: 'peralatan', stock: [10, 80], dailyC: [1, 5], minT: 5 },
            { item_name: 'Tenda Darurat 5x7m', unit: 'Unit', category: 'peralatan', stock: [5, 40], dailyC: [0, 2], minT: 3 },
            { item_name: 'Truk Angkut 6 Ton', unit: 'Unit', category: 'kendaraan', stock: [2, 10], dailyC: [0, 0], minT: 1 },
            { item_name: 'Obat P3K Set', unit: 'Set', category: 'logistik', stock: [20, 150], dailyC: [3, 12], minT: 10 },
            { item_name: 'Masker Medis', unit: 'Box', category: 'logistik', stock: [30, 200], dailyC: [5, 20], minT: 15 },
            { item_name: 'Perahu Karet Rescue', unit: 'Unit', category: 'peralatan', stock: [1, 8], dailyC: [0, 0], minT: 1 },
            { item_name: 'Pompa Air Portable', unit: 'Unit', category: 'peralatan', stock: [2, 12], dailyC: [0, 1], minT: 1 },
        ];

        let invCount = 0;
        for (const wh of warehouses) {
            const numItems = rand(5, 8);
            const used = new Set();
            for (let i = 0; i < numItems; i++) {
                let tmpl;
                do { tmpl = pick(inventoryTemplates); } while (used.has(tmpl.item_name));
                used.add(tmpl.item_name);

                await InventoryItem.findOrCreate({
                    where: { warehouse_id: wh.id, item_name: tmpl.item_name },
                    defaults: {
                        warehouse_id: wh.id, item_name: tmpl.item_name,
                        unit: tmpl.unit, category: tmpl.category,
                        stock_quantity: rand(tmpl.stock[0], tmpl.stock[1]),
                        daily_consumption: rand(tmpl.dailyC[0], tmpl.dailyC[1]),
                        min_threshold: tmpl.minT,
                    },
                });
                invCount++;
            }
        }
        console.log(`  ✅ ${invCount} inventory items created/found`);

        // ══════════════════════════════════════════════════════════
        // 9. LOGISTICS SHIPMENTS (20+ shipments)
        // ══════════════════════════════════════════════════════════
        const shipmentStatuses = ['preparing', 'in_transit', 'arrived', 'delayed'];
        const drivers = ['Pak Andi', 'Pak Budi', 'Pak Cahyo', 'Pak Deni', 'Pak Eko', 'Pak Firdaus', 'Pak Gunawan', 'Pak Hadi'];
        const plates = ['DN 1234 AB', 'DN 5678 CD', 'DN 9012 EF', 'DN 3456 GH', 'DN 7890 IJ', 'DN 2345 KL', 'DN 6789 MN', 'DN 0123 OP'];
        const cargoList = [
            '200 karung beras + 100 dus mie instan',
            '150 lembar selimut + 50 terpal',
            'Obat-obatan darurat + P3K set',
            '300 dus air mineral + 100 masker',
            '10 tenda darurat + 20 velbed',
            '3 genset + 5 pompa air portable',
            'Pakaian layak pakai 200 set',
            'Logistik campuran dapur umum',
            '50 dus susu formula + makanan balita',
            'Peralatan medis untuk RS Lapangan',
        ];

        let shipCount = 0;
        for (let i = 0; i < 25; i++) {
            const code = `SHP-${String(Date.now()).slice(-6)}-${String(i + 1).padStart(3, '0')}`;
            const status = pick(shipmentStatuses);
            const fromWh = pick(warehouses);
            const toShelter = pick(shelters);

            const depTime = daysAgo(rand(0, 5));
            const eta = new Date(depTime.getTime() + rand(4, 24) * 3600000);

            await LogisticsShipment.findOrCreate({
                where: { shipment_code: code },
                defaults: {
                    shipment_code: code,
                    from_warehouse_id: fromWh.id,
                    to_shelter_id: toShelter.id,
                    cargo_description: pick(cargoList),
                    status,
                    departure_time: depTime,
                    eta,
                    delay_reason: status === 'delayed' ? pick(['Jembatan putus, dialihkan jalur alternatif', 'Ban truk pecah di perjalanan', 'Jalur tertimbun longsor', 'Cuaca buruk, menunggu hujan reda']) : null,
                    driver_name: pick(drivers),
                    vehicle_plate: pick(plates),
                    created_by: pick([op1, op2, op3]).id,
                },
            });
            shipCount++;
        }
        console.log(`  ✅ ${shipCount} logistics shipments created/found`);

        // ══════════════════════════════════════════════════════════
        // 10. OPERATION TASKS (30+ tasks across events)
        // ══════════════════════════════════════════════════════════
        const opds = ['Dinas Sosial', 'Dinas PU', 'Dinas Kesehatan', 'BPBD Provinsi', 'TNI/Polri', 'PMI Sulteng', 'Tagana', 'Basarnas', 'BNPB', 'Balai Jalan', 'Dinas Pendidikan'];
        const taskTemplates = [
            { title: 'Distribusi Logistik Makanan Siap Saji', priority: 'high', hours: 4 },
            { title: 'Pemasangan Jembatan Bailey Darurat', priority: 'critical', hours: 48 },
            { title: 'Pembersihan Material Longsor', priority: 'critical', hours: 24 },
            { title: 'Asesmen Kerusakan Bangunan', priority: 'medium', hours: 72 },
            { title: 'Mendirikan Tenda Darurat RSUD', priority: 'critical', hours: 6 },
            { title: 'Evakuasi Warga Terisolir', priority: 'critical', hours: 12 },
            { title: 'Perbaikan Jaringan Listrik', priority: 'high', hours: 36 },
            { title: 'Distribusi Air Bersih Tangki', priority: 'high', hours: 8 },
            { title: 'Pendirian Dapur Umum', priority: 'high', hours: 3 },
            { title: 'Pembuatan MCK Darurat', priority: 'medium', hours: 16 },
            { title: 'Koordinasi Helikopter Bantuan', priority: 'critical', hours: 2 },
            { title: 'Pendataan Ulang Pengungsi', priority: 'medium', hours: 24 },
            { title: 'Monitoring Aftershock & Early Warning', priority: 'high', hours: 168 },
            { title: 'Penyemprotan Disinfektan Area Banjir', priority: 'medium', hours: 12 },
            { title: 'Vaksinasi Darurat di Posko Pengungsi', priority: 'high', hours: 24 },
            { title: 'Pengerahan Alat Berat Excavator', priority: 'critical', hours: 48 },
            { title: 'Perbaikan Jalan Rusak Akses Posko', priority: 'high', hours: 72 },
            { title: 'Psikososial untuk Korban Trauma', priority: 'medium', hours: 48 },
            { title: 'Pemasangan Tenda Sekolah Darurat', priority: 'medium', hours: 12 },
            { title: 'Pengiriman Perahu Karet ke Titik Terdampak', priority: 'critical', hours: 6 },
            { title: 'Perbaikan Pipa PDAM Rusak', priority: 'high', hours: 36 },
            { title: 'Pembuatan Tanggul Darurat', priority: 'critical', hours: 24 },
            { title: 'Koordinasi Bantuan OPD Lintas Sektor', priority: 'medium', hours: 4 },
            { title: 'Pendistribusian Susu Formula Anak Balita', priority: 'high', hours: 6 },
            { title: 'Pemasangan Lampu Penerangan Posko', priority: 'low', hours: 8 },
        ];

        const taskStatuses = ['todo', 'in_progress', 'done'];
        let taskCount = 0;
        for (let eIdx = 0; eIdx < 12; eIdx++) { // only active events
            const numTasks = rand(3, 6);
            const used = new Set();
            for (let t = 0; t < numTasks; t++) {
                let tmpl;
                do { tmpl = pick(taskTemplates); } while (used.has(tmpl.title));
                used.add(tmpl.title);

                const fullTitle = `${tmpl.title} — ${events[eIdx].location_name.split(',')[0]}`;
                await OperationTask.findOrCreate({
                    where: { title: fullTitle },
                    defaults: {
                        event_id: events[eIdx].id, title: fullTitle,
                        priority: tmpl.priority, status: pick(taskStatuses),
                        assigned_to_opd: pick(opds),
                        estimated_hours: tmpl.hours,
                        created_by: pick([op1, op2, admin]).id,
                    },
                });
                taskCount++;
            }
        }
        console.log(`  ✅ ${taskCount} operation tasks created/found`);

        // ══════════════════════════════════════════════════════════
        // 11. DECISION LOGS (15+ decisions)
        // ══════════════════════════════════════════════════════════
        const decisionsData = [
            { event_idx: 1, text: 'Gubernur menetapkan status Tanggap Darurat Bencana Gempa Bumi di Kab. Poso selama 14 Hari.', by: 'Gubernur Sulteng', daysAgo: 4 },
            { event_idx: 0, text: 'Instruksi langsung ke Kadis PU mengerahkan 4 alat berat ke Sigi untuk pembersihan material banjir.', by: 'Kepala BPBD Provinsi', daysAgo: 2 },
            { event_idx: 3, text: 'Perintah pengalihan jalur transportasi via Toboli selama perbaikan longsor KM 42.', by: 'Kadis Perhubungan', daysAgo: 3 },
            { event_idx: 0, text: 'Keputusan mendirikan RS Lapangan di Dolo dengan kapasitas 20 bed.', by: 'Kadis Kesehatan', daysAgo: 2 },
            { event_idx: 1, text: 'Permintaan bantuan helikopter dari Puspenerbad untuk evakuasi udara di Poso Pesisir.', by: 'Danrem 132', daysAgo: 3 },
            { event_idx: 2, text: 'Penetapan zona bahaya 500m dari sungai di Lore Lindu. Evakuasi paksa warga.', by: 'Camat Lore Utara', daysAgo: 1 },
            { event_idx: 5, text: 'Pengiriman 3 alat berat dari Palu ke Parigi Moutong untuk pembersihan longsor.', by: 'Kepala BPBD Provinsi', daysAgo: 5 },
            { event_idx: 4, text: 'Pembentukan Tim Reaksi Cepat pesisir Palu untuk monitoring gelombang.', by: 'Walikota Palu', daysAgo: 0 },
            { event_idx: 8, text: 'Normalisasi sungai Palu bagian hilir Donggala dipercepat pelaksanaannya.', by: 'Gubernur Sulteng', daysAgo: 2 },
            { event_idx: 1, text: 'Perpanjangan masa tanggap darurat gempa Poso 7 hari tambahan.', by: 'Gubernur Sulteng', daysAgo: 1 },
            { event_idx: 0, text: 'Alokasi dana BTT tambahan Rp 3M untuk logistik banjir Sigi.', by: 'Sekda Provinsi', daysAgo: 1 },
            { event_idx: 6, text: 'Pengerahan 200 personil gabungan untuk pemadaman karhutla Morowali.', by: 'Kepala BPBD Morowali', daysAgo: 5 },
            { event_idx: 7, text: 'Distribusi terpal darurat untuk rumah rusak akibat angin kencang di Banggai.', by: 'Bupati Banggai', daysAgo: 1 },
            { event_idx: 2, text: 'Penetapan jalur evakuasi alternatif melalui Desa Wuasa.', by: 'BPBD Sigi', daysAgo: 1 },
            { event_idx: 1, text: 'Koordinasi dengan BNPB untuk pengiriman bantuan dari Jakarta.', by: 'Kepala BPBD Provinsi', daysAgo: 4 },
            { event_idx: 12, text: 'Dimulainya fase pemulihan dan rehab rumah warga Palu Timur.', by: 'Gubernur Sulteng', daysAgo: 12 },
        ];

        for (const d of decisionsData) {
            await DecisionLog.findOrCreate({
                where: { decision_text: d.text },
                defaults: {
                    event_id: events[d.event_idx].id,
                    decision_text: d.text,
                    decided_by: d.by,
                    decided_at: daysAgo(d.daysAgo),
                    created_by: admin.id,
                },
            });
        }
        console.log(`  ✅ ${decisionsData.length} decision logs created/found`);

        // ══════════════════════════════════════════════════════════
        // 12. BUDGET ALLOCATIONS & DAILY EXPENDITURES
        // ══════════════════════════════════════════════════════════
        const sectors = ['Logistik & Dapur Umum', 'Sewa Alat Berat & Evakuasi', 'Medis & Kesehatan', 'Rehabilitasi Infrastruktur', 'Operasional Posko', 'Transportasi & BBM'];
        const sources = ['BTT', 'BNPB', 'Kemensos', 'Donasi', 'Lainnya'];

        let budgetCount = 0;
        let expCount = 0;
        // Allocate budgets for top 10 events
        for (let eIdx = 0; eIdx < 10; eIdx++) {
            const numAllocs = rand(2, 4);
            const usedSectors = new Set();
            for (let a = 0; a < numAllocs; a++) {
                let sector;
                do { sector = pick(sectors); } while (usedSectors.has(sector));
                usedSectors.add(sector);

                const severity = eventsData[eIdx].severity;
                const multiplier = severity === 'kritis' ? 5 : severity === 'berat' ? 3 : severity === 'sedang' ? 1.5 : 0.5;
                const amount = Math.round(rand(500, 5000) * 1000000 * multiplier);

                const [alloc] = await BudgetAllocation.findOrCreate({
                    where: { event_id: events[eIdx].id, sector },
                    defaults: {
                        event_id: events[eIdx].id, source: pick(sources),
                        total_amount: amount, sector,
                        allocated_at: dateOnly(daysAgo(rand(1, 7))),
                    },
                });
                budgetCount++;

                // Add 2-5 daily expenditures per allocation
                const numExp = rand(2, 5);
                for (let e = 0; e < numExp; e++) {
                    const expDate = dateOnly(daysAgo(rand(0, 6)));
                    const expAmount = Math.round(amount * (rand(5, 25) / 100));

                    await DailyExpenditure.findOrCreate({
                        where: { allocation_id: alloc.id, expenditure_date: expDate, description: `Pengeluaran ${sector} hari ke-${e + 1}` },
                        defaults: {
                            allocation_id: alloc.id,
                            expenditure_date: expDate,
                            amount: expAmount,
                            description: `Pengeluaran ${sector} hari ke-${e + 1} — ${events[eIdx].title}`,
                            verified_by: pick([admin, kadisPU]).id,
                        },
                    });
                    expCount++;
                }
            }
        }
        console.log(`  ✅ ${budgetCount} budget allocations created/found`);
        console.log(`  ✅ ${expCount} daily expenditures created/found`);

        // ══════════════════════════════════════════════════════════
        // 13. INSTRUCTIONS (15+ instructions from pimpinan)
        // ══════════════════════════════════════════════════════════
        const instructionsData = [
            { from: kalaksa, module: 'operasi', text: 'Segera laporkan update jumlah korban terbaru dari Posko Dolo.', priority: 'segera', status: 'dikerjakan', role: 'operator' },
            { from: gubernur, module: 'dasbor', text: 'Siapkan data ringkasan semua bencana aktif untuk rapat koordinasi besok pagi.', priority: 'penting', status: 'baru', role: 'admin' },
            { from: kalaksa, module: 'logistik', text: 'Pastikan stok beras di Gudang Sigi mencukupi untuk 7 hari ke depan.', priority: 'penting', status: 'dikerjakan', role: 'operator' },
            { from: gubernur, module: 'anggaran', text: 'Percepat pencairan BTT untuk penanganan gempa Poso.', priority: 'segera', status: 'dikerjakan', role: 'admin' },
            { from: kalaksa, module: 'pengungsi', text: 'Verifikasi data pengungsi di semua posko. Pastikan tidak ada duplikasi.', priority: 'penting', status: 'baru', role: 'operator' },
            { from: wagub, module: 'peta', text: 'Tandai semua titik rawan longsor di jalur trans Sulawesi pada peta.', priority: 'biasa', status: 'selesai', role: 'operator', response: 'Sudah ditandai 12 titik rawan. Peta telah diperbarui.' },
            { from: gubernur, module: 'operasi', text: 'Koordinasikan dengan Danrem untuk penambahan pasukan di Lore Lindu.', priority: 'segera', status: 'dikerjakan', role: 'admin' },
            { from: kalaksa, module: 'logistik', text: 'Cek apakah kiriman bantuan dari BNPB Jakarta sudah tiba di gudang bandara.', priority: 'penting', status: 'selesai', role: 'operator', response: 'Sudah tiba jam 14.00 WITA. 5 truk langsung didistribusikan ke Poso.' },
            { from: wagub, module: 'dasbor', text: 'Tampilkan progress penyerapan anggaran per hari dalam bentuk grafik.', priority: 'biasa', status: 'baru', role: 'admin' },
            { from: gubernur, module: 'operasi', text: 'Laporan harian operasi harus masuk sebelum jam 20.00 WITA setiap hari.', priority: 'penting', status: 'dibaca', role: 'operator' },
            { from: kalaksa, module: 'pengungsi', text: 'Identifikasi posko yang sudah melebihi kapasitas dan siapkan posko tambahan.', priority: 'segera', status: 'dikerjakan', role: 'operator' },
            { from: gubernur, module: 'anggaran', text: 'Siapkan proposal anggaran tambahan untuk fase pemulihan Palu Timur.', priority: 'penting', status: 'baru', role: 'admin' },
            { from: kalaksa, module: 'logistik', text: 'Prioritaskan pengiriman obat-obatan ke Posko RSUD Poso. Stok menipis.', priority: 'segera', status: 'baru', role: 'operator' },
            { from: wagub, module: 'operasi', text: 'Update foto-foto terbaru dari lapangan untuk bahan konferensi pers.', priority: 'biasa', status: 'selesai', role: 'operator', response: 'Foto sudah dikirim via grup WA koordinasi. 24 foto dari 5 lokasi.' },
            { from: gubernur, module: 'dasbor', text: 'Saya butuh data perbandingan penanganan bencana bulan ini vs bulan lalu.', priority: 'biasa', status: 'baru', role: 'admin' },
        ];

        for (const ins of instructionsData) {
            await Instruction.findOrCreate({
                where: { instruction_text: ins.text },
                defaults: {
                    from_user_id: ins.from.id,
                    target_module: ins.module,
                    instruction_text: ins.text,
                    priority: ins.priority,
                    status: ins.status,
                    assigned_to_role: ins.role,
                    response_text: ins.response || null,
                    responded_by: ins.response ? pick([op1, op2, admin]).id : null,
                    responded_at: ins.response ? daysAgo(rand(0, 2)) : null,
                    completed_at: ins.status === 'selesai' ? daysAgo(rand(0, 1)) : null,
                },
            });
        }
        console.log(`  ✅ ${instructionsData.length} instructions created/found`);

        // ══════════════════════════════════════════════════════════
        console.log('\n🎉 BULK SEED COMPLETE!');
        console.log('   Summary:');
        console.log(`   • ${users.length} Users`);
        console.log(`   • ${events.length} Disaster Events`);
        console.log(`   • ${casualtiesData.length} Casualty Records`);
        console.log(`   • ${shelters.length} Shelters`);
        console.log(`   • ${shelters.length} Refugee Records`);
        console.log(`   • ~${healthCount} Health Reports`);
        console.log(`   • ${warehouses.length} Warehouses`);
        console.log(`   • ~${invCount} Inventory Items`);
        console.log(`   • ${shipCount} Logistics Shipments`);
        console.log(`   • ~${taskCount} Operation Tasks`);
        console.log(`   • ${decisionsData.length} Decision Logs`);
        console.log(`   • ${budgetCount} Budget Allocations`);
        console.log(`   • ~${expCount} Daily Expenditures`);
        console.log(`   • ${instructionsData.length} Instructions`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Bulk seeding error:', err);
        process.exit(1);
    }
}

seedBulk();
