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
        console.log('🌱 Seeding database...');

        // ── Users ────────────────────────────────────────────────
        const hash = await bcrypt.hash('admin123', 12);
        const [superadmin] = await User.findOrCreate({
            where: { email: 'superadmin@bpbd.go.id' }, defaults: {
                name: 'Super Administrator', password_hash: hash, role: 'superadmin', opd: 'BPBD Provinsi',
            }
        });
        const [admin] = await User.findOrCreate({
            where: { email: 'admin@bpbd.go.id' }, defaults: {
                name: 'Admin BPBD', password_hash: hash, role: 'admin', opd: 'BPBD Provinsi',
            }
        });
        const [operator] = await User.findOrCreate({
            where: { email: 'operator@bpbd.go.id' }, defaults: {
                name: 'Operator Lapangan', password_hash: hash, role: 'operator', opd: 'BPBD Provinsi',
            }
        });
        console.log('✅ Users seeded');

        // ── Disaster Events ──────────────────────────────────────
        const [event1] = await DisasterEvent.findOrCreate({
            where: { title: 'Banjir Bandang Kec. Suka Makmur' }, defaults: {
                type: 'banjir', status: 'tanggap_darurat', severity: 'kritis',
                location_name: 'Kecamatan Suka Makmur, Kab. A',
                latitude: -6.2, longitude: 106.8,
                start_date: new Date(), description: 'Banjir bandang akibat luapan Sungai Ciliwung.',
                created_by: admin.id,
            }
        });
        const [event2] = await DisasterEvent.findOrCreate({
            where: { title: 'Tanah Longsor KM 42' }, defaults: {
                type: 'longsor', status: 'tanggap_darurat', severity: 'berat',
                location_name: 'Jalur Lintas Selatan, KM 42',
                latitude: -6.9, longitude: 107.6,
                start_date: new Date(), description: 'Longsor memutus akses jalan lintas selatan.',
                created_by: admin.id,
            }
        });
        console.log('✅ Disaster events seeded');

        // ── Casualties ───────────────────────────────────────────
        await Casualty.findOrCreate({
            where: { event_id: event1.id, recorded_at: new Date() }, defaults: {
                meninggal: 8, luka_berat: 24, luka_ringan: 60, hilang: 3,
                rumah_rusak_berat: 120, rumah_rusak_sedang: 200, rumah_rusak_ringan: 130,
                fasilitas_publik_rusak: 15, akses_jalan_putus: 6, updated_by: operator.id,
            }
        });
        await Casualty.findOrCreate({
            where: { event_id: event2.id, recorded_at: new Date() }, defaults: {
                meninggal: 4, luka_berat: 10, luka_ringan: 24, hilang: 2,
                rumah_rusak_berat: 0, rumah_rusak_sedang: 0, rumah_rusak_ringan: 0,
                fasilitas_publik_rusak: 0, akses_jalan_putus: 2, updated_by: operator.id,
            }
        });
        console.log('✅ Casualties seeded');

        // ── Shelters & Refugees ────────────────────────────────────
        const [shelter1] = await Shelter.findOrCreate({
            where: { name: 'Posko GOR Bintang Gemilang' }, defaults: {
                event_id: event1.id, location_name: 'GOR Bintang Gemilang, Kec. Suka Makmur',
                latitude: -6.21, longitude: 106.81, capacity: 1500, current_occupancy: 1250,
                status: 'aktif', pic_name: 'Kepala Dinas Sosial',
            }
        });
        const [shelter2] = await Shelter.findOrCreate({
            where: { name: 'Posko Desa Maju Sejahtera' }, defaults: {
                event_id: event1.id, location_name: 'Balai Desa Maju Sejahtera',
                latitude: -6.25, longitude: 106.85, capacity: 1000, current_occupancy: 850,
                status: 'aktif', pic_name: 'Kepala Desa',
            }
        });
        await Refugee.findOrCreate({
            where: { shelter_id: shelter1.id, recorded_date: new Date().toISOString().split('T')[0] }, defaults: {
                total_jiwa: 1250, balita: 188, anak: 313, dewasa: 625, lansia: 125,
                ibu_hamil: 22, disabilitas: 15, updated_by: operator.id,
            }
        });
        await Refugee.findOrCreate({
            where: { shelter_id: shelter2.id, recorded_date: new Date().toISOString().split('T')[0] }, defaults: {
                total_jiwa: 850, balita: 127, anak: 213, dewasa: 425, lansia: 85,
                ibu_hamil: 14, disabilitas: 10, updated_by: operator.id,
            }
        });
        console.log('✅ Shelters & Refugees seeded');

        // ── Health Reports ───────────────────────────────────────
        await HealthReport.findOrCreate({
            where: { shelter_id: shelter1.id, disease_name: 'ISPA' }, defaults: {
                case_count: 142, severity: 'sedang', notes: 'Penyakit dominan, perlu masker dan obat batuk.',
                reported_by: operator.id,
            }
        });
        await HealthReport.findOrCreate({
            where: { shelter_id: shelter1.id, disease_name: 'Diare' }, defaults: {
                case_count: 45, severity: 'sedang', notes: 'Korelasi dengan sanitasi kurang.',
                reported_by: operator.id,
            }
        });
        console.log('✅ Health reports seeded');

        // ── Warehouses & Inventory ───────────────────────────────
        const [whProv] = await Warehouse.findOrCreate({
            where: { name: 'Gudang Provinsi (Utama)' }, defaults: {
                level: 'provinsi', location_name: 'Kantor BPBD Provinsi',
                latitude: -6.20, longitude: 106.80, capacity_pct: 85, status: 'aktif',
            }
        });
        const [whKabA] = await Warehouse.findOrCreate({
            where: { name: 'Gudang Kab. A (Zona Merah)' }, defaults: {
                level: 'kabupaten', location_name: 'Kabupaten A',
                latitude: -6.60, longitude: 107.20, capacity_pct: 92, status: 'aktif',
            }
        });
        const items = [
            { warehouse_id: whProv.id, item_name: 'Beras', unit: 'Ton', stock_quantity: 45, daily_consumption: 8, min_threshold: 10 },
            { warehouse_id: whProv.id, item_name: 'Air Bersih', unit: 'KL', stock_quantity: 120, daily_consumption: 40, min_threshold: 40 },
            { warehouse_id: whProv.id, item_name: 'Tenda', unit: 'Unit', stock_quantity: 350, daily_consumption: 120, min_threshold: 50 },
            { warehouse_id: whProv.id, item_name: 'Obat-obatan', unit: 'Box', stock_quantity: 85, daily_consumption: 15, min_threshold: 10 },
            { warehouse_id: whKabA.id, item_name: 'Beras', unit: 'Ton', stock_quantity: 10, daily_consumption: 5, min_threshold: 5 },
            { warehouse_id: whKabA.id, item_name: 'Air Bersih', unit: 'KL', stock_quantity: 25, daily_consumption: 20, min_threshold: 20 },
            { warehouse_id: whKabA.id, item_name: 'Tenda', unit: 'Unit', stock_quantity: 120, daily_consumption: 30, min_threshold: 20 },
        ];
        for (const item of items) {
            await InventoryItem.findOrCreate({ where: { warehouse_id: item.warehouse_id, item_name: item.item_name }, defaults: item });
        }
        console.log('✅ Warehouses & Inventory seeded');

        // ── Shipments ────────────────────────────────────────────
        await LogisticsShipment.findOrCreate({
            where: { shipment_code: 'TRK-8821' }, defaults: {
                from_warehouse_id: whProv.id, to_warehouse_id: whKabA.id,
                cargo_description: 'Beras 5T, Air Bersih 10KL',
                status: 'in_transit', driver_name: 'Pak Budi', vehicle_plate: 'B 1234 CD',
                departure_time: new Date(), eta: new Date(Date.now() + 45 * 60 * 1000),
                created_by: operator.id,
            }
        });
        await LogisticsShipment.findOrCreate({
            where: { shipment_code: 'TRK-9004' }, defaults: {
                from_warehouse_id: whKabA.id, to_shelter_id: shelter1.id,
                cargo_description: 'Air Bersih 5KL, Beras 2T',
                status: 'delayed', delay_reason: 'Akses jalan terputus longsor di KM 12',
                driver_name: 'Pak Andi', vehicle_plate: 'B 5678 EF',
                departure_time: new Date(), created_by: operator.id,
            }
        });
        console.log('✅ Shipments seeded');

        // ── Operation Tasks ──────────────────────────────────────
        const tasks = [
            { event_id: event1.id, title: 'Kirim alat berat ke Desa Suka Maju yang terisolir', priority: 'critical', status: 'todo', assigned_to_opd: 'Dinas PU', estimated_hours: 2 },
            { event_id: event1.id, title: 'Distribusi air bersih ke Posko Utama A', priority: 'high', status: 'in_progress', assigned_to_opd: 'BPBD', estimated_hours: 4 },
            { event_id: event1.id, title: 'Evakuasi warga rentan di Zona Merah Banjir', priority: 'critical', status: 'done', assigned_to_opd: 'Basarnas', estimated_hours: 8, completed_at: new Date() },
            { event_id: event2.id, title: 'Pembersihan material longsor di KM 42', priority: 'high', status: 'todo', assigned_to_opd: 'Dinas PU', estimated_hours: 12 },
            { event_id: event2.id, title: 'Perbaikan Tiang Listrik Tumbang di Jalur Evakuasi', priority: 'medium', status: 'todo', assigned_to_opd: 'PLN', estimated_hours: 6 },
        ];
        for (const t of tasks) {
            await OperationTask.findOrCreate({ where: { title: t.title }, defaults: { ...t, created_by: operator.id } });
        }
        console.log('✅ Operation tasks seeded');

        // ── Decision Logs ────────────────────────────────────────
        await DecisionLog.findOrCreate({
            where: { decision_text: 'Setujui pencairan BTT Tahap 1 sebesar Rp 12 Miliar untuk logistik darurat.' }, defaults: {
                event_id: event1.id, decided_by: 'Gubernur', decided_at: new Date(), created_by: admin.id,
            }
        });
        await DecisionLog.findOrCreate({
            where: { decision_text: 'Aktifkan Tim Reaksi Cepat (TRC) lintas OPD, status Tanggap Darurat ditetapkan 14 Hari.' }, defaults: {
                event_id: event1.id, decided_by: 'Kepala BPBD', decided_at: new Date(Date.now() - 86400000), created_by: admin.id,
            }
        });
        console.log('✅ Decision logs seeded');

        // ── Budget & Expenditures ────────────────────────────────
        const [alloc1] = await BudgetAllocation.findOrCreate({
            where: { sector: 'Logistik & Pangan' }, defaults: {
                event_id: event1.id, source: 'BTT', total_amount: 20000000000, // Rp 20M
                allocated_at: new Date(),
            }
        });
        const [alloc2] = await BudgetAllocation.findOrCreate({
            where: { sector: 'Alat Berat & Evakuasi' }, defaults: {
                event_id: event1.id, source: 'BTT', total_amount: 15000000000,
                allocated_at: new Date(),
            }
        });
        await DailyExpenditure.findOrCreate({
            where: { allocation_id: alloc1.id, expenditure_date: new Date().toISOString().split('T')[0] }, defaults: {
                amount: 3500000000, description: 'Pembelian beras dan distribusi air bersih', verified_by: admin.id,
            }
        });
        await DailyExpenditure.findOrCreate({
            where: { allocation_id: alloc2.id, expenditure_date: new Date().toISOString().split('T')[0] }, defaults: {
                amount: 4200000000, description: 'Sewa alat berat dan bahan bakar operasional', verified_by: admin.id,
            }
        });
        console.log('✅ Budget & expenditures seeded');

        console.log('\n🎉 Seeding selesai!');
        console.log('───────────────────────────────────────');
        console.log('Login credentials (password: admin123):');
        console.log('  superadmin@bpbd.go.id (superadmin)');
        console.log('  admin@bpbd.go.id (admin)');
        console.log('  operator@bpbd.go.id (operator)');
        console.log('───────────────────────────────────────');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
}

seed();
