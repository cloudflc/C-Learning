const { OJSubmission } = require('../models/OJProblem');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TEMP_DIR = path.join(os.tmpdir(), 'cpp-judge');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const judgeCode = async (submissionId, problem) => {
  const submission = await OJSubmission.findById(submissionId);
  
  submission.status = 'judging';
  await submission.save();

  try {
    const result = await executeInSandbox(submission.code, problem.testCases, {
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit
    });

    const passedTests = result.results.filter(r => r.status === 'accepted').length;
    const totalTests = problem.testCases.length;
    const score = totalTests > 0 ? Math.floor((passedTests / totalTests) * 100) : 0;

    let status = 'wrong_answer';
    if (score === 100 && totalTests > 0) {
      status = 'accepted';
    } else if (result.timeExceeded) {
      status = 'time_limit';
    } else if (result.memoryExceeded) {
      status = 'memory_limit';
    } else if (result.compileError) {
      status = 'compile_error';
    }

    return {
      status,
      score,
      testResults: result.results,
      compileOutput: result.compileOutput || ''
    };
  } catch (error) {
    return {
      status: 'runtime_error',
      score: 0,
      testResults: [],
      compileOutput: error.message
    };
  }
};

const compileCode = (code, filename) => {
  return new Promise((resolve) => {
    const tempDir = TEMP_DIR;
    const sourceFile = path.join(tempDir, `${filename}.cpp`).replace(/\\/g, '/');
    const exeFile = path.join(tempDir, `${filename}.exe`).replace(/\\/g, '/');
    
    try {
      fs.writeFileSync(sourceFile, code, 'utf8');
    } catch (err) {
      resolve({ success: false, exeFile: null, error: 'Failed to write source file: ' + err.message });
      return;
    }
    
    const gppPath = 'C:/msys64/ucrt64/bin/g++.exe';
    const compileCmd = `"${gppPath}" -o "${exeFile}" "${sourceFile}"`;
    
    execFile('C:/msys64/usr/bin/bash.exe', ['-c', compileCmd], { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, exeFile: null, error: stderr || error.message });
        return;
      }
      
      if (fs.existsSync(exeFile)) {
        resolve({ success: true, exeFile, error: '' });
      } else {
        resolve({ success: false, exeFile: null, error: stderr || 'Compilation failed' });
      }
    });
  });
};

const runExecutable = (exeFile, input, timeLimit) => {
  return new Promise((resolve) => {
    const msysExe = exeFile.replace(/\\/g, '/');
    
    let runCmd;
    if (input) {
      const inputFile = exeFile.replace('.exe', '_input.txt');
      fs.writeFileSync(inputFile, input, 'utf8');
      const inputFileMsys = inputFile.replace(/\\/g, '/');
      runCmd = `"${msysExe}" < "${inputFileMsys}"`;
    } else {
      runCmd = `"${msysExe}"`;
    }
    
    execFile('C:/msys64/usr/bin/bash.exe', ['-c', runCmd], { timeout: timeLimit || 5000 }, (error, stdout, stderr) => {
      if (input) {
        try {
          const inputFile = exeFile.replace('.exe', '_input.txt');
          fs.unlinkSync(inputFile);
        } catch (e) {}
      }
      
      if (error) {
        if (error.killed || error.message.includes('timeout')) {
          resolve({
            success: false,
            output: stdout,
            error: 'Time limit exceeded',
            time: timeLimit || 5000,
            isTimeout: true
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || error.message,
            time: 0
          });
        }
        return;
      }
      
      resolve({
        success: true,
        output: stdout,
        error: stderr,
        time: 0
      });
    });
  });
};

const executeInSandbox = async (code, testCases, limits) => {
  const results = [];
  const filename = `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const compileResult = await compileCode(code, filename);
  
  if (!compileResult.success) {
    return {
      results: [],
      compileOutput: compileResult.error,
      compileError: true,
      timeExceeded: false,
      memoryExceeded: false
    };
  }

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    const runResult = await runExecutable(
      compileResult.exeFile,
      testCase.input,
      limits.timeLimit || 2000
    );

    const actualOutput = (runResult.output || '').trim();
    const expectedOutput = (testCase.output || '').trim();

    let status = 'wrong_answer';
    let message = 'Output mismatch';

    if (runResult.isTimeout) {
      status = 'time_limit';
      message = 'Time limit exceeded';
    } else if (!runResult.success) {
      status = 'runtime_error';
      message = runResult.error;
    } else if (actualOutput === expectedOutput) {
      status = 'accepted';
      message = 'OK';
    }

    results.push({
      testCase: i + 1,
      status,
      time: runResult.time,
      memory: 0,
      message,
      expected: expectedOutput,
      actual: actualOutput
    });
  }

  try {
    fs.unlinkSync(compileResult.exeFile);
    const cppFile = compileResult.exeFile.replace('.exe', '.cpp');
    if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
  } catch (e) {}

  return {
    results,
    compileOutput: '',
    compileError: false,
    timeExceeded: results.some(r => r.status === 'time_limit'),
    memoryExceeded: false
  };
};

async function executeCode(code, input, language) {
  const filename = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const compileResult = await compileCode(code, filename);
  
  if (!compileResult.success) {
    return {
      output: '',
      error: compileResult.error,
      time: 0,
      memory: 0
    };
  }
  
  const runResult = await runExecutable(compileResult.exeFile, input, 5000);
  
  try {
    fs.unlinkSync(compileResult.exeFile);
    const cppFile = compileResult.exeFile.replace('.exe', '.cpp');
    if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
  } catch (e) {}
  
  return {
    output: runResult.output,
    error: runResult.error,
    time: runResult.time,
    memory: 0
  };
}

module.exports = {
  judgeCode,
  executeCode
};
