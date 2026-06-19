package com.keuangan.app.dto.response;

public class MonthlyChartDTO {
    private String bulan;
    private double pemasukan;
    private double pengeluaran;

    public MonthlyChartDTO() {
    }

    public MonthlyChartDTO(String bulan, double pemasukan, double pengeluaran) {
        this.bulan = bulan;
        this.pemasukan = pemasukan;
        this.pengeluaran = pengeluaran;
    }

    public String getBulan() {
        return bulan;
    }

    public void setBulan(String bulan) {
        this.bulan = bulan;
    }

    public double getPemasukan() {
        return pemasukan;
    }

    public void setPemasukan(double pemasukan) {
        this.pemasukan = pemasukan;
    }

    public double getPengeluaran() {
        return pengeluaran;
    }

    public void setPengeluaran(double pengeluaran) {
        this.pengeluaran = pengeluaran;
    }
}