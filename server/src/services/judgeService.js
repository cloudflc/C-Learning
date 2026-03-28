const { OJSubmission } = require('../models/OJProblem');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../../temp');
const COMPILE_TIMEOUT = 10000;
const DEFAULT_TIME_LIMIT = 2000;
const DEFAULT_MEMORY_LIMIT = 256 * 1024 * 1024;

const ensureTempDir = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
};

const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to cleanup ${filePath}:`, error.message);
    }
  }
};

const executeCommand = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 10000;
    const killed = false;
    
    const proc = exec(command, {
      ...options,
      maxBuffer: 1024 * 1024 * 10
    }, (error, stdout, stderr) => {
      if (killed) return;
      
      if (error) {
        if (error.killed) {
          resolve({ stdout: '', stderr: '', timedOut: true, code: -1 });
        } else {
          resolve({ stdout, stderr, code: error.code || -1 });
        }
      } else {
        resolve({ stdout, stderr, code: 0 });
      }
    });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
    }, timeout);

    proc.on('close', () => {
      clearTimeout(timer);
    });
  });
};

const compileCpp = async (sourcePath, outputPath, timeLimit = COMPILE_TIMEOUT) => {
  const compileCommand = `g++ -std=c++17 -O2 -o "${outputPath}" "${sourcePath}" 2>&1`;
  
  const result = await executeCommand(compileCommand, { timeout: timeLimit });
  
  if (result.code !== 0) {
    return {
      success: false,
      error: result.stderr || result.stdout || 'Compilation failed'
    };
  }
  
  return { success: true };
};

const runExecutable = async (executablePath, input, timeLimit, memoryLimit) => {
  return new Promise(async (resolve) => {
    const inputFile = `${executablePath}.input`;
    await fs.writeFile(inputFile, input || '');
    
    const startTime = Date.now();
    let timedOut = false;
    let memoryExceeded = false;
    
    const memoryLimitKB = Math.floor((memoryLimit || DEFAULT_MEMORY_LIMIT) / 1024);
    const timeLimitMs = timeLimit || DEFAULT_TIME_LIMIT;
    
    const proc = spawn(executablePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(executablePath)
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeLimitMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      cleanupFile(inputFile).catch(() => {});

      if (timedOut) {
        resolve({
          success: false,
          output: stdout,
          error: 'Time limit exceeded',
          time: executionTime,
          isTimeout: true
        });
        return;
      }

      if (code !== 0) {
        resolve({
          success: false,
          output: stdout,
          error: stderr || `Runtime error (exit code: ${code})`,
          time: executionTime
        });
        return;
      }

      resolve({
        success: true,
        output: stdout,
        error: '',
        time: executionTime
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        output: '',
        error: err.message,
        time: 0
      });
    });

    try {
      const inputFd = await fs.open(inputFile, 'r');
      const inputStream = inputFd.createReadStream();
      inputStream.pipe(proc.stdin);
      inputStream.on('end', () => {
        inputFd.close().catch(() => {});
      });
    } catch (err) {
      proc.stdin.end(input || '');
    }
  });
};

const executeCpp = async (code, stdin = '', timeLimit = DEFAULT_TIME_LIMIT, memoryLimit = DEFAULT_MEMORY_LIMIT) => {
  await ensureTempDir();
  
  const uniqueId = uuidv4();
  const sourcePath = path.join(TEMP_DIR, `${uniqueId}.cpp`);
  const executablePath = path.join(TEMP_DIR, uniqueId);
  
  try {
    await fs.writeFile(sourcePath, code);
    
    const compileResult = await compileCpp(sourcePath, executablePath);
    
    if (!compileResult.success) {
      await cleanupFile(sourcePath);
      return {
        success: false,
        output: '',
        error: compileResult.error,
        time: 0,
        compileError: true
      };
    }
    
    const runResult = await runExecutable(executablePath, stdin, timeLimit, memoryLimit);
    
    await cleanupFile(sourcePath);
    await cleanupFile(executablePath);
    
    return runResult;
  } catch (error) {
    await cleanupFile(sourcePath);
    await cleanupFile(executablePath);
    
    return {
      success: false,
      output: '',
      error: error.message || 'Execution failed',
      time: 0
    };
  }
};

const executeInSandbox = async (code, testCases, limits) => {
  await ensureTempDir();
  
  const uniqueId = uuidv4();
  const sourcePath = path.join(TEMP_DIR, `${uniqueId}.cpp`);
  const executablePath = path.join(TEMP_DIR, uniqueId);
  
  try {
    await fs.writeFile(sourcePath, code);
    
    const compileResult = await compileCpp(sourcePath, executablePath);
    
    if (!compileResult.success) {
      await cleanupFile(sourcePath);
      await cleanupFile(executablePath);
      
      return {
        results: [],
        compileOutput: compileResult.error,
        compileError: true,
        timeExceeded: false,
        memoryExceeded: false
      };
    }
    
    const results = [];
    const timeLimit = limits.timeLimit || DEFAULT_TIME_LIMIT;
    const memoryLimit = limits.memoryLimit || DEFAULT_MEMORY_LIMIT;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      const runResult = await runExecutable(executablePath, testCase.input || '', timeLimit, memoryLimit);

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
    
    await cleanupFile(sourcePath);
    await cleanupFile(executablePath);

    return {
      results,
      compileOutput: '',
      compileError: false,
      timeExceeded: results.some(r => r.status === 'time_limit'),
      memoryExceeded: results.some(r => r.status === 'memory_limit')
    };
  } catch (error) {
    await cleanupFile(sourcePath);
    await cleanupFile(executablePath);
    
    return {
      results: [],
      compileOutput: error.message,
      compileError: true,
      timeExceeded: false,
      memoryExceeded: false
    };
  }
};

const judgeCode = async (submissionId, problem) => {
  const submission = await OJSubmission.findById(submissionId);

  if (!submission) {
    throw new Error('Submission not found');
  }

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
    if (result.compileError) {
      status = 'compile_error';
    } else if (result.timeExceeded) {
      status = 'time_limit';
    } else if (result.memoryExceeded) {
      status = 'memory_limit';
    } else if (score === 100 && totalTests > 0) {
      status = 'accepted';
    }

    submission.status = status;
    submission.score = score;
    submission.testResults = result.results;
    submission.compileOutput = result.compileOutput || '';
    await submission.save();

    return {
      status,
      score,
      testResults: result.results,
      compileOutput: result.compileOutput || ''
    };
  } catch (error) {
    submission.status = 'runtime_error';
    submission.score = 0;
    submission.compileOutput = error.message;
    await submission.save();
    
    return {
      status: 'runtime_error',
      score: 0,
      testResults: [],
      compileOutput: error.message
    };
  }
};

async function executeCode(code, input, language) {
  const result = await executeCpp(code, input || '', DEFAULT_TIME_LIMIT, DEFAULT_MEMORY_LIMIT);

  return {
    output: result.output,
    error: result.error,
    time: result.time,
    memory: 0
  };
}

module.exports = {
  judgeCode,
  executeCode
};
