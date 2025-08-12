-- AssetWise 数据库性能监控函数
-- 版本: 1.0.0

-- =============================================
-- 1. 获取表统计信息
-- =============================================

CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT,
    seq_scan BIGINT,
    seq_tup_read BIGINT,
    idx_scan BIGINT,
    idx_tup_fetch BIGINT,
    n_tup_ins BIGINT,
    n_tup_upd BIGINT,
    n_tup_del BIGINT,
    last_vacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        n_tup_ins + n_tup_upd - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size,
        pst.seq_scan,
        pst.seq_tup_read,
        pst.idx_scan,
        pst.idx_tup_fetch,
        pst.n_tup_ins,
        pst.n_tup_upd,
        pst.n_tup_del,
        pst.last_vacuum,
        pst.last_analyze
    FROM pg_stat_user_tables pst
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;

-- =============================================
-- 2. 获取索引使用情况
-- =============================================

CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    usage_ratio NUMERIC,
    is_unique BOOLEAN,
    definition TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexrelname as index_name,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexrelname)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CASE 
            WHEN idx_scan + idx_tup_read > 0 
            THEN ROUND(idx_tup_fetch::NUMERIC / (idx_scan + idx_tup_read), 4)
            ELSE 0 
        END as usage_ratio,
        indisunique as is_unique,
        pg_get_indexdef(indexrelid) as definition
    FROM pg_stat_user_indexes psi
    JOIN pg_index pi ON psi.indexrelid = pi.indexrelid
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
END;
$$;

-- =============================================
-- 3. 获取查询性能统计
-- =============================================

CREATE OR REPLACE FUNCTION get_query_performance()
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time NUMERIC,
    mean_time NUMERIC,
    min_time NUMERIC,
    max_time NUMERIC,
    stddev_time NUMERIC,
    rows BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查pg_stat_statements扩展是否可用
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements extension is not available';
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        pss.query,
        pss.calls,
        pss.total_exec_time as total_time,
        pss.mean_exec_time as mean_time,
        pss.min_exec_time as min_time,
        pss.max_exec_time as max_time,
        pss.stddev_exec_time as stddev_time,
        pss.rows
    FROM pg_stat_statements pss
    WHERE pss.calls > 10  -- 只显示执行次数超过10次的查询
    ORDER BY pss.mean_exec_time DESC
    LIMIT 50;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error accessing pg_stat_statements: %', SQLERRM;
        RETURN;
END;
$$;

-- =============================================
-- 4. 获取连接统计信息
-- =============================================

CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_conn INTEGER;
    active_conn INTEGER;
    idle_conn INTEGER;
    max_conn INTEGER;
BEGIN
    -- 获取当前连接数
    SELECT COUNT(*) INTO total_conn FROM pg_stat_activity;
    
    -- 获取活跃连接数
    SELECT COUNT(*) INTO active_conn 
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- 获取空闲连接数
    SELECT COUNT(*) INTO idle_conn 
    FROM pg_stat_activity 
    WHERE state = 'idle';
    
    -- 获取最大连接数
    SELECT setting::INTEGER INTO max_conn 
    FROM pg_settings 
    WHERE name = 'max_connections';
    
    result := json_build_object(
        'total_connections', total_conn,
        'active_connections', active_conn,
        'idle_connections', idle_conn,
        'max_connections', max_conn,
        'connection_utilization', ROUND((total_conn::NUMERIC / max_conn) * 100, 2)
    );
    
    RETURN result;
END;
$$;

-- =============================================
-- 5. 获取缓存命中率
-- =============================================

CREATE OR REPLACE FUNCTION get_cache_hit_ratio()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hit_ratio NUMERIC;
BEGIN
    SELECT 
        ROUND(
            (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read) + 1))::NUMERIC, 
            4
        ) INTO hit_ratio
    FROM pg_statio_user_tables;
    
    RETURN COALESCE(hit_ratio, 0);
END;
$$;

-- =============================================
-- 6. 获取慢查询日志
-- =============================================

CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
    query TEXT,
    duration NUMERIC,
    timestamp TIMESTAMPTZ,
    user_name TEXT,
    database_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查pg_stat_statements扩展是否可用
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements extension is not available';
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        pss.query,
        pss.max_exec_time as duration,
        NOW() as timestamp,  -- pg_stat_statements不存储时间戳，使用当前时间
        'unknown'::TEXT as user_name,  -- pg_stat_statements不存储用户信息
        current_database()::TEXT as database_name
    FROM pg_stat_statements pss
    WHERE pss.max_exec_time > 1000  -- 超过1秒的查询
    ORDER BY pss.max_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error accessing slow queries: %', SQLERRM;
        RETURN;
END;
$$;

-- =============================================
-- 7. 执行SQL语句（用于优化操作）
-- =============================================

CREATE OR REPLACE FUNCTION execute_sql(sql_statement TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 安全检查：只允许特定的优化操作
    IF sql_statement ~* '^(VACUUM|ANALYZE|REINDEX|CREATE INDEX|DROP INDEX)' THEN
        EXECUTE sql_statement;
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Unauthorized SQL operation: %', sql_statement;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- =============================================
-- 8. 获取数据库大小信息
-- =============================================

CREATE OR REPLACE FUNCTION get_database_size_info()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    db_size BIGINT;
    table_sizes JSON;
BEGIN
    -- 获取数据库总大小
    SELECT pg_database_size(current_database()) INTO db_size;
    
    -- 获取各表大小
    SELECT json_agg(
        json_build_object(
            'table_name', schemaname || '.' || tablename,
            'size_bytes', pg_total_relation_size(schemaname||'.'||tablename),
            'size_pretty', pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
        )
    ) INTO table_sizes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    
    result := json_build_object(
        'database_size_bytes', db_size,
        'database_size_pretty', pg_size_pretty(db_size),
        'table_sizes', table_sizes
    );
    
    RETURN result;
END;
$$;

-- =============================================
-- 9. 获取锁信息
-- =============================================

CREATE OR REPLACE FUNCTION get_lock_info()
RETURNS TABLE (
    blocked_pid INTEGER,
    blocked_user TEXT,
    blocked_query TEXT,
    blocking_pid INTEGER,
    blocking_user TEXT,
    blocking_query TEXT,
    lock_type TEXT,
    lock_mode TEXT,
    lock_duration INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        blocked.pid as blocked_pid,
        blocked.usename as blocked_user,
        blocked.query as blocked_query,
        blocking.pid as blocking_pid,
        blocking.usename as blocking_user,
        blocking.query as blocking_query,
        locks.locktype as lock_type,
        locks.mode as lock_mode,
        NOW() - blocked.query_start as lock_duration
    FROM pg_locks locks
    JOIN pg_stat_activity blocked ON locks.pid = blocked.pid
    JOIN pg_locks blocking_locks ON (
        locks.locktype = blocking_locks.locktype
        AND locks.database IS NOT DISTINCT FROM blocking_locks.database
        AND locks.relation IS NOT DISTINCT FROM blocking_locks.relation
        AND locks.page IS NOT DISTINCT FROM blocking_locks.page
        AND locks.tuple IS NOT DISTINCT FROM blocking_locks.tuple
        AND locks.virtualxid IS NOT DISTINCT FROM blocking_locks.virtualxid
        AND locks.transactionid IS NOT DISTINCT FROM blocking_locks.transactionid
        AND locks.classid IS NOT DISTINCT FROM blocking_locks.classid
        AND locks.objid IS NOT DISTINCT FROM blocking_locks.objid
        AND locks.objsubid IS NOT DISTINCT FROM blocking_locks.objsubid
        AND locks.pid != blocking_locks.pid
    )
    JOIN pg_stat_activity blocking ON blocking_locks.pid = blocking.pid
    WHERE NOT locks.granted
    ORDER BY blocked.query_start;
END;
$$;

-- =============================================
-- 10. 获取活跃会话信息
-- =============================================

CREATE OR REPLACE FUNCTION get_active_sessions()
RETURNS TABLE (
    pid INTEGER,
    user_name TEXT,
    database_name TEXT,
    client_addr INET,
    state TEXT,
    query_start TIMESTAMPTZ,
    state_change TIMESTAMPTZ,
    query TEXT,
    wait_event_type TEXT,
    wait_event TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psa.pid,
        psa.usename as user_name,
        psa.datname as database_name,
        psa.client_addr,
        psa.state,
        psa.query_start,
        psa.state_change,
        psa.query,
        psa.wait_event_type,
        psa.wait_event
    FROM pg_stat_activity psa
    WHERE psa.state != 'idle'
      AND psa.pid != pg_backend_pid()  -- 排除当前会话
    ORDER BY psa.query_start DESC;
END;
$$;

-- =============================================
-- 11. 获取复制状态信息
-- =============================================

CREATE OR REPLACE FUNCTION get_replication_status()
RETURNS TABLE (
    application_name TEXT,
    client_addr INET,
    state TEXT,
    sent_lsn PG_LSN,
    write_lsn PG_LSN,
    flush_lsn PG_LSN,
    replay_lsn PG_LSN,
    write_lag INTERVAL,
    flush_lag INTERVAL,
    replay_lag INTERVAL,
    sync_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psr.application_name,
        psr.client_addr,
        psr.state,
        psr.sent_lsn,
        psr.write_lsn,
        psr.flush_lsn,
        psr.replay_lsn,
        psr.write_lag,
        psr.flush_lag,
        psr.replay_lag,
        psr.sync_state
    FROM pg_stat_replication psr
    ORDER BY psr.application_name;
EXCEPTION
    WHEN OTHERS THEN
        -- 如果不是主服务器或没有复制，返回空结果
        RETURN;
END;
$$;

-- =============================================
-- 12. 获取WAL统计信息
-- =============================================

CREATE OR REPLACE FUNCTION get_wal_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    wal_size BIGINT;
    wal_files INTEGER;
BEGIN
    -- 获取WAL目录大小（需要超级用户权限，这里返回估算值）
    SELECT 
        json_build_object(
            'wal_records', wal_records,
            'wal_fpi', wal_fpi,
            'wal_bytes', wal_bytes,
            'wal_buffers_full', wal_buffers_full,
            'wal_write', wal_write,
            'wal_sync', wal_sync,
            'wal_write_time', wal_write_time,
            'wal_sync_time', wal_sync_time,
            'stats_reset', stats_reset
        ) INTO result
    FROM pg_stat_wal;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- 如果pg_stat_wal不可用，返回空对象
        RETURN '{}'::JSON;
END;
$$;

-- =============================================
-- 13. 创建性能监控视图
-- =============================================

-- 创建表性能概览视图
CREATE OR REPLACE VIEW v_table_performance AS
SELECT 
    schemaname || '.' || tablename as table_name,
    n_tup_ins + n_tup_upd - n_tup_del as estimated_rows,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE 
        WHEN seq_scan + idx_scan > 0 
        THEN ROUND((idx_scan::NUMERIC / (seq_scan + idx_scan)) * 100, 2)
        ELSE 0 
    END as index_usage_ratio,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_tup_hot_upd as hot_updates,
    CASE 
        WHEN n_tup_upd > 0 
        THEN ROUND((n_tup_hot_upd::NUMERIC / n_tup_upd) * 100, 2)
        ELSE 0 
    END as hot_update_ratio,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
ORDER BY seq_scan + idx_scan DESC;

-- 创建索引性能概览视图
CREATE OR REPLACE VIEW v_index_performance AS
SELECT 
    schemaname || '.' || tablename as table_name,
    indexrelname as index_name,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_tup_read > 0 
        THEN ROUND((idx_tup_fetch::NUMERIC / idx_tup_read) * 100, 2)
        ELSE 0 
    END as selectivity_ratio,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    indisunique as is_unique,
    indisprimary as is_primary
FROM pg_stat_user_indexes psi
JOIN pg_index pi ON psi.indexrelid = pi.indexrelid
ORDER BY idx_scan DESC;

-- =============================================
-- 14. 权限设置
-- =============================================

-- 为authenticated用户授予执行权限
GRANT EXECUTE ON FUNCTION get_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_hit_ratio() TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries() TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_size_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_lock_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_replication_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_wal_stats() TO authenticated;

-- 为authenticated用户授予视图查询权限
GRANT SELECT ON v_table_performance TO authenticated;
GRANT SELECT ON v_index_performance TO authenticated;

-- 完成函数创建
SELECT 'Performance monitoring functions created successfully' as status;
