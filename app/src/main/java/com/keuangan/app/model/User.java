package com.keuangan.app.model;

import com.keuangan.app.enums.UserRole;
import com.keuangan.app.enums.UserStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "nama_lengkap", nullable = false, length = 100)
    private String namaLengkap;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.BELUM_TERVALIDASI;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Lob
    @Column(name = "foto", columnDefinition = "LONGTEXT")
    private String foto;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Constructors ──────────────────────────────────────────────────────────

    public User() {}

    public User(String username, String email, String password, String namaLengkap) {
        this.username   = username;
        this.email      = email;
        this.password   = password;
        this.namaLengkap = namaLengkap;
        this.role       = UserRole.USER;
        this.status     = UserStatus.BELUM_TERVALIDASI;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId()                     { return id; }
    public void setId(Long id)              { this.id = id; }

    public String getUsername()             { return username; }
    public void setUsername(String u)       { this.username = u; }

    public String getEmail()                { return email; }
    public void setEmail(String e)          { this.email = e; }

    public String getPassword()             { return password; }
    public void setPassword(String p)       { this.password = p; }

    public String getNamaLengkap()          { return namaLengkap; }
    public void setNamaLengkap(String n)    { this.namaLengkap = n; }

    public UserRole getRole()               { return role; }
    public void setRole(UserRole r)         { this.role = r; }

    public UserStatus getStatus()           { return status; }
    public void setStatus(UserStatus s)     { this.status = s; }

    public LocalDateTime getCreatedAt()     { return createdAt; }
    public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }

    public LocalDateTime getValidatedAt()   { return validatedAt; }
    public void setValidatedAt(LocalDateTime d) { this.validatedAt = d; }

    public String getFoto()                 { return foto; }
    public void setFoto(String foto)        { this.foto = foto; }
}
