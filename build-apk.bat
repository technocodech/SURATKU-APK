@echo off
setlocal
cd /d "%~dp0"
set "GV=8.9"
set "GD=%USERPROFILE%\.gradle\local-dists\gradle-%GV%"
if not exist "%GD%\bin\gradle.bat" (
  echo Mengunduh Gradle %GV%...
  if not exist "%USERPROFILE%\.gradle\local-dists" mkdir "%USERPROFILE%\.gradle\local-dists"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest 'https://services.gradle.org/distributions/gradle-%GV%-bin.zip' -OutFile '%USERPROFILE%\.gradle\local-dists\gradle.zip'; Expand-Archive -Force '%USERPROFILE%\.gradle\local-dists\gradle.zip' '%USERPROFILE%\.gradle\local-dists'"
  if errorlevel 1 (echo Gagal mengunduh Gradle. Periksa koneksi internet.& pause & exit /b 1)
)
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if not defined ANDROID_HOME if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not defined ANDROID_SDK_ROOT set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not defined ANDROID_HOME (echo Android SDK tidak ditemukan. Install Android Studio dan Android SDK Platform 35 dahulu.& pause & exit /b 1)
call "%GD%\bin\gradle.bat" assembleDebug
if errorlevel 1 (echo BUILD GAGAL. Baca pesan error di atas.& pause & exit /b 1)
echo.
echo APK berhasil dibuat:
echo %CD%\app\build\outputs\apk\debug\app-debug.apk
pause
