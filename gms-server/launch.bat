@echo off
@title BeiDou
chcp 65001

.\jdk-21.0.2\bin\java.exe -Xms2G -Xmx6G -XX:+UseG1GC -Dspring.config.location=application.yml -jar target\BeiDou.jar
pause