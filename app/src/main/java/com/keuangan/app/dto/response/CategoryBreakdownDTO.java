package com.keuangan.app.dto.response;

public class CategoryBreakdownDTO {
    private String kategori;
    private double jumlah;

    public CategoryBreakdownDTO() {
    }

    public CategoryBreakdownDTO(String kategori, double jumlah) {
        this.kategori = kategori;
        this.jumlah = jumlah;
    }

    public String getKategori() {
        return kategori;
    }

    public void setKategori(String kategori) {
        this.kategori = kategori;
    }

    public double getJumlah() {
        return jumlah;
    }

    public void setJumlah(double jumlah) {
        this.jumlah = jumlah;
    }
}