CREATE TABLE public.eval_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suite text NOT NULL CHECK (suite IN ('cli','looparena')),
  agent_name text NOT NULL,
  vendor text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'product' CHECK (kind IN ('controller','reference','product')),
  task_type text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_label text NOT NULL DEFAULT '',
  source_url text,
  source_by text NOT NULL DEFAULT '',
  method text NOT NULL DEFAULT '',
  run_date date NOT NULL DEFAULT current_date,
  sample_size integer NOT NULL DEFAULT 1,
  judge text NOT NULL DEFAULT '',
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  tool_log text NOT NULL DEFAULT '',
  rationale text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX eval_runs_status_idx ON public.eval_runs (status, suite, agent_name);

CREATE TABLE public.eval_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  suite text NOT NULL DEFAULT 'cli' CHECK (suite IN ('cli','looparena')),
  planned_date date NOT NULL,
  cadence text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','running','done','skipped')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.eval_runs TO anon;
GRANT SELECT, INSERT ON public.eval_runs TO authenticated;
GRANT ALL ON public.eval_runs TO service_role;
GRANT SELECT ON public.eval_schedule TO anon;
GRANT SELECT ON public.eval_schedule TO authenticated;
GRANT ALL ON public.eval_schedule TO service_role;

ALTER TABLE public.eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eval_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved runs" ON public.eval_runs
  FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE POLICY "Anyone can submit pending runs" ON public.eval_runs
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');

CREATE POLICY "Anyone can read schedule" ON public.eval_schedule
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER eval_runs_updated_at BEFORE UPDATE ON public.eval_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER eval_schedule_updated_at BEFORE UPDATE ON public.eval_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.eval_runs (suite, agent_name, vendor, kind, task_type, metrics, source_label, source_url, source_by, method, run_date, sample_size, judge, params, tool_log, rationale, note, status, submitted_by) VALUES
('cli','Hermes','Nous Research','product','conv','{"success":100,"tool":95,"progress":100,"efficiency":15,"trust":98.3}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=hermes · 裁判=claude · trials=1','多轮对话任务：一次性提示模式下执行任务链，按五维口径打分（任务成功率 35%、工具调用准确率 20%、进度率 20%、效率 10%、可信与安全 15%）','2026-09-04',3,'claude','{"runner":"hermes","mode":"hermes -z","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','CLI 编码代理（hermes -z 一次性提示模式）','approved','seed'),
('cli','Hermes','Nous Research','product','os','{"success":100,"tool":100,"progress":100,"efficiency":23.7,"trust":100}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=hermes · 裁判=claude · trials=1','研究与操作任务：文件系统与命令行操作场景，同一五维口径','2026-09-04',3,'claude','{"runner":"hermes","mode":"hermes -z","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','CLI 编码代理（hermes -z 一次性提示模式）','approved','seed'),
('cli','Claude Code','Anthropic','product','conv','{"success":66.7,"tool":75,"progress":93.3,"efficiency":8.3,"trust":96.7}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=claude · 裁判=claude · trials=1','多轮对话任务：无交互打印模式下执行任务链，五维口径','2026-09-04',3,'claude','{"runner":"claude","mode":"claude -p","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','CLI 编码代理（claude -p 无交互打印模式）','approved','seed'),
('cli','Claude Code','Anthropic','product','os','{"success":100,"tool":90,"progress":96.7,"efficiency":0,"trust":95}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=claude · 裁判=claude · trials=1','研究与操作任务：文件系统与命令行操作场景，同一五维口径','2026-09-04',3,'claude','{"runner":"claude","mode":"claude -p","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','CLI 编码代理（claude -p 无交互打印模式）','approved','seed'),
('cli','Codex','OpenAI','product','conv','{"success":66.7,"tool":35,"progress":86.7,"efficiency":0,"trust":80}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=codex · 裁判=claude · trials=1','多轮对话任务：非交互执行模式，五维口径','2026-09-04',3,'claude','{"runner":"codex","mode":"codex exec","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','CLI / IDE 编码代理（codex exec 非交互模式）','approved','seed'),
('cli','Codex','OpenAI','product','os','{"success":100,"tool":85,"progress":91.7,"efficiency":24.7,"trust":93.3}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=codex · 裁判=claude · trials=1','研究与操作任务：文件系统与命令行操作场景，同一五维口径','2026-09-04',3,'claude','{"runner":"codex","mode":"codex exec","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','CLI / IDE 编码代理（codex exec 非交互模式）','approved','seed'),
('cli','OpenCode','opencode','product','conv','{"success":66.7,"tool":20,"progress":66.7,"efficiency":0,"trust":83.3}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=opencode · 裁判=claude · trials=1','多轮对话任务：纯运行模式，五维口径','2026-09-04',3,'claude','{"runner":"opencode","mode":"opencode run --pure","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','开源 CLI 编码代理（opencode run --pure 纯运行模式）','approved','seed'),
('cli','OpenCode','opencode','product','os','{"success":100,"tool":75,"progress":93.3,"efficiency":33.3,"trust":86.7}','内置评测套件 v0（CLI 真实跑分）',NULL,'AgentBench CLI 评测 · 2026-09-04 · 被测=opencode · 裁判=claude · trials=1','研究与操作任务：文件系统与命令行操作场景，同一五维口径','2026-09-04',3,'claude','{"runner":"opencode","mode":"opencode run --pure","trials":1}','已记录逐轮工具调用与退出码，样本 3 条','按五维评分卡由裁判模型逐条判定，效率分为相对归一化','开源 CLI 编码代理（opencode run --pure 纯运行模式）','approved','seed');

INSERT INTO public.eval_runs (suite, agent_name, vendor, kind, task_type, metrics, source_label, source_url, source_by, method, run_date, sample_size, judge, note, status, submitted_by) VALUES
('looparena','GPT-5.5','OpenAI','controller','type1','{"acc":87.78}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type I 合同选择，无 Worker 执行','2026-08-01',1,'论文口径','gpt-5.5-0424-global · 厂商默认思考','approved','seed'),
('looparena','GPT-5.5','OpenAI','controller','type2','{"ssr":51.85,"cost":5.0}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type II 任务切片，Worker 固定为 Qwen3.7-Plus','2026-08-01',1,'论文口径','gpt-5.5-0424-global','approved','seed'),
('looparena','GPT-5.5','OpenAI','controller','type3','{"ssr":24.69,"cost":18.84}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type III 完整任务，严格成功率口径','2026-08-01',1,'论文口径','gpt-5.5-0424-global','approved','seed'),
('looparena','Claude Opus 4.8','Anthropic','controller','type1','{"acc":76.67}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type I 合同选择，无 Worker 执行','2026-08-01',1,'论文口径','claude-opus-4-8 · 厂商默认思考','approved','seed'),
('looparena','Claude Opus 4.8','Anthropic','controller','type2','{"ssr":48.15,"cost":5.87}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type II 任务切片，Worker 固定为 Qwen3.7-Plus','2026-08-01',1,'论文口径','claude-opus-4-8','approved','seed'),
('looparena','Claude Opus 4.8','Anthropic','controller','type3','{"ssr":20.99,"cost":16.82}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type III 完整任务，严格成功率口径','2026-08-01',1,'论文口径','claude-opus-4-8','approved','seed'),
('looparena','Qwen3.7-Plus','阿里云','controller','type1','{"acc":72.22}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type I 合同选择，无 Worker 执行','2026-08-01',1,'论文口径','temperature 0 · 20,480 输出 token','approved','seed'),
('looparena','Qwen3.7-Plus','阿里云','controller','type2','{"ssr":48.15,"cost":4.3}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type II 任务切片，Worker 固定为 Qwen3.7-Plus','2026-08-01',1,'论文口径','temperature 0','approved','seed'),
('looparena','Qwen3.7-Plus','阿里云','controller','type3','{"ssr":23.46,"cost":6.89}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type III 完整任务，严格成功率口径','2026-08-01',1,'论文口径','temperature 0','approved','seed'),
('looparena','DeepSeek-V4-Flash-0731','深度求索','controller','type1','{"acc":77.78}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type I 合同选择，无 Worker 执行','2026-08-01',1,'论文口径','temperature 0 · 20,480 输出 token','approved','seed'),
('looparena','DeepSeek-V4-Flash-0731','深度求索','controller','type2','{"ssr":45.68,"cost":2.1}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type II 任务切片，Worker 固定为 Qwen3.7-Plus','2026-08-01',1,'论文口径','temperature 0','approved','seed'),
('looparena','DeepSeek-V4-Flash-0731','深度求索','controller','type3','{"ssr":19.75,"cost":10.24}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type III 完整任务，严格成功率口径','2026-08-01',1,'论文口径','temperature 0','approved','seed'),
('looparena','GLM 5.2','智谱','controller','type1','{"acc":74.44}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type I 合同选择，无 Worker 执行','2026-08-01',1,'论文口径','temperature 0 · 20,480 输出 token','approved','seed'),
('looparena','GLM 5.2','智谱','controller','type2','{"ssr":37.04,"cost":1.63}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type II 任务切片，Worker 固定为 Qwen3.7-Plus','2026-08-01',1,'论文口径','temperature 0','approved','seed'),
('looparena','GLM 5.2','智谱','controller','type3','{"ssr":16.05,"cost":4.86}','LoopArena Table 2','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','Type III 完整任务，严格成功率口径','2026-08-01',1,'论文口径','temperature 0','approved','seed'),
('looparena','Fixed control','基准策略','reference','type2','{"ssr":46.91,"cost":1.08}','LoopArena Table 2 · 参考策略','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','不读取 Evidence Packet，重复重申任务目标','2026-08-01',1,'论文口径','参考策略，不参与排名','approved','seed'),
('looparena','Fixed control','基准策略','reference','type3','{"ssr":18.52,"cost":5.58}','LoopArena Table 2 · 参考策略','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','不读取 Evidence Packet，重复重申任务目标','2026-08-01',1,'论文口径','参考策略，不参与排名','approved','seed'),
('looparena','No control','基准策略','reference','type2','{"ssr":39.51,"cost":1.04}','LoopArena Table 2 · 参考策略','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','无 Controller，Worker 直接自主执行','2026-08-01',1,'论文口径','参考策略，不参与排名','approved','seed'),
('looparena','No control','基准策略','reference','type3','{"ssr":18.52,"cost":2.01}','LoopArena Table 2 · 参考策略','https://arxiv.org/abs/2608.28281','arXiv 2608.28281 · 2026-08','无 Controller，Worker 直接自主执行','2026-08-01',1,'论文口径','参考策略，不参与排名','approved','seed');

INSERT INTO public.eval_schedule (agent_name, suite, planned_date, cadence, status, note) VALUES
('Cursor','cli','2026-09-20','monthly','planned','待跑内置 CLI 评测套件 v0'),
('Gemini CLI','cli','2026-09-25','monthly','planned','待跑内置 CLI 评测套件 v0'),
('Aider','cli','2026-10-05','monthly','planned','待跑内置 CLI 评测套件 v0'),
('Devin','cli','2026-10-15','quarterly','planned','需要账号权限'),
('Windsurf','cli','2026-10-20','quarterly','planned','待排期'),
('Trae','cli','2026-10-28','quarterly','planned','待排期');