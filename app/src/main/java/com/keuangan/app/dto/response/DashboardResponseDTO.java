package com.keuangan.app.dto.response;

import java.util.List;

public class DashboardResponseDTO {
    private double totalPemasukan;
    private double totalPengeluaran;
    private double saldo;
    
    // 💡 FITUR BARU: Variabel penampung list grafik untuk frontend PWA
    private List<MonthlyChartDTO> grafikBulanan;
    private List<CategoryChartDTO> grafikKategori;

    public DashboardResponseDTO() {
    }

    // 💡 UPDATE CONSTRUCTOR: Masukkan data grafik ke dalam parameter constructor utama
    public DashboardResponseDTO(double totalPemasukan, double totalPengeluaran, double saldo, 
                                List<MonthlyChartDTO> grafikBulanan, List<CategoryChartDTO> grafikKategori) {
        this.totalPemasukan = totalPemasukan;
        this.totalPengeluaran = totalPengeluaran;
        this.saldo = saldo;
        this.grafikBulanan = grafikBulanan;
        this.grafikKategori = grafikKategori;
    }

    public double getTotalPemasukan() {
        return totalPemasukan;
    }

    public void setTotalPemasukan(double totalPemasukan) {
        this.totalPemasukan = totalPemasukan;
    }

    public double getTotalPengeluaran() {
        return totalPengeluaran;
    }

    public void setTotalPengeluaran(double totalPengeluaran) {
        this.totalPengeluaran = totalPengeluaran;
    }

    public double getSaldo() {
        return saldo;
    }

    public void setSaldo(double saldo) {
        this.saldo = saldo;
    }

    public List<MonthlyChartDTO> getGrafikBulanan() {
        return grafikBulanan;
    }

    public void setGrafikBulanan(List<MonthlyChartDTO> grafikBulanan) {
        this.grafikBulanan = grafikBulanan;
    }

    public List<CategoryChartDTO> getGrafikKategori() {
        return grafikKategori;
    }

    public void setGrafikKategori(List<CategoryChartDTO> grafikKategori) {
        this.grafikKategori = grafikKategori;
    }

    // 💡 INNER CLASS BARU: Untuk mapping Doughnut Chart (.kategori & .jumlah)
    public static class CategoryChartDTO {
        private String kategori;
        private double jumlah;

        public CategoryChartDTO(String kategori, double jumlah) {
            this.kategori = kategori;
            this.jumlah = jumlah;
        }

        public String getKategori() { return kategori; }
        public void setKategori(String kategori) { this.kategori = kategori; }
        public double getJumlah() { return jumlah; }
        public void setJumlah(double jumlah) { this.jumlah = jumlah; }
    }
}