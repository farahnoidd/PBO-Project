package com.keuangan.app.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 20)
    private String type; // "EXPENSE" atau "INCOME"

    @Column(nullable = false, length = 50)
    private String kategori;

    @Column(nullable = false)
    private BigDecimal nominal;

    private String keterangan;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime tanggal;

    @Column(nullable = false, length = 50)
    private String akun; // "Gopay", "Ovo", "BCA", dll.

    public Transaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    // Perubahan nama Getter & Setter ke Bahasa Indonesia
    public String getKategori() { return kategori; }
    public void setKategori(String kategori) { this.kategori = kategori; }
    
    public BigDecimal getNominal() { return nominal; }
    public void setNominal(BigDecimal nominal) { this.nominal = nominal; }
    
    public String getKeterangan() { return keterangan; }
    public void setKeterangan(String keterangan) { this.keterangan = keterangan; }
    
    public LocalDateTime getTanggal() { return tanggal; }
    public void setTanggal(LocalDateTime tanggal) { this.tanggal = tanggal; }
    
    public String getAkun() { return akun; }
    public void setAkun(String akun) { this.akun = akun; }
}