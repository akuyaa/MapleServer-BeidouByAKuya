@echo off
REM build.bat - Build frontend, copy dist to backend static, build backend, then start server
SETLOCAL ENABLEDELAYEDEXPANSION

set REPO_DIR=%~dp0

echo ==================================================================
echo Repository: %REPO_DIR%
echo Building frontend (gms-ui)...
echo ==================================================================

pushd "%REPO_DIR%gms-ui" || (
  echo ERROR: cannot change to gms-ui directory "%REPO_DIR%gms-ui"
  exit /b 1
)

echo Current dir: %CD%
if not exist "package.json" (
  echo ERROR: package.json not found in gms-ui. Aborting.
  popd
  exit /b 1
)

REM Prefer yarn if available, otherwise fall back to npm
where yarn >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Found yarn, running: yarn build
  call yarn build
else (
  where npm >nul 2>&1
  if %ERRORLEVEL%==0 (
    echo yarn not found, running: npm run build
    call npm run build
  ) else (
    echo ERROR: Neither yarn nor npm found in PATH. Cannot build frontend.
    popd
    exit /b 1
  )
)

if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Frontend build failed. See output above.
  popd
  exit /b 1
)

popd

echo.
echo ==================================================================
echo Copying frontend dist -> gms-server/src/main/resources/static
echo ==================================================================

REM Use absolute paths based on script location to avoid nesting issues
set SRC_DIR=%REPO_DIR%gms-ui\dist
set DST_DIR=%REPO_DIR%gms-server\src\main\resources\static

if not exist "%SRC_DIR%" (
  echo ERROR: frontend dist folder not found: "%SRC_DIR%"
  exit /b 1
)

echo robocopy "%SRC_DIR%" "%DST_DIR%" /MIR
robocopy "%SRC_DIR%" "%DST_DIR%" /MIR
set RC=%ERRORLEVEL%
REM Robocopy returns 0-7 for success, 8+ for failure
if %RC% GEQ 8 (
  echo ERROR: robocopy failed with code %RC%
  exit /b 1
)

echo.
echo ==================================================================
echo Building backend (gms-server) with Maven...
echo ==================================================================

pushd "%REPO_DIR%gms-server" || (
  echo ERROR: cannot change to gms-server directory "%REPO_DIR%gms-server"
  exit /b 1
)

echo Current dir: %CD%
if not exist "pom.xml" (
  echo ERROR: pom.xml not found in gms-server. Aborting.
  popd
  exit /b 1
)

where mvn >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Found mvn, running: mvn clean install -DskipTests
  call mvn clean install -DskipTests
else (
  echo WARNING: 'mvn' not found in PATH. Attempting to run 'mvn' anyway.
  call mvn clean install -DskipTests
)

if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Backend Maven build failed. See output above.
  popd
  exit /b 1
)

popd

echo.
echo ==================================================================
echo Starting server via launch.bat (root)
echo ==================================================================

pushd "%REPO_DIR%" || (
  echo ERROR: cannot change to repository root "%REPO_DIR%"
  exit /b 1
)

if exist "%REPO_DIR%launch.bat" (
  echo Running launch.bat...
  call "%REPO_DIR%launch.bat"
  if %ERRORLEVEL% NEQ 0 (
    echo WARNING: launch.bat returned non-zero exit code %ERRORLEVEL%
  )
) else (
  echo ERROR: launch.bat not found in repository root: "%REPO_DIR%launch.bat"
  exit /b 1
)

echo build.bat finished.
ENDLOCAL
exit /b 0
