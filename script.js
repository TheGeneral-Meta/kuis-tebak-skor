// admin-script.js - Complete Logic for Admin Panel

// ============ DATA LOADING ============
let config = {};
let predictions = [];

function loadAdminData() {
    const savedConfig = localStorage.getItem('quiz_config');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
    } else {
        config = {
            homeTeam: { name: "Liverpool", logo: "https://placehold.co/120x120/1e293b/3b82f6?text=LIV" },
            awayTeam: { name: "Real Madrid", logo: "https://placehold.co/120x120/1e293b/3b82f6?text=RMA" },
            matchDate: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
            matchStatus: "upcoming",
            finalScore: { home: null, away: null },
            deadlineMinutes: 90,
            rules: "1. 1 akun hanya boleh 1 kali submit\n2. Tebakan harus dikirim sebelum pertandingan dimulai\n3. Setelah waktu habis, form otomatis terkunci\n4. Pemenang berdasarkan tebakan paling akurat\n5. Jika skor sama, pemenang ditentukan dari waktu submit tercepat\n6. Data yang sudah dikirim tidak bisa diubah\n7. Keputusan admin bersifat mutlak dan tidak dapat diganggu gugat\n8. Hadiah akan dikirim ke nomor WhatsApp yang terdaftar maksimal 3x24 jam",
            prizes: "🏆 HADIAH KUIS TEBAK SKOR 🏆\n\n🥇 GOLD TICKET (Premium)\n• Rp 500.000\n• Merchandise Official\n• E-Voucher Rp 100.000\n• Sertifikat Digital\n\n🥈 SILVER TICKET (Regular)\n• Rp 200.000\n• Voucher Bonus Rp 50.000\n• E-Voucher Belanja\n\n🎫 FREE ENTRY\n• E-Voucher Rp 50.000\n• Untuk 5 tebakan akurat tercepat\n\n📌 Catatan: Hadiah akan ditransfer ke rekening/e-wallet pemenang."
        };
    }
    
    const savedPredictions = localStorage.getItem('quiz_predictions');
    if (savedPredictions) {
        predictions = JSON.parse(savedPredictions);
    } else {
        predictions = [];
    }
    
    populateForm();
    updateAdminLeaderboard();
}

function populateForm() {
    document.getElementById('homeTeamName').value = config.homeTeam.name;
    document.getElementById('awayTeamName').value = config.awayTeam.name;
    document.getElementById('homeTeamLogo').value = config.homeTeam.logo;
    document.getElementById('awayTeamLogo').value = config.awayTeam.logo;
    document.getElementById('homePreview').src = config.homeTeam.logo;
    document.getElementById('awayPreview').src = config.awayTeam.logo;
    document.getElementById('matchDateTime').value = config.matchDate;
    document.getElementById('matchStatus').value = config.matchStatus;
    document.getElementById('finalScoreHome').value = config.finalScore.home !== null ? config.finalScore.home : '';
    document.getElementById('finalScoreAway').value = config.finalScore.away !== null ? config.finalScore.away : '';
    document.getElementById('deadlineMinutes').value = config.deadlineMinutes;
    document.getElementById('rulesText').value = config.rules;
    document.getElementById('prizeText').value = config.prizes;
}

// ============ PREVIEW LOGOS ============
document.getElementById('homeTeamLogo').addEventListener('input', (e) => {
    const url = e.target.value;
    document.getElementById('homePreview').src = url || 'https://placehold.co/100x100/1e293b/3b82f6?text=LOGO';
});

document.getElementById('awayTeamLogo').addEventListener('input', (e) => {
    const url = e.target.value;
    document.getElementById('awayPreview').src = url || 'https://placehold.co/100x100/1e293b/3b82f6?text=LOGO';
});

// ============ SAVE MATCH SETTINGS ============
document.getElementById('saveMatchBtn').addEventListener('click', () => {
    config.homeTeam = {
        name: document.getElementById('homeTeamName').value,
        logo: document.getElementById('homeTeamLogo').value || 'https://placehold.co/120x120/1e293b/3b82f6?text=HOME'
    };
    config.awayTeam = {
        name: document.getElementById('awayTeamName').value,
        logo: document.getElementById('awayTeamLogo').value || 'https://placehold.co/120x120/1e293b/3b82f6?text=AWAY'
    };
    config.matchDate = document.getElementById('matchDateTime').value;
    config.matchStatus = document.getElementById('matchStatus').value;
    
    const homeFinal = document.getElementById('finalScoreHome').value;
    const awayFinal = document.getElementById('finalScoreAway').value;
    config.finalScore = {
        home: homeFinal !== '' ? parseInt(homeFinal) : null,
        away: awayFinal !== '' ? parseInt(awayFinal) : null
    };
    
    localStorage.setItem('quiz_config', JSON.stringify(config));
    alert('✅ Pengaturan pertandingan berhasil disimpan!');
    
    // Refresh preview
    document.getElementById('homePreview').src = config.homeTeam.logo;
    document.getElementById('awayPreview').src = config.awayTeam.logo;
});

// ============ SAVE GENERAL SETTINGS ============
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    config.deadlineMinutes = parseInt(document.getElementById('deadlineMinutes').value);
    config.rules = document.getElementById('rulesText').value;
    config.prizes = document.getElementById('prizeText').value;
    
    localStorage.setItem('quiz_config', JSON.stringify(config));
    alert('✅ Pengaturan umum berhasil disimpan!');
});

// ============ ADMIN LEADERBOARD ============
function updateAdminLeaderboard() {
    const tbody = document.getElementById('adminLeaderboardBody');
    
    if (!predictions.length) {
        tbody.innerHTML = `<tr class="empty-row">
            <td colspan="7">
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Belum ada data tebakan</p>
                </div>
            </td>
        </tr>`;
        return;
    }
    
    const sorted = [...predictions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let html = '';
    sorted.forEach(pred => {
        let isCorrect = false;
        if (config.matchStatus === 'ended' && config.finalScore.home !== null) {
            isCorrect = (pred.scoreHome === config.finalScore.home && pred.scoreAway === config.finalScore.away);
        }
        
        const statusText = isCorrect ? 'Tepat' : (config.matchStatus === 'ended' ? 'Tidak Tepat' : 'Menunggu');
        const statusClass = isCorrect ? 'status-correct' : (config.matchStatus === 'ended' ? 'status-wrong' : 'status-pending');
        
        html += `<tr>
            <td>${pred.id}</td>
            <td><i class="fas fa-user-circle"></i> ${pred.username}</td>
            <td>${pred.contact}</td>
            <td class="font-mono font-bold">${pred.scoreHome} : ${pred.scoreAway}</td>
            <td>${new Date(pred.timestamp).toLocaleString()}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td><button class="delete-btn" onclick="deletePrediction(${pred.id})"><i class="fas fa-trash-alt"></i> Hapus</button></td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

// ============ DELETE PREDICTION ============
window.deletePrediction = (id) => {
    if (confirm('Hapus tebakan ini? Data akan hilang permanen.')) {
        predictions = predictions.filter(p => p.id !== id);
        localStorage.setItem('quiz_predictions', JSON.stringify(predictions));
        updateAdminLeaderboard();
        alert('✅ Tebakan berhasil dihapus!');
    }
};

// ============ RESET ALL PREDICTIONS ============
document.getElementById('resetLeaderboard').addEventListener('click', () => {
    if (confirm('⚠️ PERINGATAN! Semua tebakan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
        predictions = [];
        localStorage.setItem('quiz_predictions', JSON.stringify(predictions));
        updateAdminLeaderboard();
        alert('✅ Semua tebakan telah direset!');
    }
});

// ============ CALCULATE WINNERS ============
document.getElementById('calculateWinners').addEventListener('click', () => {
    if (config.matchStatus !== 'ended') {
        alert('⚠️ Pertandingan belum selesai! Ubah status menjadi "Selesai" terlebih dahulu di panel Setup Pertandingan.');
        return;
    }
    
    if (config.finalScore.home === null || config.finalScore.away === null) {
        alert('⚠️ Masukkan skor akhir pertandingan terlebih dahulu!');
        return;
    }
    
    const correctPredictions = predictions.filter(p => 
        p.scoreHome === config.finalScore.home && p.scoreAway === config.finalScore.away
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (correctPredictions.length === 0) {
        alert('📊 Tidak ada tebakan yang tepat!');
        return;
    }
    
    let message = '🏆 PEMENANG KUIS TEBAK SKOR 🏆\n\n';
    message += `Skor Akhir: ${config.finalScore.home} : ${config.finalScore.away}\n`;
    message += `Total Tebakan Tepat: ${correctPredictions.length}\n\n`;
    message += `📋 Daftar Pemenang (urutan waktu tercepat):\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    correctPredictions.slice(0, 10).forEach((p, i) => {
        const waktu = new Date(p.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        message += `${i+1}. ${p.username} | ${p.scoreHome}:${p.scoreAway} | ${waktu}\n`;
    });
    
    if (correctPredictions.length > 10) {
        message += `\n... dan ${correctPredictions.length - 10} pemenang lainnya`;
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `✅ Selamat kepada para pemenang!\nHadiah akan dikirim via WhatsApp.`;
    
    alert(message);
});

// ============ INITIALIZE ============
loadAdminData();
