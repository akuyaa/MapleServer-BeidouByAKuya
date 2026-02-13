@echo off
@title BeiDou
chcp 65001
rem Resolve script directory and prefer the repo-level bundled JDK if present
set BASE_DIR=%~dp0
set BUNDLED_JAVA=%BASE_DIR%..\jdk-21.0.2\bin\java.exe

if exist "%BUNDLED_JAVA%" (
	cd /d "%~dp0"
	"%BUNDLED_JAVA%" -Xms2G -Xmx6G -XX:+UseG1GC -Dspring.config.location=application.yml -jar target\BeiDou.jar
) else (
	rem Fall back to system java on PATH
	cd /d "%~dp0"
	java -Xms2G -Xmx6G -XX:+UseG1GC -Dspring.config.location=application.yml -jar target\BeiDou.jar
)
pause