// ============ DATA STORAGE ============
let config = {
    homeTeam: { name: "Liverpool", logo: "https://placehold.co/100x100/1e293b/3b82f6?text=LIV" },
    awayTeam: { name: "Real Madrid", logo: "https://placehold.co/100x100/1e293b/3b82f6?text=RMA" },
    matchDate: "2025-04-12T19:45",
    matchStatus: "upcoming",
    finalScore: { home: null, away: null },
    deadlineMinutes: 90,
    rules: "1. 1 akun hanya 1 kali submit\n2. Tebakan sebelum pertandingan\n3. Keputusan admin mutlak",
    prizes: "🥇 Gold: Rp 500.000\n🥈 Silver: Rp 200.000\n🎫 Free: Voucher Rp 50.000"
};

let predictions = [];
let currentUser = null;

// Load data dari localStorage
function loadData() {
    const savedConfig = localStorage.getItem('quiz_config');
    if (savedConfig) config = JSON.parse(savedConfig);
    
    const savedPredictions = localStorage.getItem('quiz_predictions');
    if (savedPredictions) predictions = JSON.parse(savedPredictions);
    
    updateMatchDisplay();
    updateLeaderboard();
    updateCountdown();
}

// Update tampilan pertandingan
function updateMatchDisplay() {
    document.getElementById('homeName').innerText = config.homeTeam.name;
    document.getElementById('awayName').innerText = config.awayTeam.name;
    document.getElementById('homeLogo').src = config.homeTeam.logo;
    document.getElementById('awayLogo').src = config.awayTeam.logo;
    
    const matchDate = new Date(config.matchDate);
    document.getElementById('matchDateTime').innerHTML = `<i class="far fa-calendar-alt"></i> ${matchDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • ${matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    
    const statusMap = {
        upcoming: { text: 'Segera Dimulai', class: 'bg-yellow-500/20 text-yellow-400' },
        live: { text: 'Sedang Berlangsung!', class: 'bg-red-500/20 text-red-400 pulse' },
        ended: { text: 'Telah Berakhir', class: 'bg-gray-500/20 text-gray-400' }
    };
    const status = statusMap[config.matchStatus] || statusMap.upcoming;
    document.getElementById('statusText').innerHTML = `<i class="fas fa-${config.matchStatus === 'live' ? 'play' : config.matchStatus === 'ended' ? 'flag-checkered' : 'clock'}"></i> ${status.text}`;
    document.getElementById('matchStatus').className = `inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${status.class}`;
}

// Update leaderboard
function updateLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!predictions.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">Belum ada tebakan</td></tr>';
        document.getElementById('totalPredictions').innerText = '0 tebakan';
        return;
    }
    
    // Sort by timestamp (oldest first for tiebreaker)
    const sorted = [...predictions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let html = '';
    sorted.forEach((pred, idx) => {
        let maskedName = pred.username;
        if (pred.username.length > 4) maskedName = pred.username.slice(0, 4) + '**';
        else if (pred.username.length > 2) maskedName = pred.username.slice(0, 2) + '***';
        
        let rankClass = '';
        if (idx === 0) rankClass = 'rank-1 text-white';
        else if (idx === 1) rankClass = 'rank-2 text-white';
        else if (idx === 2) rankClass = 'rank-3 text-white';
        
        let statusBadge = '<span class="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Menunggu</span>';
        if (config.matchStatus === 'ended' && config.finalScore.home !== null) {
            const isCorrect = (parseInt(pred.scoreHome) === config.finalScore.home && parseInt(pred.scoreAway) === config.finalScore.away);
            statusBadge = isCorrect ? 
                '<span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400"><i class="fas fa-check"></i> Tepat</span>' :
                '<span class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400"><i class="fas fa-times"></i> Tidak Tepat</span>';
        }
        
        html += `<tr class="${rankClass}">
            <td class="text-center font-bold">${idx + 1}</td>
            <td><i class="fas fa-user-circle text-blue-400 mr-1"></i> ${maskedName}</td>
            <td class="text-center font-mono font-bold">${pred.scoreHome} : ${pred.scoreAway}</td>
            <td class="text-center text-xs">${new Date(pred.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
            <td class="text-center">${statusBadge}</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    document.getElementById('totalPredictions').innerText = `${predictions.length} tebakan`;
}

// Countdown timer
let timerInterval;
let formLocked = false;

function updateCountdown() {
    const matchTime = new Date(config.matchDate).getTime();
    const now = new Date().getTime();
    const deadline = matchTime;
    
    if (now >= deadline) {
        if (timerInterval) clearInterval(timerInterval);
        document.getElementById('timerDisplay').innerHTML = "00:00:00";
        document.getElementById('disabledMessage').classList.remove('hidden');
        document.getElementById('predictionForm').classList.add('form-disabled');
        formLocked = true;
        return;
    }
    
    const diff = deadline - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (3600000)) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    document.getElementById('timerDisplay').innerHTML = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    
    // Lock form 5 minutes before match
    if (diff < 300000 && !formLocked) {
        formLocked = true;
        document.getElementById('predictionForm').classList.add('form-disabled');
        document.getElementById('disabledMessage').classList.remove('hidden');
        document.getElementById('disabledMessage').innerHTML = '<i class="fas fa-ban"></i> Pendaftaran ditutup 5 menit sebelum pertandingan!';
    }
}

// Submit prediction
document.getElementById('predictionForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (formLocked) {
        alert('⛔ Waktu tebak sudah habis!');
        return;
    }
    
    const username = document.getElementById('username').value.trim();
    const scoreHome = parseInt(document.getElementById('scoreHome').value);
    const scoreAway = parseInt(document.getElementById('scoreAway').value);
    const contact = document.getElementById('contact').value.trim();
    
    let isValid = true;
    
    if (username.length < 3) {
        document.getElementById('userError').innerText = 'Username minimal 3 karakter';
        document.getElementById('userError').classList.remove('hidden');
        isValid = false;
    } else document.getElementById('userError').classList.add('hidden');
    
    if (isNaN(scoreHome) || isNaN(scoreAway) || scoreHome < 0 || scoreAway < 0) {
        document.getElementById('scoreError').innerText = 'Skor harus angka 0-99';
        document.getElementById('scoreError').classList.remove('hidden');
        isValid = false;
    } else document.getElementById('scoreError').classList.add('hidden');
    
    if (!contact.match(/^[0-9]{10,13}$/)) {
        document.getElementById('contactError').innerText = 'Nomor WA tidak valid (10-13 digit)';
        document.getElementById('contactError').classList.remove('hidden');
        isValid = false;
    } else document.getElementById('contactError').classList.add('hidden');
    
    // Check duplicate username
    if (predictions.some(p => p.username.toLowerCase() === username.toLowerCase())) {
        alert('❌ Username sudah digunakan!');
        return;
    }
    
    if (!isValid) return;
    
    const newPrediction = {
        id: Date.now(),
        username: username,
        contact: contact,
        scoreHome: scoreHome,
        scoreAway: scoreAway,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    predictions.push(newPrediction);
    localStorage.setItem('quiz_predictions', JSON.stringify(predictions));
    
    alert(`✅ Tebakan berhasil dikirim!\n\n${username}: ${scoreHome} : ${scoreAway}`);
    
    document.getElementById('username').value = '';
    document.getElementById('scoreHome').value = '';
    document.getElementById('scoreAway').value = '';
    document.getElementById('contact').value = '';
    
    updateLeaderboard();
});

// Check my prediction
document.getElementById('checkMyPrediction')?.addEventListener('click', () => {
    const name = prompt('Masukkan username Anda:');
    if (!name) return;
    const found = predictions.find(p => p.username.toLowerCase() === name.toLowerCase());
    if (found) {
        alert(`✅ Ditemukan!\nUsername: ${found.username}\nPrediksi: ${found.scoreHome} : ${found.scoreAway}\nWaktu: ${new Date(found.timestamp).toLocaleString()}`);
    } else {
        alert('❌ Username tidak ditemukan');
    }
});

// Refresh leaderboard
document.getElementById('refreshLeaderboard')?.addEventListener('click', () => {
    updateLeaderboard();
    alert('Leaderboard direfresh');
});

// Modal handlers
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.getElementById('rulesBtn')?.addEventListener('click', () => {
    document.getElementById('rulesContent').innerHTML = config.rules.replace(/\n/g, '<br>');
    openModal('rulesModal');
});
document.getElementById('prizeBtn')?.addEventListener('click', () => {
    document.getElementById('prizeContent').innerHTML = config.prizes.replace(/\n/g, '<br>');
    openModal('prizeModal');
});

document.getElementById('closeRulesModal')?.addEventListener('click', () => closeModal('rulesModal'));
document.getElementById('closeRulesModalBtn')?.addEventListener('click', () => closeModal('rulesModal'));
document.getElementById('closePrizeModal')?.addEventListener('click', () => closeModal('prizeModal'));
document.getElementById('closePrizeModalBtn')?.addEventListener('click', () => closeModal('prizeModal'));

window.onclick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    }
};

// Initialize
loadData();
setInterval(updateCountdown, 1000);
