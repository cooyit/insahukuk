// emulate N vCPU for os.cpus()/availableParallelism (measurement only)
const os = require('os'); const n = parseInt(process.env.EMU_CPUS || '0', 10);
if (n > 0) { const c = os.cpus().slice(0, n); os.cpus = () => c; os.availableParallelism = () => n; }
