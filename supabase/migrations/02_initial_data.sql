-- 插入初始游戏分类
INSERT INTO categories (name, slug) VALUES
('动作游戏', 'action'),
('冒险游戏', 'adventure'),
('角色扮演', 'rpg'),
('策略游戏', 'strategy'),
('模拟游戏', 'simulation'),
('休闲游戏', 'casual');

-- 插入初始管理员用户
-- 注意：在实际部署时，应该通过Supabase UI或API创建用户，这里仅作为示例
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@gameclub.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  'authenticated'
) ON CONFLICT DO NOTHING;

-- 为管理员创建profile
INSERT INTO profiles (id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@gameclub.com',
  '系统管理员',
  'admin'
) ON CONFLICT DO NOTHING;

-- 插入示例游戏数据
INSERT INTO games (title, description, game_url, cover_url, category_id, is_featured) VALUES
(
  '太空探险',
  '一款刺激的太空探险游戏，玩家需要驾驶飞船穿越危险的小行星带。',
  'https://example.com/games/space-adventure',
  'https://example.com/images/space-adventure.jpg',
  (SELECT id FROM categories WHERE slug = 'action'),
  TRUE
),
(
  '魔法王国',
  '探索充满魔法的奇幻世界，完成各种任务并升级你的角色。',
  'https://example.com/games/magic-kingdom',
  'https://example.com/images/magic-kingdom.jpg',
  (SELECT id FROM categories WHERE slug = 'rpg'),
  TRUE
),
(
  '城市建设者',
  '建造和管理你自己的城市，平衡资源和市民需求。',
  'https://example.com/games/city-builder',
  'https://example.com/images/city-builder.jpg',
  (SELECT id FROM categories WHERE slug = 'simulation'),
  FALSE
);