/**
 * File: laporan.js
 * Tim Frontend (Mahasiswa 10 & 12)
 * Fungsi: Mengelola UI Laporan Tahunan, merender Chart.js, dan fitur integrasi PDF.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup default styling untuk semua grafik
    setupChartDefaults();

    // 2. Ambil data laporan dan render grafik
    fetchLaporanData();

    // 3. Aktifkan tombol-tombol interaktif
    setupActionButtons();
});

/**
 * Mengatur font dan warna dasar Chart.js agar selaras dengan Tailwind
 */
function setupChartDefaults() {
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#707975'; // Warna outline variant
}

/**
 * Simulasi pengambilan data dari API Backend (Spring Boot)
 */
function fetchLaporanData() {
    /* * MOCK DATA JSON
     * Struktur ini mengantisipasi DTO buatan Mahasiswa 8 (YearlyChartDTO & CategoryBreakdownDTO)
     */
    const mockData = {
        yearlyTrend: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
            pemasukan: [5000000, 5200000, 5000000, 6000000, 5500000, 5000000, 5800000, 5000000, 6200000, 5000000, 5500000, 5800000],
            pengeluaran: [4000000, 3800000, 4200000, 3500000, 4000000, 3900000, 4100000, 3800000, 4500000, 5200000, 3800000, 3700000]
        },
        expenseDistribution: {
            labels: ['Makanan', 'Transport', 'Belajar', 'Hiburan', 'Lainnya'],
            data: [30, 20, 15, 25, 10],
            colors: ['#b7e7f7', '#d7defa', '#b5ead7', '#ffdad6', '#e3e2e1']
        }
    };

    // Panggil fungsi render grafik setelah data "diambil"
    renderYearlyBarChart(mockData.yearlyTrend);
    renderExpensePieChart(mockData.expenseDistribution);
}

/**
 * Merender grafik batang (Bar Chart) Pemasukan vs Pengeluaran
 */
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
                    backgroundColor: '#b5ead7', // primary-container
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Pengeluaran',
                    data: data.pengeluaran,
                    backgroundColor: '#ffdad6', // error-container
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
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { size: 12, weight: 500 }
                    }
                },
                tooltip: {
                    backgroundColor: '#2f3130',
                    titleFont: { size: 13, family: 'Inter, sans-serif' },
                    bodyFont: { size: 13, family: 'Inter, sans-serif' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f4f3f2', 
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000) + 'M';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
}

/**
 * Merender grafik donat (Doughnut Chart) Distribusi Pengeluaran
 */
function renderExpensePieChart(data) {
    const ctxPie = document.getElementById('expensePieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: data.colors,
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
                    backgroundColor: '#2f3130',
                    bodyFont: { size: 14, family: 'Inter, sans-serif' },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Mengatur event listener untuk tombol aksi di Laporan
 */
function setupActionButtons() {
    // Mencari tombol Download Laporan (PDF)
    const buttons = document.querySelectorAll('button');
    const downloadBtn = Array.from(buttons).find(btn => btn.innerText.includes('Download Laporan (PDF)'));
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            // Simulasi proses pembuatan PDF
            alert('Fitur ekspor PDF akan segera terhubung dengan Backend API!');
            
            // Opsional: Untuk sementara bisa memanggil dialog print bawaan browser
            window.print();
        });
    }
}