-- 创建操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type VARCHAR(50) NOT NULL, -- 操作类型：create, update, delete等
  target_table VARCHAR(50) NOT NULL, -- 操作的表名
  target_id UUID, -- 操作的记录ID
  details JSONB, -- 操作详情，包含修改前后的数据
  ip_address VARCHAR(50), -- 操作者IP地址
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS operation_logs_user_id_idx ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS operation_logs_operation_type_idx ON operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS operation_logs_target_table_idx ON operation_logs(target_table);
CREATE INDEX IF NOT EXISTS operation_logs_created_at_idx ON operation_logs(created_at);

-- 创建记录操作日志的函数
CREATE OR REPLACE FUNCTION log_operation(
  p_user_id UUID,
  p_operation_type VARCHAR,
  p_target_table VARCHAR,
  p_target_id UUID,
  p_details JSONB,
  p_ip_address VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO operation_logs (
    user_id, operation_type, target_table, target_id, details, ip_address
  ) VALUES (
    p_user_id, p_operation_type, p_target_table, p_target_id, p_details, p_ip_address
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;