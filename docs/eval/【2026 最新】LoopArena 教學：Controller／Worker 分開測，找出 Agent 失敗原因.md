---
title: "【2026 最新】LoopArena 教學：Controller／Worker 分開測，找出 Agent 失敗原因"
source: "https://www.alphalab.site/looparena-controller-worker-evaluation"
author:
  - "[[Terry Chen]]"
published: 2026-09-01
created: 2026-09-08
description: "LoopArena 教學帶你把 Controller 與 Worker 分開測：先跑零呼叫 Preflight 與 Type I 單題，再固定 Worker、只換 Controller，比對 Trace 和 evaluator receipt，找出失敗對控制決策是否敏感，避免把局部結果寫成模型總排名。"
tags:
  - "clippings"
---
AI Agent 跑壞了，先別急著換模型：失敗可能來自 Worker、Controller，或 runtime／evaluator。這篇 **LoopArena 教學** 先跑零呼叫 preflight 與單題 smoke test，再建立「固定 Worker、只換 Controller」的最小比較。

核心式子是： **可歸因比較＝固定 Worker／任務／環境／Harness，只換 Controller，再讀 Trace＋evaluator receipt。** 它回答系統是否對 Controller 敏感，不產生全球模型排名。

## LoopArena 教學先說結論：先排除安裝，再比較角色

1. **Preflight：** 零呼叫擋住可預檢的本機設定／資料錯誤。
2. **Type I：** 用凍結 Packet 驗 Contract 管線；沒有真實 Worker。
3. **Type II／III：** 固定 Worker、任務、工具、預算、runtime、evaluator，只換 Controller。
4. **Trace：** 先分有效 FAIL 與 infra error，再看 Worker 工作與 Controller 決策。

外部執行層先看 [**AI Agent Harness**](https://www.alphalab.site/ai-agent-harness) ；cases／grader／trial 基礎見 [**AI Evals**](https://www.alphalab.site/ai-evals) 。本文只做角色歸因。

## 先看懂四個責任邊界：誰決策、誰動手、誰判分

![LoopArena Controller、Reporter、Worker、pinned task runtime 與 terminal evaluator 的資料流](https://hacktechentertainment-iylwc.wpcomstaging.com/wp-content/uploads/2026/09/looparena-controller-worker-evaluation-01-looparena-role-boundaries.png)

Controller 不直接改程式；Worker 才能動手，terminal evaluator 在任務結束後判分。

[LoopArena protocol](https://github.com/AMAP-ML/LoopArena/blob/1ba8b0da9726e1b79ece21d8330c4051608544de/docs/protocol.md) 把長任務拆成清楚的資訊邊界：

- **Worker：** 唯一能改 workspace、跑 coding tools 的角色。
- **Reporter：** 唯讀整理 Worker 對話與 workspace 證據，不能改檔。
- **Controller：** 看報告、引用 turns 與剩餘預算，回 `advance` 、 `verify` 或 `stop` ；看不到私有 evaluator。
- **Runtime＋evaluator：** 固定起點、工具與驗收，最後產生 PASS／FAIL receipt。

把 Worker 想成廚師、Controller 想成領班；「Judge」只是比喻，正式元件是來源任務的 executable terminal evaluator，不是 LLM Judge。三者一起換就失去歸因；分層背景見 [**AI Agent 三層架構**](https://www.alphalab.site/ai-agent-harness-loop-graph-engineering) 。

## Step 1：固定版本，建立乾淨的 LoopArena 環境

截至 2026 年 9 月 1 日，官方 repo 要求 Python 3.10 以上。本文固定 commit `1ba8b0d` ； `v0.1.0` 是套件／結果版本，不是 Git tag。

```
git clone https://github.com/AMAP-ML/LoopArena.git
cd LoopArena
git checkout 1ba8b0da9726e1b79ece21d8330c4051608544de
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[gateway]'
```

端點需相容 OpenAI API；憑證預設讀 `OPENAI_API_KEY` ，端點可設 `OPENAI_BASE_URL` 。用 secret manager 注入，別把 key 寫進 repo。完整參數見 [固定版 README](https://github.com/AMAP-ML/LoopArena/tree/1ba8b0da9726e1b79ece21d8330c4051608544de) 。

## Step 2：先跑零模型呼叫 Preflight

下面檢查本機參數、dataset schema 與 key 環境變數是否非空； `--limit 1` 只選一題， `--preflight-only` 使模型呼叫數為 0。它不連遠端，不能證明 key、endpoint 或 model ID 可用。

```
looparena-type1-run \
  --data benchmarks/type1/questions.jsonl \
  --model YOUR_MODEL_ID \
  --preflight-only \
  --limit 1 \
  --concurrency 1
```

`ready: true` 只代表本機檢查通過。失敗時修 Python、資料路徑、schema 或 key 環境變數；別把 runner 錯誤算成模型 FAIL。

## Step 3：用 Type I 單題 Smoke Test 驗最小契約管線

Type I 有 90 份凍結 Evidence Packets；Controller 四選一，計 Contract Accuracy。單題做一次模型呼叫，寫出 JSONL 與 `.summary.json` ：

```
mkdir -p results
looparena-type1-run \
  --data benchmarks/type1/questions.jsonl \
  --model YOUR_MODEL_ID \
  --output results/type1-smoke.jsonl \
  --limit 1 \
  --concurrency 1
```

它只測固定證據下的契約內容，不測 Worker。每題候選 action 相同；v0.1.0 題庫是 `advance` 或 `verify` ，並排除無唯一勝者、重播不穩定的 handoff。因為沒有 Worker、Docker 或 terminal evaluator，單題正確率不能當 Agent 成功率。一般 benchmark 收據方法見 [**這篇教學**](https://www.alphalab.site/terminal-bench-science-tutorial) 。

公開 JSONL 含 `ideal` ，runner 只送 `input` 。未來正式評分仍要隔離 repo／題庫存取並揭露污染風險；本文單題只驗管線。

## Step 4：LoopArena 教學核心——固定 Worker，只換 Controller

[官方論文](https://arxiv.org/abs/2608.28281) 的 Type II 是 27 個濃縮任務，Type III 是對應的 27 個完整任務（11 SCBench＋16 BeyondSWE）。先裝 `python -m pip install -e '.[gateway,scbench]'` ；完整執行另需 Git、Docker、 `uv` 與 upstream assets。

`case203` 屬 SCBench，此準備步驟需 Python 3.12。依 [upstreams.toml](https://github.com/AMAP-ML/LoopArena/blob/1ba8b0da9726e1b79ece21d8330c4051608544de/benchmarks/upstreams.toml) 固定 runner／problems，再建 `linux/amd64` image。以下從 LoopArena 根目錄執行； `looparena-assets prepare` 只整理本機檔案，不會下載或建 image。

```
export LOOPARENA_UPSTREAMS="$PWD/.looparena-upstreams"
export LOOPARENA_ASSETS_ROOT="$PWD/.looparena-assets"
mkdir -p "$LOOPARENA_UPSTREAMS"

git clone https://github.com/SprocketLab/slop-code-bench.git \
  "$LOOPARENA_UPSTREAMS/slop-code-bench"
git -C "$LOOPARENA_UPSTREAMS/slop-code-bench" checkout \
  13de1a7a6b8b3dc5cc532a0c322a0997afa5bec7

git clone https://github.com/gabeorlanski/scb-problems.git \
  "$LOOPARENA_UPSTREAMS/scb-problems"
git -C "$LOOPARENA_UPSTREAMS/scb-problems" checkout \
  4d38d300059667d57e43c31969bc455f5c338b52
```

由 pinned runner 產生 Dockerfile，建成 `slop-code:python3.12` 。inspect 必須印出 `linux/amd64` ；Apple Silicon 會較慢。

```
cd "$LOOPARENA_UPSTREAMS/slop-code-bench"
uv sync --python 3.12
uv run --python 3.12 slop-code docker make-dockerfile base \
  configs/environments/docker-python3.12-uv.yaml \
  > /tmp/slop-code-python312.Dockerfile
docker buildx build --platform linux/amd64 --load \
  -t slop-code:python3.12 \
  -f /tmp/slop-code-python312.Dockerfile .
docker image inspect slop-code:python3.12 \
  --format '{{.Os}}/{{.Architecture}}'

cd -
looparena-assets prepare \
  --assets-root "$LOOPARENA_ASSETS_ROOT" \
  --only scbench \
  --scbench-runner "$LOOPARENA_UPSTREAMS/slop-code-bench" \
  --scbench-source "$LOOPARENA_UPSTREAMS/scb-problems"
```

完整 panel 還需 BeyondSWE bundle／image；單跑 `case203` 只準備 SCBench。

A、B 固定 case、Worker／provider、seed、起點、工具、預算、runtime、Reporter 與 evaluator；treatment 只有 Controller 及必要 endpoint／credential。後續 trajectory、Reporter output、Packet 本來就會分岔。先 preflight：

```
looparena-type3-run \
  --case-dir benchmarks/type3/cases/case203 \
  --assets-root "$LOOPARENA_ASSETS_ROOT" \
  --out-dir runs/case203-controller-a \
  --arm controlled \
  --seed 0 \
  --worker-model WORKER_MODEL_ID \
  --controller-model CONTROLLER_A \
  --preflight-only
```

它查 case、assets、Docker 並記錄 runtime／evaluator identity；不驗 model ID 或 credential。移除 `--preflight-only` 跑 A。同 gateway 的 B 只改 `--controller-model CONTROLLER_B` 與 `--out-dir runs/case203-controller-b` ；跨 provider 還要記錄並更換 `--controller-base-url` 、 `--controller-api-key-env` 或 `--controller-credential-profile-id` 。完整任務成本明顯，勿覆寫 A。

再加共同參照： `--arm no-control` 讓 Worker 不被週期打斷； `--arm controlled --controller-provider non-adaptive-fixed` 在交接重送同一目標、但不適應證據。兩者不進 Controller 模型排名。

## Step 5：Trace 不是看熱鬧，要按順序找失敗層

![LoopArena 從 Preflight、Type I 到 Type II 和 Type III 的升級與失敗判讀流程](https://hacktechentertainment-iylwc.wpcomstaging.com/wp-content/uploads/2026/09/looparena-controller-worker-evaluation-02-looparena-evaluation-ladder.png)

先擋住可預先檢出的本機設定與資產錯誤，再升級到能觀察 Worker 的長任務；每一層只回答它能回答的問題。

正式紀錄含 config、runtime、tokens、trajectory 與 receipt。「回放」是重讀同一 durable artifact，不是另有 replay CLI，也不是重跑後挑結果。依序問：

1. **Infra：** provider／runner／container／evaluator 壞掉就獨立標記；修復後以 `--resume-existing` 從 durable boundary 繼續，invalid attempt 不算敗場。
2. **Receipt：** evaluator 正常完成且判 FAIL，才是 policy 結果。
3. **Worker：** 查檔案、測試與工具回傳，別只信「完成了」；欄位解讀見 [**Agent Observability**](https://www.alphalab.site/agent-observability) 。
4. **Controller：** 按各自實際收到的 Packet 核對 `advance` ／ `verify` ／ `stop` 與引用證據，別假設分岔後 Packet 相同。
5. **重複性：** 單一 trace 只產生假說；固定 panel 與共同有效案例才支持穩定差異。

## 完整示例：同一 Worker，為何兩個 Controller 得到不同結果

以下是假想教學 trace，不是官方資料：任務要通過 12 tests，Worker 只跑 8 題；Reporter 回報「8／8 通過，4 題未跑」，預算仍足。

- **A：** 看到通過就 `stop` ；evaluator 完整跑 12 題，1 題 FAIL。
- **B：** 依「4 題未跑」回 `verify` ；Worker 修掉 edge case，12 題 PASS。
- **fixed-control：** 只重送原目標，不針對缺少測試的證據調整。

固定條件下，這只支持「此案例對驗證決策敏感」；Reporter 仍是 shared bottleneck，也不能外推 B 全面較強。下一步是預先固定的多 case panel。

## 該記哪些指標？成功率優先，成本要用同一口徑

- **Strict Success Rate：** evaluator PASS、Worker 未超 turn budget，且 `protocol_valid` 、 `submit_protocol_satisfied` 皆成立；infra-invalid attempt 先修復。
- **決策：** 三種 action 的時點與循環數，只解釋路徑。
- **Tokens／成本：** Worker、Reporter、Controller 分開，使用同一 provider 與價格日期。
- **時間／工具：** 分辨延遲來自模型、工具、container 或 evaluator。
- **失敗型態：** 有效 FAIL、預算、人工診斷與 infra 分開。

「過早停止／無效驗證」是人工 Trace 標籤，不是官方 status；統計以 protocol 欄位與 receipt 為準。

版本、endpoint、快取、價格日或平行度不同不可混算；官方結果也只代表 v0.1.0。若要固定模型、改 Harness，見 [**MCP vs CLI A/B Test**](https://www.alphalab.site/mcp-vs-cli-token-ab-test) 。

## 何時才值得從 Type I 升到 Type II／III？

- **Type I：** 驗安裝、schema、credential env 與 Contract 格式。
- **Type II：** 看真實 Worker／Controller 互動，以濃縮 slice 控成本。
- **Type III：** 前兩層通過，且問題需要完整任務或官方 checkpoint sequence。

預先寫停止規則：preflight 不過不呼叫、smoke 格式錯不開 panel、artifact 不全不統計。若結果指向 Harness，再讀 [**AutoSaddler**](https://www.alphalab.site/autosaddler-harness-optimization) ；別邊測邊改。

## 四個最容易把局部結果寫歪的陷阱

1. **把 Type I 當 Agent：** 它只測 contract selection。
2. **A、B 同時換 Worker：** 兩個角色都換便失去單變因歸因。
3. **共同失敗就怪 Harness：** 也可能是 Worker、task、Reporter、evaluator 或 infra。
4. **混合 FAIL／infra 或用單題排行：** 先修 invalid attempt；排序需固定 panel、重複規則與 protocol。

## LoopArena 教學常見問題 FAQ

### LoopArena 是模型 benchmark，還是 Harness benchmark？

**評測模型擔任 runtime Controller。** Worker 與系統條件被固定，結果屬於指定 protocol，不是脫離 Harness 的純模型能力。

### Type I smoke test 可以比較 Agent 成功率嗎？

**不可以。** 它只有凍結 Packet 與四選一 Contract Accuracy，沒有 Worker、Docker 或 evaluator。

### Preflight 會花模型 API 費用嗎？

**不會呼叫模型。** 它驗本機參數／資料／資產，不驗遠端 key、endpoint 或 model ID，也不能排除後續故障。

### Worker 固定後，差異就一定是 Controller 造成嗎？

**只能說結果對 Controller 條件敏感。** Reporter、provider 與隨機性仍影響單次 trace；需固定 panel 強化歸因。

### no-control 等於沒有 Harness 嗎？

**不是。** 它仍用同一任務與 Worker runtime，只移除 Reporter、Controller、packet compilation 與週期 handoff。

### fixed-control 和模型 Controller 差在哪？

**fixed-control 不適應證據。** 它重送同一目標；模型 Controller 會依 Packet 推進、驗證或停止。

### 可以直接用官方公開結果選最強模型嗎？

**不能外推成全球排名。** 公開結果只對應該版 task、Worker、Reporter、budget、provider 與 evaluator。

### Trace 顯示 Controller 過早 stop，下一步怎麼辦？

**先把它當假說，再跨 case 驗證。** 修 prompt 後要當新 treatment，在相同 Worker、任務集與停止規則下重比。

## 新手今天只要帶走這 7 件事

1. 端到端 FAIL ≠ 模型 FAIL。
2. Type I 選契約，不跑 Worker。
3. `--preflight-only` 先擋可預檢錯誤。
4. 只換 Controller，其餘條件固定。
5. no-control／fixed-control 是參照。
6. 先讀 receipt，再讀 Trace。
7. 單題產生假說，panel 才談穩定差異。

## 接著閱讀

第 1 / 2 頁

- [![Claude Code、Pi、DeepSeek Harness 換家時，以 Handoff Receipt 轉移任務狀態的 Agent Harness Swap Test](https://www.alphalab.site/_next/image?url=https%3A%2F%2Fhacktechentertainment-iylwc.wpcomstaging.com%2Fwp-content%2Fuploads%2F2026%2F09%2Fagent-harness-swap-test-featured.png%3Fv%3D1788854516&w=3840&q=75)](https://www.alphalab.site/agent-harness-swap-test)
	[文章](https://www.alphalab.site/agent-harness-swap-test)
	### 【2026 最新】Agent Harness 換家不失憶：Claude Code、Pi、DeepSeek Harness Swap Test
	延伸觀點
	任務做到一半如何跨 Claude Code、Pi、DeepSeek Harness 接手？用七層 Receipt、三組對照與權限／回滾閘門，建立可驗證的 Swap Test。
	閱讀文章
	[View original](https://www.alphalab.site/agent-harness-swap-test)
- [![context-mode 98% 是否成立的 Claude Code 六任務 A/B 評測教學首圖](https://www.alphalab.site/_next/image?url=https%3A%2F%2Fhacktechentertainment-iylwc.wpcomstaging.com%2Fwp-content%2Fuploads%2F2026%2F09%2Fcontext-mode-claude-code-ab-evaluation-featured.png%3Fv%3D1788853443&w=3840&q=75)](https://www.alphalab.site/context-mode-claude-code-ab-evaluation)
	[文章](https://www.alphalab.site/context-mode-claude-code-ab-evaluation)
	### 【2026 最新】context-mode 真的省 98%？Claude Code 六任務 A/B 評測教學（安裝＋安全＋回滾）
	延伸觀點
	context-mode 的 98% 省在哪？用 Claude Code 六任務 paired A/B，從版本鎖定、成功率、Token 與延遲，到假祕密、故障與完整回滾，一次建立可重現的採用判斷。
	閱讀文章
	[View original](https://www.alphalab.site/context-mode-claude-code-ab-evaluation)
- [![Edit Fidelity AI 教學首圖，以一行正確修補與多行無關變更對照 Claude Code、Codex 的 patch 範圍閘門](https://www.alphalab.site/_next/image?url=https%3A%2F%2Fhacktechentertainment-iylwc.wpcomstaging.com%2Fwp-content%2Fuploads%2F2026%2F09%2Fedit-fidelity-coding-agent-over-editing-featured.png%3Fv%3D1788852336&w=3840&q=75)](https://www.alphalab.site/edit-fidelity-coding-agent-over-editing)
	[文章](https://www.alphalab.site/edit-fidelity-coding-agent-over-editing)
	### 【2026 最新】Edit Fidelity 是什麼？10 個一行 Bug 測 Claude Code／Codex 有沒有改太多
	延伸觀點
	用 10 個已知一行修補的 Bug，建立 Claude Code／Codex 的變更範圍評測；從 gold patch、excess edit distance 到 CI receipt，一次守住功能、scope 與 locality。
	閱讀文章
	[View original](https://www.alphalab.site/edit-fidelity-coding-agent-over-editing)
- [![MiniCPM5-2B Tool Calling 教學首圖](https://www.alphalab.site/_next/image?url=https%3A%2F%2Fhacktechentertainment-iylwc.wpcomstaging.com%2Fwp-content%2Fuploads%2F2026%2F09%2Fminicpm5-2b-local-agent-tool-calling-eval-featured.png%3Fv%3D1788852177&w=3840&q=75)](https://www.alphalab.site/minicpm5-2b-local-agent-tool-calling-eval)
	[文章](https://www.alphalab.site/minicpm5-2b-local-agent-tool-calling-eval)
	### 【2026 最新】MiniCPM5-2B 本機 Agent 教學：GGUF、MLX、SGLang 的 12 題 Tool Calling 驗收
	延伸觀點
	MiniCPM5-2B 適合本機 Agent 嗎？用固定 revision、12 題繁中 Tool Calling、GGUF／MLX／SGLang 三條路徑，驗收格式、多步恢復、長 context 與 fallback。
	閱讀文章
	[View original](https://www.alphalab.site/minicpm5-2b-local-agent-tool-calling-eval)
- [![Ollama 遷移教學：同一份 GGUF 在 Ollama、llama.cpp 與 LM Studio 做受控 A/B Test](https://www.alphalab.site/_next/image?url=https%3A%2F%2Fhacktechentertainment-iylwc.wpcomstaging.com%2Fwp-content%2Fuploads%2F2026%2F09%2Follama-migration-ab-test-featured.png%3Fv%3D1788851715&w=3840&q=75)](https://www.alphalab.site/ollama-migration-ab-test)
	[文章](https://www.alphalab.site/ollama-migration-ab-test)
	### 【2026 最新】Ollama 遷移教學：同一 GGUF 換到 llama.cpp／LM Studio 做 A/B Test
	延伸觀點
	保留同一份 GGUF，讓 Ollama、llama.cpp 與 LM Studio 跑相同 API、Tool Calling 與效能測例，用五關 scorecard 和 rollback receipt 決定該保留、並存或替換。
	閱讀文章
	[View original](https://www.alphalab.site/ollama-migration-ab-test)
- [![Compile by Training 教學首圖，ProgramAsWeights PAW 符號與本機神經函式主題](https://www.alphalab.site/_next/image?url=https%3A%2F%2Fhacktechentertainment-iylwc.wpcomstaging.com%2Fwp-content%2Fuploads%2F2026%2F09%2Fcompile-by-training-featured.png%3Fv%3D1788766223&w=3840&q=75)](https://www.alphalab.site/compile-by-training)
	[文章](https://www.alphalab.site/compile-by-training)
	### 【2026 最新】Compile by Training 是什麼？把自然語言規格編譯成本機神經函式
	延伸觀點
	從自然語言規格、Teacher 合成與 LoRA 訓練，到四組 holdout、OOD、spec drift、損益平衡與隱私邊界，一篇學會如何評估、版本化並安全整合 Compile by Training 神經函式。
	閱讀文章
	[View original](https://www.alphalab.site/compile-by-training)

ALPHALAB 社群

## 有問題？來 Telegram 聊

和 Terry、編輯、其他網友一起討論這篇文章。提問、分享觀點，回覆更即時。

[加入 Telegram 討論](https://t.me/alphalab_live)

## 📩 訂閱 AlphaLab 電子報

每週最多三封：一封 Weekly 週報與最多兩封關鍵 Alpha Signal。

我們不會 spam，隨時可退訂。