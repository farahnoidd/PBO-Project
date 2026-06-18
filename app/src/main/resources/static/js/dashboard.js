/**
 * File: dashboard.js
 * Tim Frontend (Mahasiswa 9/10/12)
 * Fungsi: Mengelola UI Dashboard, merender Chart.js, dan memuat data API.
 */

import { getDashboardData, requireAuth } from './api.js';

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    setupActionButtons();
    fetchDashboardData(); 
});

Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#707975'; 

function setupActionButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.innerText.trim();
        if (text.includes('Tambah Pemasukan')) {
            btn.addEventListener('click', () => window.location.href = 'pemasukan.html');
        } else if (text.includes('Tambah Pengeluaran')) {
            btn.addEventListener('click', () => window.location.href = 'pengeluaran.html');
        } else if (text.includes('Lihat Semua')) {
            btn.addEventListener('click', () => window.location.href = 'laporan.html');
        }
    });
}

async function fetchDashboardData() {
    try {
        const apiResponse = await getDashboardData();
        
        const summaryData = {
            totalSaldo: apiResponse.totalSaldo || 0,
            pemasukanBulanIni: apiResponse.totalPemasukan || 0,
            pengeluaranBulanIni: apiResponse.totalPengeluaran || 0,
            saldoAkun: {
                bca: 0, mandiri: 0, gopay: 0, dana: 0, cash: 0 
            }
        };

        const categoryBreakdown = {
            labels: apiResponse.grafikKategori ? apiResponse.grafikKategori.map(item => item.kategori) : [],
            data: apiResponse.grafikKategori ? apiResponse.grafikKategori.map(item => item.jumlah) : [] 
        };

        const monthlyTrend = {
            labels: apiResponse.grafikBulanan ? apiResponse.grafikBulanan.map(item => item.bulan) : [],
            pemasukan: apiResponse.grafikBulanan ? apiResponse.grafikBulanan.map(item => item.pemasukan) : [],
            pengeluaran: apiResponse.grafikBulanan ? apiResponse.grafikBulanan.map(item => item.pengeluaran) : []
        };

        updateCards(summaryData);
        renderDonutChart(categoryBreakdown);
        renderBarChart(monthlyTrend);

    } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
        alert("Gagal memuat data dari server. Pastikan backend sudah berjalan.");
    }
}

function updateCards(summaryData) {
    // Format Rupiah Standar
    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', maximumFractionDigits: 0
        }).format(angka);
    };

    // Format Pendek (k/M) untuk ditaruh di tengah Donut Chart
    const formatShort = (angka) => {
        if (angka >= 1000000) return 'Rp ' + (angka / 1000000).toFixed(1) + 'M';
        if (angka >= 1000) return 'Rp ' + (angka / 1000).toFixed(0) + 'k';
        return 'Rp ' + angka;
    };

    document.getElementById('totalSaldo').innerText = formatRp(summaryData.totalSaldo);
    document.getElementById('pemasukanBulanIni').innerText = formatRp(summaryData.pemasukanBulanIni);
    document.getElementById('pengeluaranBulanIni').innerText = formatRp(summaryData.pengeluaranBulanIni);

    // Update Text di tengah Donat Chart agar dinamis
    const donutCenterText = document.getElementById('totalPengeluaranTengah');
    if(donutCenterText) {
        donutCenterText.innerText = formatShort(summaryData.pengeluaranBulanIni);
    }

    if(document.getElementById('saldoBca')) document.getElementById('saldoBca').innerText = formatRp(summaryData.saldoAkun.bca);
    if(document.getElementById('saldoMandiri')) document.getElementById('saldoMandiri').innerText = formatRp(summaryData.saldoAkun.mandiri);
    if(document.getElementById('saldoGopay')) document.getElementById('saldoGopay').innerText = formatRp(summaryData.saldoAkun.gopay);
    if(document.getElementById('saldoDana')) document.getElementById('saldoDana').innerText = formatRp(summaryData.saldoAkun.dana);
    if(document.getElementById('saldoCash')) document.getElementById('saldoCash').innerText = formatRp(summaryData.saldoAkun.cash);
}

function renderDonutChart(categoryData) {
    const bgColors = ['#b7e7f7', '#d7defa', '#fef3c7', '#e3e2e1', '#b5ead7', '#ffdad6'];
    
    // 1. Render Chart
    const ctx = document.getElementById('kategoriChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.data,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: Rp ${context.raw.toLocaleString('id-ID')}` 
                    }
                }
            }
        }
    });

    // 2. Generate Legend HTML Secara Dinamis (Menghitung persen)
    const legendContainer = document.getElementById('kategoriLegend');
    if (legendContainer && categoryData.labels.length > 0) {
        legendContainer.innerHTML = ''; // Kosongkan dulu
        const total = categoryData.data.reduce((a, b) => a + b, 0); // Hitung total data
        
        categoryData.labels.forEach((label, index) => {
            const value = categoryData.data[index];
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            const color = bgColors[index % bgColors.length];

            // Render div legend
            legendContainer.innerHTML += `
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                    <span class="text-[12px] text-on-surface-variant">${label} (${percentage}%)</span>
                </div>
            `;
        });
    }
}

function renderBarChart(trendData) {
    const ctx = document.getElementById('trenChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trendData.labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: trendData.pemasukan,
                    backgroundColor: '#b5ead7',
                    borderRadius: 4,
                    barPercentage: 0.6
                },
                {
                    label: 'Pengeluaran',
                    data: trendData.pengeluaran,
                    backgroundColor: '#ffdad6',
                    borderRadius: 4,
                    barPercentage: 0.6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f4f3f2', drawBorder: false },
                    ticks: { callback: (value) => 'Rp ' + (value / 1000000) + ' Jt' }
                },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}