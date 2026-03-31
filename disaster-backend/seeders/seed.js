'use strict';
const bcrypt = require('bcryptjs');
const {
    User, DisasterEvent, Casualty, Shelter, Refugee, HealthReport,
    Warehouse, InventoryItem, LogisticsShipment, OperationTask, DecisionLog,
    BudgetAllocation, DailyExpenditure, sequelize
} = require('../src/models');

async function seed() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false });
        console.log('🌱 Seeding database with richer data...');

        // ── 1. Users ────────────────────────────────────────────────
        const hash = await bcrypt.hash('admin123', 12);
        const [superadmin] = await User.findOrCreate({
            where: { email: 'superadmin@bpbd.sulteng.go.id' }, defaults: {
                name: 'Super Administrator', password_hash: hash, role: 'superadmin', opd: 'BPBD Provinsi',
            }
        });
        const [admin] = await User.findOrCreate({
            where: { email: 'admin@bpbd.sulteng.go.id' }, defaults: {
                name: 'Admin BPBD', password_hash: hash, role: 'admin', opd: 'BPBD Provinsi',
            }
        });
        const [operator] = await User.findOrCreate({
            where: { email: 'operator@bpbd.sulteng.go.id' }, defaults: {
                name: 'Petugas Pusdalops', password_hash: hash, role: 'operator', opd: 'BPBD Provinsi',
            }
        });

        // Pimpinan users
        const hashPimpinan = await bcrypt.hash('pimpinan123', 12);
        const [kalaksa] = await User.findOrCreate({
            where: { email: 'kalaksa@bpbd.sulteng.go.id' }, defaults: {
                name: 'Kalaksa BPBD', password_hash: hashPimpinan, role: 'pimpinan', opd: 'BPBD Provinsi',
            }
        });
        const [gubernur] = await User.findOrCreate({
            where: { email: 'gubernur@bpbd.sulteng.go.id' }, defaults: {
                name: 'Gubernur Sulawesi Tengah', password_hash: hashPimpinan, role: 'pimpinan', opd: 'Pemprov Sulteng',
            }
        });

        // ── 2. Disaster Events (Sulawesi Tengah) ────────────────────
        // Event 1: Banjir Bandang (Kritis)
        const [event1] = await DisasterEvent.findOrCreate({
            where: { title: 'Banjir Bandang Sigi' }, defaults: {
                type: 'banjir', status: 'tanggap_darurat', severity: 'kritis',
                location_name: 'Kec. Dolo Selatan, Kab. Sigi', latitude: -1.09, longitude: 119.92,
                start_date: new Date(Date.now() - 2 * 86400000), description: 'Banjir bandang akibat curah hujan tinggi, memutus jembatan.',
                created_by: admin.id,
            }
        });
        
        // Event 2: Tanah Longsor (Berat)
        const [event2] = await DisasterEvent.findOrCreate({
            where: { title: 'Longsor Jalur Kebun Kopi' }, defaults: {
                type: 'longsor', status: 'tanggap_darurat', severity: 'berat',
                location_name: 'Jalur Trans Sulawesi, Pegunungan Kebun Kopi', latitude: -0.74, longitude: 120.02,
                start_date: new Date(Date.now() - 1 * 86400000), description: 'Material longsor menutupi jalur sepanjang 50m.',
                created_by: admin.id,
            }
        });
        
        // Event 3: Gempa Bumi (Kritis)
        const [event3] = await DisasterEvent.findOrCreate({
            where: { title: 'Gempa M 6.2 Poso' }, defaults: {
                type: 'gempa', status: 'tanggap_darurat', severity: 'kritis',
                location_name: 'Poso Pesisir Utara', latitude: -1.35, longitude: 120.73,
                start_date: new Date(Date.now() - 3 * 86400000), description: 'Gempa dangkal mengakibatkan kerusakan bangunan fasum.',
                created_by: admin.id,
            }
        });

        // Event 4: Karhutla (Sedang)
        const [event4] = await DisasterEvent.findOrCreate({
            where: { title: 'Kebakaran Hutan Morowali' }, defaults: {
                type: 'karhutla', status: 'siaga', severity: 'sedang',
                location_name: 'Bungku Tengah, Kab. Morowali', latitude: -2.31, longitude: 121.72,
                start_date: new Date(), description: 'Titik api terdeteksi di area lahan gambut dekat permukiman.',
                created_by: admin.id,
            }
        });

        // ── 3. Casualties ───────────────────────────────────────────
        // Korban Banjir Sigi
        await Casualty.findOrCreate({
            where: { event_id: event1.id }, defaults: {
                meninggal: 2, luka_berat: 14, luka_ringan: 45, hilang: 1, recorded_at: new Date(),
                rumah_rusak_berat: 45, rumah_rusak_sedang: 120, rumah_rusak_ringan: 80,
                fasilitas_publik_rusak: 4, akses_jalan_putus: 2, updated_by: operator.id,
            }
        });
        // Korban Gempa Poso
        await Casualty.findOrCreate({
            where: { event_id: event3.id }, defaults: {
                meninggal: 5, luka_berat: 32, luka_ringan: 110, hilang: 0, recorded_at: new Date(),
                rumah_rusak_berat: 154, rumah_rusak_sedang: 310, rumah_rusak_ringan: 420,
                fasilitas_publik_rusak: 12, akses_jalan_putus: 1, updated_by: operator.id,
            }
        });
        // Korban Longsor
        await Casualty.findOrCreate({
            where: { event_id: event2.id }, defaults: {
                meninggal: 0, luka_berat: 3, luka_ringan: 5, hilang: 0, recorded_at: new Date(),
                rumah_rusak_berat: 0, rumah_rusak_sedang: 0, rumah_rusak_ringan: 0,
                fasilitas_publik_rusak: 0, akses_jalan_putus: 3, updated_by: operator.id,
            }
        });

        // ── 4. Shelters & Refugees (Banjir & Gempa) ────────────────────
        const [shelter1] = await Shelter.findOrCreate({
            where: { name: 'Posko Utama Dolo' }, defaults: {
                event_id: event1.id, location_name: 'Halaman Kantor Camat Dolo',
                latitude: -1.08, longitude: 119.92, capacity: 500, current_occupancy: 480,
                status: 'aktif', pic_name: 'Camat Dolo',
            }
        });
        const [shelter2] = await Shelter.findOrCreate({
            where: { name: 'Posko Alun-alun Poso' }, defaults: {
                event_id: event3.id, location_name: 'Alun-alun Sintuwu Maroso',
                latitude: -1.39, longitude: 120.75, capacity: 2000, current_occupancy: 1540,
                status: 'aktif', pic_name: 'BPBD Poso',
            }
        });
        
        await Refugee.findOrCreate({
            where: { shelter_id: shelter1.id }, defaults: {
                total_jiwa: 480, balita: 65, anak: 120, dewasa: 250, lansia: 45,
                ibu_hamil: 8, disabilitas: 4, recorded_date: new Date(), updated_by: operator.id,
            }
        });
        await Refugee.findOrCreate({
            where: { shelter_id: shelter2.id }, defaults: {
                total_jiwa: 1540, balita: 210, anak: 400, dewasa: 750, lansia: 180,
                ibu_hamil: 25, disabilitas: 18, recorded_date: new Date(), updated_by: operator.id,
            }
        });

        // ── 5. Health Reports ───────────────────────────────────────
        await HealthReport.findOrCreate({
            where: { shelter_id: shelter1.id, disease_name: 'Gatal-gatal' }, defaults: {
                case_count: 85, severity: 'ringan', notes: 'Kurang air bersih.', reported_by: operator.id,
            }
        });
        await HealthReport.findOrCreate({
            where: { shelter_id: shelter2.id, disease_name: 'Diare' }, defaults: {
                case_count: 112, severity: 'sedang', notes: 'Sanitasi darurat penuh.', reported_by: operator.id,
            }
        });

        // ── 6. Operation Tasks ──────────────────────────────────────
        const tasks = [
            { event_id: event1.id, title: 'Distribusi Logistik Makanan Siap Saji Dolo', priority: 'high', status: 'in_progress', assigned_to_opd: 'Dinas Sosial', estimated_hours: 4 },
            { event_id: event1.id, title: 'Pemasangan Jembatan Bailey Darurat Sigi', priority: 'critical', status: 'todo', assigned_to_opd: 'Dinas PU', estimated_hours: 48 },
            { event_id: event2.id, title: 'Pembersihan Material Longsor Kebun Kopi', priority: 'critical', status: 'in_progress', assigned_to_opd: 'Balai Jalan', estimated_hours: 24 },
            { event_id: event3.id, title: 'Asesmen Kerusakan Bangunan Poso Pesisir', priority: 'medium', status: 'todo', assigned_to_opd: 'BPBD M&E', estimated_hours: 72 },
            { event_id: event3.id, title: 'Mendirikan Tenda Darurat RSUD Poso', priority: 'critical', status: 'done', assigned_to_opd: 'TNI/Polri', estimated_hours: 6 },
        ];
        for (const t of tasks) {
            await OperationTask.findOrCreate({ where: { title: t.title }, defaults: { ...t, created_by: operator.id } });
        }

        // ── 7. Decision Logs ────────────────────────────────────────
        await DecisionLog.findOrCreate({
            where: { decision_text: 'Gubernur menetapkan status Tanggap Darurat Bencana Gempa Bumi di Kab. Poso selama 14 Hari.' }, defaults: {
                event_id: event3.id,
                decided_by: 'Gubernur', decided_at: new Date(Date.now() - 2 * 86400000), created_by: admin.id,
            }
        });
        await DecisionLog.findOrCreate({
            where: { decision_text: 'Instruksi langsung ke Kadis PU untuk mengerahkan 4 alat berat ke Jalur Kebun Kopi malam ini juga.' }, defaults: {
                event_id: event2.id,
                decided_by: 'Kepala BPBD Provinsi', decided_at: new Date(), created_by: admin.id,
            }
        });

        // ── 8. Budget & Expenditures ────────────────────────────────
        const [alloc1] = await BudgetAllocation.findOrCreate({
            where: { event_id: event3.id, sector: 'Logistik & Dapur Umum' }, defaults: {
                source: 'BTT', total_amount: 5000000000, allocated_at: new Date(),
            }
        });
        const [alloc2] = await BudgetAllocation.findOrCreate({
            where: { event_id: event1.id, sector: 'Sewa Alat Berat & Evakuasi' }, defaults: {
                source: 'BTT', total_amount: 1500000000, allocated_at: new Date(),
            }
        });

        await DailyExpenditure.findOrCreate({
            where: { allocation_id: alloc1.id, expenditure_date: new Date() }, defaults: {
                amount: 1200000000, description: 'Pembelian logistik permakanan dan selimut untuk Poso', verified_by: admin.id,
            }
        });
        await DailyExpenditure.findOrCreate({
            where: { allocation_id: alloc2.id, expenditure_date: new Date() }, defaults: {
                amount: 450000000, description: 'Operasional alat berat di Sigi (BBM & Operator)', verified_by: admin.id,
            }
        });

        console.log('✅ Seeding success! Bencana: Banjir, Longsor, Gempa, Karhutla.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
}

seed();
