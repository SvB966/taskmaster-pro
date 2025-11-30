@echo off
setlocal
:: Start Vite dev server from project root
pushd %~dp0
npm run dev
popd
endlocal
