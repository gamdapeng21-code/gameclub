-- 游戏分类表
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 游戏主表
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  game_url TEXT NOT NULL, -- 游戏实际访问URL，用于iframe加载
  cover_url TEXT, -- 游戏封面图URL
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  views BIGINT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, -- 是否热门推荐
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员操作日志表
CREATE TABLE admin_operation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id), -- 关联Supabase Auth用户
  action VARCHAR(200) NOT NULL, -- 操作描述，如"新增游戏: {游戏标题}"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建profiles表，用于存储用户信息
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建RLS策略
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略
CREATE POLICY "允许公开读取分类" ON categories
  FOR SELECT USING (true);

CREATE POLICY "允许公开读取游戏" ON games
  FOR SELECT USING (true);

-- 创建管理员访问策略
CREATE POLICY "允许管理员管理分类" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "允许管理员管理游戏" ON games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "允许管理员查看操作日志" ON admin_operation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "允许管理员创建操作日志" ON admin_operation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 创建用户访问策略
CREATE POLICY "允许用户查看自己的资料" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "允许用户更新自己的资料" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user'); -- 防止用户自行升级为管理员

-- 创建管理员访问用户资料策略
CREATE POLICY "允许管理员管理用户资料" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 创建触发器函数，用于更新游戏浏览量
CREATE OR REPLACE FUNCTION increment_game_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games SET views = views + 1 WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器，当游戏被查看时增加浏览量
CREATE TRIGGER increment_views_trigger
AFTER SELECT ON games
FOR EACH ROW
EXECUTE FUNCTION increment_game_views();