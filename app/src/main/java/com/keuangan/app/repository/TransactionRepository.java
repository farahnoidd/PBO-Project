package com.keuangan.app.repository;

import com.keuangan.app.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // 1. TAMBAHKAN METHOD INI (Ini kunci utama biar ExpenseService & IncomeService GAK MERAH lagi)
    List<Transaction> findByUserIdOrderByTanggalDescIdDesc(String userId);

    // 2. Query Realtime Balance (Disesuaikan memakai 'nominal' beralih dari 'amount')
    @Query("""
        SELECT COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.nominal ELSE -t.nominal END), 0)
        FROM Transaction t
        WHERE t.userId = :userId
    """)
    BigDecimal getRealtimeBalance(@Param("userId") String userId);

    // 3. Query Bulanan (Disesuaikan memakai 'tanggal' dan 'nominal')
    @Query("""
        SELECT MONTH(t.tanggal), t.type, SUM(t.nominal)
        FROM Transaction t
        WHERE t.userId = :userId AND YEAR(t.tanggal) = :year
        GROUP BY MONTH(t.tanggal), t.type
        ORDER BY MONTH(t.tanggal)
    """)
    List<Object[]> getMonthlySummary(@Param("userId") String userId, @Param("year") Integer year);

    // 4. Query Tahunan (Disesuaikan memakai 'tanggal' dan 'nominal')
    @Query("""
        SELECT YEAR(t.tanggal), t.type, SUM(t.nominal)
        FROM Transaction t
        WHERE t.userId = :userId
        GROUP BY YEAR(t.tanggal), t.type
        ORDER BY YEAR(t.tanggal)
    """)
    List<Object[]> getYearlySummary(@Param("userId") String userId);
}