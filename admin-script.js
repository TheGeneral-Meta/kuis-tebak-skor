// Load data dari localStorage
let config = {};
let predictions = [];

function loadAdminData() {
    const savedConfig = localStorage.getItem('quiz_config');
    if (savedConfig) config = JSON.parse(savedConfig);
    else {
        config = {
            homeTeam: { name: "Liverpool", logo: "https://placehold.co/100x100/1e293b/3b82f6?text=LIV" },
            awayTeam: { name: "Real Madrid", logo: "https://placehold.co/100x100/1e293b/3b82f6?text=RMA" },
            matchDate: "2025-04-12T19:45",
            matchStatus: "upcoming",
            finalScore: { home: null, away: null },
            deadlineMinutes: 90,
            rules: "1. 1 akun hanya 1 kali submit\n2. Tebakan harus dikirim sebelum pertandingan dimulai\n3. Setelah waktu habis, form otomatis terkunci\n4. Pemenang berdasarkan tebakan paling akurat\n5. Jika skor sama, pemenang ditentukan dari waktu submit tercepat\n6. Data yang sudah dikirim tidak bisa diubah\n7. Keputusan admin mutlak",
            prizes: "🏆 HADIAH KUIS TEBAK SKOR 🏆\n\n🥇 GOLD TICKET (Rp 50.000)\n• Rp 500.000\n• Merchandise Official\n• E-Voucher Rp 100.000\n\n🥈 SILVER TICKET (Rp 25.000)\n• Rp 200.000\n• Voucher Bonus Rp 50.000\n\n🎫 FREE ENTRY\n• E-Voucher Rp 50.000\n• Untuk 5 tebakan akurat tercepat"
        };
    }
    
    const savedPredictions = localStorage.getItem('quiz_predictions');
    if (savedPredictions) predictions = JSON.parse(savedPredictions);
    else predictions = [];
    
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

// Preview logo
document.getElementById('homeTeamLogo')?.addEventListener('input', (e) => {
    document.getElementById('homePreview').src = e.target.value || 'https://placehold.co/100x100/1e293b/3b82f6?text=LOGO';
});
document.getElementById('awayTeamLogo')?.addEventListener('input', (e) => {
    document.getElementById('awayPreview').src = e.target.value || 'https://placehold.co/100x100/1e293b/3b82f6?text=LOGO';
});

// Save match settings
document.getElementById('saveMatchBtn')?.addEventListener('click', () => {
    config.homeTeam = {
        name: document.getElementById('homeTeamName').value,
        logo: document.getElementById('homeTeamLogo').value || 'https://placehold.co/100x100/1e293b/3b82f6?text=HOME'
    };
    config.awayTeam = {
        name: document.getElementById('awayTeamName').value,
        logo: document.getElementById('awayTeamLogo').value || 'https://placehold.co/100x100/1e293b/3b82f6?text=AWAY'
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
    alert('✅ Pengaturan pertandingan disimpan!');
});

// Save general settings
document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    config.deadlineMinutes = parseInt(document.getElementById('deadlineMinutes').value);
    config.rules = document.getElementById('rulesText').value;
    config.prizes = document.getElementById('prizeText').value;
    
    localStorage.setItem('quiz_config', JSON.stringify(config));
    alert('✅ Pengaturan disimpan!');
});

// Update admin leaderboard
function updateAdminLeaderboard() {
    const tbody = document.getElementById('adminLeaderboardBody');
    if (!predictions.length) {
        tbody.innerHTML = '运转<td colspan="6" class="text-center py-8 text-gray-400">Belum ada tebakan</td></tr>';
        return;
    }
    
    const sorted = [...predictions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let html = '';
    sorted.forEach(pred => {
        let isCorrect = false;
        if (config.matchStatus === 'ended' && config.finalScore.home !== null) {
            isCorrect = (pred.scoreHome === config.finalScore.home && pred.scoreAway === config.finalScore.away);
        }
        
        html += `<tr class="border-b border-gray-700">
            <td class="p-3">${pred.username}</td>
            <td class="p-3">${pred.contact}</td>
            <td class="p-3 text-center font-mono">${pred.scoreHome} : ${pred.scoreAway}</td>
            <td class="p-3 text-center text-xs">${new Date(pred.timestamp).toLocaleString()}</td>
            <td class="p-3 text-center">
                ${isCorrect ? '<span class="text-green-400"><i class="fas fa-check"></i> Tepat</span>' : config.matchStatus === 'ended' ? '<span class="text-red-400">Tidak Tepat</span>' : '<span class="text-yellow-400">Menunggu</span>'}
            </td>
            <td class="p-3 text-center">
                <button onclick="deletePrediction(${pred.id})" class="text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

// Delete prediction
window.deletePrediction = (id) => {
    if (confirm('Hapus tebakan ini?')) {
        predictions = predictions.filter(p => p.id !== id);
        localStorage.setItem('quiz_predictions', JSON.stringify(predictions));
        updateAdminLeaderboard();
        alert('Tebakan dihapus');
    }
};

// Reset all predictions
document.getElementById('resetLeaderboard')?.addEventListener('click', () => {
    if (confirm('⚠️ PERINGATAN: Semua tebakan akan dihapus permanen! Lanjutkan?')) {
        predictions = [];
        localStorage.setItem('quiz_predictions', JSON.stringify(predictions));
        updateAdminLeaderboard();
        alert('Semua tebakan telah direset');
    }
});

// Calculate winners
document.getElementById('calculateWinners')?.addEventListener('click', () => {
    if (config.matchStatus !== 'ended') {
        alert('Pertandingan belum selesai! Ubah status menjadi "Selesai" terlebih dahulu.');
        return;
    }
    
    if (config.finalScore.home === null || config.finalScore.away === null) {
        alert('Masukkan skor akhir pertandingan terlebih dahulu!');
        return;
    }
    
    const correctPredictions = predictions.filter(p => 
        p.scoreHome === config.finalScore.home && p.scoreAway === config.finalScore.away
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (correctPredictions.length === 0) {
        alert('Tidak ada tebakan yang tepat!');
        return;
    }
    
    let message = '🏆 PEMENANG KUIS 🏆\n\n';
    correctPredictions.slice(0, 5).forEach((p, i) => {
        message += `${i+1}. ${p.username} (${p.scoreHome}:${p.scoreAway}) - ${new Date(p.timestamp).toLocaleTimeString()}\n`;
    });
    message += `\nSkor Akhir: ${config.finalScore.home} : ${config.finalScore.away}`;
    alert(message);
});

loadAdminData();
