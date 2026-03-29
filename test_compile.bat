@echo off
cd /d "G:\AI_APP\C++learning\server\temp"
echo #include ^<iostream^> > test1.cpp
echo int main() { std::cout ^<^< "test"; return 0; } >> test1.cpp
echo } >> test1.cpp
g++ test1.cpp -o test1 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Compilation successful
    test1
) else (
    echo Compilation failed
)
pause
