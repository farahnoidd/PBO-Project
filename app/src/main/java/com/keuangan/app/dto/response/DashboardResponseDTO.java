package com.keuangan.app.dto.response;

public class DashboardResponseDTO {
    private double totalPemasukan;
    private double totalPengeluaran;
    private double saldo;

    public DashboardResponseDTO() {
    }

    public DashboardResponseDTO(double totalPemasukan, double totalPengeluaran, double saldo) {
        this.totalPemasukan = totalPemasukan;
        this.totalPengeluaran = totalPengeluaran;
        this.saldo = saldo;
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

    public void setTotalExpense(double totalPengeluaran) { 
        this.totalPengeluaran = totalPengeluaran;
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
}