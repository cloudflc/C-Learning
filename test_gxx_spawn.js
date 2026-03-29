const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const code = `#include <iostream>
int main() {
    std::cout << "Hello";
    return 0;
}`;

const tempDir = path.join(__dirname, 'server/temp');
const sourcePath = path.join(tempDir, 'test_spawn.cpp');
const outputPath = path.join(tempDir, 'test_spawn');

fs.writeFileSync(sourcePath, code, 'utf8');

console.log('=== Testing g++ with spawn ===');
console.log('Source file:', sourcePath);
console.log('Output file:', outputPath);

const gxx = 'C:\\msys64\\mingw64\\bin\\g++.exe';
const args = ['-std=c++17', '-O2', sourcePath, '-o', outputPath];

console.log('Command:', gxx);
console.log('Args:', args);

const startTime = Date.now();
const proc = spawn(gxx, args);

let stdout = '';
let stderr = '';

proc.stdout.on('data', (data) => {
    stdout += data.toString();
});

proc.stderr.on('data', (data) => {
    stderr += data.toString();
});

proc.on('close', (code) => {
    const endTime = Date.now();
    console.log('=== Process finished ===');
    console.log('Exit code:', code);
    console.log('Duration:', endTime - startTime, 'ms');
    console.log('Stdout:', stdout);
    console.log('Stderr:', stderr);
    
    if (code === 0) {
        console.log('✅ Compilation successful!');
        const runProc = spawn(outputPath, [], { stdio: 'inherit' });
        runProc.on('close', (runCode) => {
            console.log('Program exit code:', runCode);
        });
    } else {
        console.log('❌ Compilation failed!');
    }
});

proc.on('error', (err) => {
    console.log('=== Process error ===');
    console.log('Error:', err.message);
});

// Timeout after 30 seconds
setTimeout(() => {
    console.log('⏱️ Timeout, killing process...');
    proc.kill();
    process.exit(1);
}, 30000);
