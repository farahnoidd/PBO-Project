package com.keuangan.app.dto.response;

import java.util.List;

public class YearlyChartDTO {
    private double totalPemasukan;
    private double totalPengeluaran;
    private String bulanPengeluaranTertinggi;
    private String kategoriTerbesar;
    private List<MonthlyChartDTO> grafikBulanan;
    private List<CategoryBreakdownDTO> grafikKategori;

    public YearlyChartDTO() {
    }

    public YearlyChartDTO(double totalPemasukan, double totalPengeluaran, String bulanPengeluaranTertinggi, String kategoriTerbesar, List<MonthlyChartDTO> grafikBulanan, List<CategoryBreakdownDTO> grafikKategori) {
        this.totalPemasukan = totalPemasukan;
        this.totalPengeluaran = totalPengeluaran;
        this.bulanPengeluaranTertinggi = bulanPengeluaranTertinggi;
        this.kategoriTerbesar = kategoriTerbesar;
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

    public String getBulanPengeluaranTertinggi() {
        return bulanPengeluaranTertinggi;
    }

    public void setBulanPengeluaranTertinggi(String bulanPengeluaranTertinggi) {
        this.bulanPengeluaranTertinggi = bulanPengeluaranTertinggi;
    }

    public String getKategoriTerbesar() {
        return kategoriTerbesar;
    }

    public void setKategoriTerbesar(String kategoriTerbesar) {
        this.kategoriTerbesar = kategoriTerbesar;
    }

    public List<MonthlyChartDTO> getGrafikBulanan() {
        return grafikBulanan;
    }

    public void setGrafikBulanan(List<MonthlyChartDTO> grafikBulanan) {
        this.grafikBulanan = grafikBulanan;
    }

    public List<CategoryBreakdownDTO> getGrafikKategori() {
        return grafikKategori;
    }

    public void setGrafikKategori(List<CategoryBreakdownDTO> grafikKategori) {
        this.grafikKategori = grafikKategori;
    }
}