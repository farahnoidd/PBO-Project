/**
 * File: laporan.js
 * Tim Frontend (Mahasiswa 10 & 12)
 * Fungsi: Mengelola UI Laporan Tahunan, merender Chart.js, dan fitur integrasi PDF.
 */

import { getLaporanTahunan, requireAuth } from './api.js';

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    setupChartDefaults();
    const currentYear = new Date().getFullYear();
    fetchLaporanData(currentYear);
    setupActionButtons();
});

function setupChartDefaults() {
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#707975'; 
}

async function fetchLaporanData(tahun) {
    try {
        const apiResponse = await getLaporanTahunan(tahun);

        const yearlyTrend = {
            labels: apiResponse.grafikBulanan ? apiResponse.grafikBulanan.map(item => item.bulan) : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
            pemasukan: apiResponse.grafikBulanan ? apiResponse.grafikBulanan.map(item => item.pemasukan) : [],
            pengeluaran: apiResponse.grafikBulanan ? apiResponse.grafikBulanan.map(item => item.pengeluaran) : []
        };

        const expenseDistribution = {
            labels: apiResponse.grafikKategori ? apiResponse.grafikKategori.map(item => item.kategori) : [],
            data: apiResponse.grafikKategori ? apiResponse.grafikKategori.map(item => item.jumlah) : [],
            colors: ['#b7e7f7', '#d7defa', '#b5ead7', '#ffdad6', '#e3e2e1'] 
        };

        renderYearlyBarChart(yearlyTrend);
        renderExpensePieChart(expenseDistribution);
        updateSummaryText(apiResponse);

    } catch (error) {
        console.error("Gagal mengambil data laporan:", error);
        alert("Gagal memuat data laporan dari server. Pastikan backend sudah berjalan.");
    }
}

function updateSummaryText(data) {
    const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
    
    // Update Kotak Ringkasan Atas
    if(document.getElementById('totalPemasukanTahunan')) document.getElementById('totalPemasukanTahunan').innerText = formatRp(data.totalPemasukan || 0);
    if(document.getElementById('totalPengeluaranTahunan')) document.getElementById('totalPengeluaranTahunan').innerText = formatRp(data.totalPengeluaran || 0);
    if(document.getElementById('tabunganBersih')) document.getElementById('tabunganBersih').innerText = formatRp((data.totalPemasukan || 0) - (data.totalPengeluaran || 0));

    // Update Ringkasan Statistik (Opsional, tergantung ketersediaan di API Backend)
    // Jika backend mengirimkan data statistik ekstra, kita tangkap di sini:
    if(document.getElementById('statBulanTertinggi') && data.bulanPengeluaranTertinggi) {
        document.getElementById('statBulanTertinggi').innerText = data.bulanPengeluaranTertinggi;
    }
    if(document.getElementById('statKategoriTerbesar') && data.kategoriTerbesar) {
        document.getElementById('statKategoriTerbesar').innerText = data.kategoriTerbesar;
    }
    if(document.getElementById('statRerataPemasukan') && data.totalPemasukan) {
        // Hitung rerata secara manual jika backend tidak mengirimkannya
        const rerata = (data.totalPemasukan || 0) / 12;
        document.getElementById('statRerataPemasukan').innerText = formatRp(rerata);
    }
}

function renderYearlyBarChart(data) {
    const ctxBar = document.getElementById('yearlyBarChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: data.pemasukan,
                    backgroundColor: '#b5ead7', 
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Pengeluaran',
                    data: data.pengeluaran,
                    backgroundColor: '#ffdad6', 
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12, weight: 500 } } },
                tooltip: { backgroundColor: '#2f3130', padding: 12, cornerRadius: 8, displayColors: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f4f3f2', drawBorder: false }, ticks: { callback: function(value) { return 'Rp ' + (value / 1000000) + 'M'; } } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

function renderExpensePieChart(data) {
    const bgColors = ['#b7e7f7', '#d7defa', '#b5ead7', '#ffdad6', '#e3e2e1'];
    
    // 1. Render Pie Chart
    const ctxPie = document.getElementById('expensePieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2f3130', padding: 12, cornerRadius: 8,
                    callbacks: { label: function(context) { return ' ' + context.label + ': Rp ' + context.raw.toLocaleString('id-ID'); } }
                }
            }
        }
    });

    // 2. Generate Legend HTML Secara Dinamis (Menghitung Persentase)
    const legendContainer = document.getElementById('expenseLegend');
    if (legendContainer && data.labels.length > 0) {
        legendContainer.innerHTML = ''; // Kosongkan placeholder
        const total = data.data.reduce((a, b) => a + b, 0); 
        
        data.labels.forEach((label, index) => {
            const value = data.data[index];
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            const color = bgColors[index % bgColors.length];

            // Terapkan styling Tailwind yang sama persis seperti sebelumnya
            legendContainer.innerHTML += `
                <span class="inline-flex items-center gap-1 font-label-sm text-[12px] bg-surface-container-high/30 text-on-surface-variant px-3 py-1 rounded-full">
                    <span class="w-2 h-2 rounded-full" style="background-color: ${color};"></span> 
                    ${label} ${percentage}%
                </span>
            `;
        });
    }
}

function setupActionButtons() {
    const buttons = document.querySelectorAll('button');
    const downloadBtn = Array.from(buttons).find(btn => btn.innerText.includes('Download Laporan (PDF)'));
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            alert('Mempersiapkan PDF...');
            window.print();
        });
    }
}