# -*- coding: utf-8 -*-
"""
minimal_draft_spike.py

Spike 驗證腳本（一次性、用完可丟）
=====================================
目的：驗證 pyJianYingDraft 能否在「Windows + 剪映國內版 10.9.0」
      產生一個「剪映可開啟、可人工修改」的最小草稿。

嚴格範圍：
  - 不接 AI、不接 Whisper、不建立正式 exporter。
  - 只做：一支影片 + 一段時間軸 + 存成剪映草稿。

執行方式（不要用 python 指令）：
  py -3.10 spike\\minimal_draft_spike.py --video "D:\\footage\\test.mp4"
或指定完整路徑：
  "C:\\Users\\<你>\\AppData\\Local\\Programs\\Python\\Python310\\python.exe" spike\\minimal_draft_spike.py --video "D:\\footage\\test.mp4"

前置：
  py -3.10 -m pip install pyJianYingDraft

重要提醒：
  1. 執行前請「關閉剪映」，執行後再開，草稿才會正確出現在草稿列表。
  2. --video 必須是該 Windows 機器上的「絕對路徑」，否則草稿內會變離線紅片段。
  3. 不同 pyJianYingDraft 版本 API 名稱可能不同；本檔已用防禦式寫法，
     若某一步報 AttributeError / TypeError，請看該步驟的中文註解對照調整。
"""

import argparse
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# 預設參數（可用命令列覆寫）
# ---------------------------------------------------------------------------
DEFAULT_DRAFT_FOLDER = r"D:\JianyingPro Drafts"   # 你的剪映 10.9.0 草稿根目錄
DEFAULT_DRAFT_NAME = "spike_test"                  # 產生的草稿名稱
DEFAULT_WIDTH = 1920
DEFAULT_HEIGHT = 1080
DEFAULT_CLIP_SECONDS = 5.0                         # 放上時間軸的片段長度（秒）


def log(msg: str) -> None:
    print(f"[spike] {msg}", flush=True)


def fail(msg: str) -> "NoReturn":  # type: ignore[valid-type]
    print(f"[spike][錯誤] {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="pyJianYingDraft × 剪映10.9.0 最小草稿 spike")
    p.add_argument("--video", required=True, help="測試影片的 Windows 絕對路徑")
    p.add_argument("--draft-folder", default=DEFAULT_DRAFT_FOLDER, help="剪映草稿根目錄")
    p.add_argument("--name", default=DEFAULT_DRAFT_NAME, help="草稿名稱")
    p.add_argument("--width", type=int, default=DEFAULT_WIDTH)
    p.add_argument("--height", type=int, default=DEFAULT_HEIGHT)
    p.add_argument("--seconds", type=float, default=DEFAULT_CLIP_SECONDS,
                   help="放上時間軸的片段長度（秒）")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    # --- 0. 前置檢查（先驗證，不假裝成功） -------------------------------
    log(f"Python: {sys.version.split()[0]}")

    video_path = Path(args.video)
    if not video_path.is_absolute():
        fail(f"--video 必須是絕對路徑，收到：{args.video}")
    if not video_path.exists():
        fail(f"找不到測試影片：{video_path}")

    draft_folder_path = Path(args.draft_folder)
    if not draft_folder_path.exists():
        fail(f"找不到草稿根目錄：{draft_folder_path}\n"
             f"請到剪映『全局設置→草稿位置』確認實際路徑後用 --draft-folder 指定。")

    # --- 1. 匯入 pyJianYingDraft ----------------------------------------
    try:
        import pyJianYingDraft as draft
        from pyJianYingDraft import trange
    except Exception as e:  # noqa: BLE001
        fail(f"無法匯入 pyJianYingDraft：{e}\n請先執行：py -3.10 -m pip install pyJianYingDraft")

    ver = getattr(draft, "__version__", None)
    if not ver:
        # 此套件未提供 __version__，改用套件中繼資料查詢
        try:
            from importlib.metadata import version, PackageNotFoundError
            try:
                ver = version("pyJianYingDraft")
            except PackageNotFoundError:
                ver = version("pyjianyingdraft")
        except Exception:  # noqa: BLE001
            ver = "未知"
    log(f"pyJianYingDraft 版本：{ver}")

    # --- 2. 建立草稿（DraftFolder → create_draft） -----------------------
    # 註：新版 API 一般為 DraftFolder(...).create_draft(name, w, h)。
    #     若你的版本用的是 Script_file / ScriptFile，請對照文件調整這一段。
    try:
        draft_folder = draft.DraftFolder(str(draft_folder_path))
    except AttributeError:
        fail("此版本沒有 draft.DraftFolder；請查看安裝版文件的草稿建立 API 名稱。")

    try:
        # allow_replace：若同名草稿已存在則覆蓋（部分版本才有此參數）
        try:
            script = draft_folder.create_draft(args.name, args.width, args.height,
                                               allow_replace=True)
        except TypeError:
            # 舊/新版本可能沒有 allow_replace 參數
            script = draft_folder.create_draft(args.name, args.width, args.height)
    except Exception as e:  # noqa: BLE001
        fail(f"create_draft 失敗：{e}")

    log(f"已建立草稿：{args.name}（{args.width}x{args.height}）")

    # --- 3. 新增影片軌 ---------------------------------------------------
    # 已對照實際安裝版 pyJianYingDraft 驗證：使用 append_track(TrackSpec(...))。
    # （此版沒有 add_track；若你的版本報錯，才需改回 add_track。）
    try:
        script.append_track(draft.TrackSpec(draft.TrackType.video))
    except AttributeError:
        # 極少數舊版可能是 add_track(TrackType.video)
        try:
            script.add_track(draft.TrackType.video)
        except AttributeError:
            fail("此版本既無 append_track 也無 add_track；請對照安裝版文件。")
    log("已新增影片軌")

    # --- 4. 建立影片素材 -------------------------------------------------
    try:
        video_material = draft.VideoMaterial(str(video_path))
    except Exception as e:  # noqa: BLE001
        fail(f"建立 VideoMaterial 失敗：{e}")

    # 素材長度（微秒）；用來避免片段超過影片本身長度
    material_us = getattr(video_material, "duration", None)
    want_us = int(args.seconds * 1_000_000)  # 剪映內部單位＝微秒
    if isinstance(material_us, int) and material_us > 0:
        clip_us = min(want_us, material_us)
    else:
        clip_us = want_us
    log(f"素材長度(us)：{material_us}；本次片段長度(us)：{clip_us}")

    # --- 5. 建立片段並加入軌道 ------------------------------------------
    # target_timerange：擺在時間軸的位置（此處從 0 開始）
    # source_timerange：從毛片裁切的來源範圍（此處取影片開頭同長度）
    try:
        target_tr = trange(0, clip_us)          # (start_us, duration_us)
        source_tr = trange(0, clip_us)
        try:
            segment = draft.VideoSegment(video_material, target_tr,
                                         source_timerange=source_tr)
        except TypeError:
            # 部分版本 VideoSegment 只吃 (material, target_timerange)
            segment = draft.VideoSegment(video_material, target_tr)
    except Exception as e:  # noqa: BLE001
        fail(f"建立 VideoSegment 失敗：{e}")

    try:
        script.add_segment(segment)
    except Exception as e:  # noqa: BLE001
        fail(f"add_segment 失敗：{e}")
    log("已把片段加入影片軌")

    # --- 6. 存檔（透過 DraftFolder 存，才會產生 meta，剪映才看得到） -----
    try:
        script.save()
    except Exception as e:  # noqa: BLE001
        fail(f"save 失敗：{e}")

    saved_path = draft_folder_path / args.name
    log("=" * 56)
    log(f"完成。草稿應位於：{saved_path}")
    log("下一步（在剪映驗收）：")
    log("  1) 開啟剪映，看草稿列表是否出現該草稿並能載入（無『升級/報錯』）")
    log("  2) 時間軸能看到影片、且非離線紅片段")
    log("  3) 能拖動/裁切/加字幕 → 確認可人工修改")
    log("若『無法載入/要求升級』→ 走路線 B：用 jy-draftc 對草稿做 v2 回加密後重試")
    log("=" * 56)


if __name__ == "__main__":
    main()
