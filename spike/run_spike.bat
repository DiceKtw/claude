@echo off
REM ============================================================
REM  run_spike.bat  —  用 py 啟動器（Python 3.10）執行 spike
REM  用法：
REM    run_spike.bat "D:\footage\test.mp4"
REM  說明：
REM    - 不使用 python 指令，改用 py -3.10。
REM    - 執行前請先關閉剪映。
REM ============================================================
setlocal

if "%~1"=="" (
  echo [錯誤] 請提供測試影片絕對路徑。
  echo   範例： run_spike.bat "D:\footage\test.mp4"
  exit /b 1
)

REM 若尚未安裝 pyJianYingDraft，取消下一行註解先安裝：
REM py -3.10 -m pip install pyJianYingDraft

py -3.10 "%~dp0minimal_draft_spike.py" --video "%~1"

endlocal
