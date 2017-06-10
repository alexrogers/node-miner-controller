// 1070 hashrates
const config = {
  user: "18s12dKDssLTQrVMvMe2jjKcMnF5NVZRXr",
  pass: "c=BTC,stats",
  pool: "mine.zpool.ca",
  diffToSwitch: 0.05,
  sortBy: "profit_estimate_last24h",
  checkTime: 5 * 60 * 1000,
  retryTime: 0.5 * 30 * 1000,
  binDir: "C:/\NiceHashMiner_v1.7.5.12/\minerbins"
};

const speeds = [
  {
    "name": "bitcore",
    "speed": "15.4"
  },
  {
    "name": "blake2s",
    "speed": "3.4"
  },
  {
    "name": "blakecoin",
    "speed": "4.1"
  },
  {
    "name": "c11",
    "speed": "12.5"
  },
  {
    "name": "decred",
    "speed": "2.4"
  },
  {
    "name": "equihash",
    "speed": "0.41"
  },
  {
    "name": "groestl",
    "speed": "34"
  },
  {
    "name": "hmq1725",
    "speed": "4.3"
  },
  {
    "name": "lbry",
    "speed": "262"
  },
  {
    "name": "lyra2v2",
    "speed": "33"
  },
  {
    "name": "lyra2z",
    "speed": "1.4"
  },
  {
    "name": "m7m",
    "speed": "0"
  },
  {
    "name": "myr-gr",
    "speed": "61"
  },
  {
    "name": "neoscrypt",
    "speed": "0.87"
  },
  {
    "name": "nist5",
    "speed": "40"
  },
  {
    "name": "quark",
    "speed": "22"
  },
  {
    "name": "qubit",
    "speed": "18"
  },
  {
    "name": "scrypt",
    "speed": "0"
  },
  {
    "name": "sha256",
    "speed": "0"
  },
  {
    "name": "sib",
    "speed": "8.2"
  },
  {
    "name": "skein",
    "speed": "484"
  },
  {
    "name": "timetravel",
    "speed": "24"
  },
  {
    "name": "veltor",
    "speed": "20"
  },
  {
    "name": "x11",
    "speed": "12.5"
  },
  {
    "name": "x11evo",
    "speed": "12.1"
  },
  {
    "name": "x13",
    "speed": "9.8"
  },
  {
    "name": "x15",
    "speed": "8.9"
  },
  {
    "name": "x17",
    "speed": "8.8"
  },
  {
    "name": "xevan",
    "speed": "0"
  },
  {
    "name": "yescrypt",
    "speed": "0"
  }
];

function sortByScore(algos, sortBy="profit_estimate_current") {
  //profit_estimate_current
  //profit_estimate_last24h
  //profit_actual_last24h

  return algos.sort(function(b,a) {return (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0);} );
}

function buildRunCommand (algo) {
  switch (algo.name) {
    case "bitcore":
    case "blake2s":
    case "blakecoin":
    case "c11":
    case "decred":
    case "hmq1725":
    case "lbry":
    case "lyra2v2":
    case "lyra2z":
    case "myr-gr":
    case "neoscrypt":
    case "nist5":
    case "quark":
    case "qubit":
    case "sib":
    case "timetravel":
    case "veltor":
    case "x11":
    case "x11evo":
    case "x13":
    case "x15":
    case "x17":
      return `ccminer_pruvot_2.exe -a ${algo.name} -o stratum+tcp://${algo.name}.${config.pool}:${algo.port} -u ${config.user} -p ${config.pass}`;
      break;
    case "groestl":
    case "skein":
      return `ccminer_sp_1581.exe -a ${algo.name} -o stratum+tcp://${algo.name}.${config.pool}:${algo.port} -u ${config.user} -p ${config.pass}`;
      break;
    case "equihash":
      return `ewbfminer033b.exe --server ${algo.name}.${config.pool} --port ${algo.port} --fee 0 --eexit 2 --user ${config.user} --pass ${config.pass}`;
      break;
    case "m7m":
    case "scrypt":
    case "sha256":
    case "xevan":
    case "yescrypt":
    default:
      return "null";
  }
}

function getBestAlgo(currentAlgoName) {
  const rp = require('request-promise');
  //const Promise = require('bluebird');
  const fs = Promise.promisifyAll(require('fs'));

  //fs.readFileAsync('status.json')
  return rp({ uri: "http://www.zpool.ca/api/status", json: true })
  .then((status) => {
    if (typeof(status) !== 'object') {
      console.log('not object');
      return;
    }

    let statusArray = Object.keys(status).map((k) => {
      return status[k];
    });


    let mergedArray = speeds.map((speed) => {
      let found = statusArray.find(status => status.name === speed.name);
      if (found) {
        const profit = {
          "profit_estimate_current": parseFloat(found["estimate_current"]) * parseFloat(speed["speed"]),
          "profit_estimate_last24h": parseFloat(found["estimate_last24h"]) * parseFloat(speed["speed"]),
          "profit_actual_last24h": parseFloat(found["actual_last24h"]) * parseFloat(speed["speed"]),
          "runCommand": buildRunCommand(found)
        };

        //console.log(profit);

        return Object.assign({}, found, speed, profit);
      }
    });

    // console.log(mergedArray);
    // let csv = json2csv({ data: mergedArray });
    // fs.writeFile('mergedarray.csv', csv);
    let algos = sortByScore(mergedArray, config.sortBy);

    //console.log(mergedArray);

    const bestAlgo = algos[0];
    const bestProfit = bestAlgo[config.sortBy];
    const bestName = bestAlgo.name;

    const currentAlgo = algos.find(algo => algo.name === currentAlgoName);
    const currentProfit = currentAlgo[config.sortBy];


    console.log('---------------------');
    algos.forEach((algo) => {
      console.log(`${algo.name} - ${algo['profit_estimate_current']} - ${algo['profit_estimate_last24h']} - ${algo['profit_actual_last24h']}`);
    });
    console.log('---------------------');

    // force a coin
    // const setAlgo = algos.find(algo => algo.name === 'blakecoin');
    // return { name: setAlgo.name, runCommand: setAlgo.runCommand };


    if (bestProfit > (currentProfit + currentProfit * config.diffToSwitch)) {
      console.log(`${bestName} - ${bestProfit}`);
      return { name: bestName, runCommand: bestAlgo.runCommand };
    }

    console.log(`${currentAlgoName} - ${currentProfit}`);
    return { name: currentAlgoName, runCommand: currentAlgo.runCommand };
  })
  .catch((err) => {
    console.log('API Down waiting...');
    setTimeout(loop, config.retryTime);
    return false;
  });
}

function loop() {
  return getBestAlgo(miningAlgoName).then((newMiningAlgo) => {
    if (!newMiningAlgo) { return; }

    // no change
    if (newMiningAlgo.name === miningAlgoName) {
      // console.log('no change');
    } else {
      // console.log('changed');

      if (cmd) {
        // kill with fire
        console.log('killwithfire');
        spawn("taskkill", ["/pid", cmd.pid, '/f', '/t']);
        cmd = undefined;
      }
    }

    if (!cmd) {
      console.log('spawn new miner');
      // console.log(newMiningAlgo.runCommand);
      cmd = spawn(`${config.binDir}\/${newMiningAlgo.runCommand}`, [], { shell: true, detached: true });
    }

    miningAlgoName = newMiningAlgo.name;
  });
}

let miningAlgoName = "c11";
const spawn = require('child_process').spawn;
let cmd;


// let runCommand = "ccminer_pruvot_2.exe -r 0 -a c11 -o stratum+tcp://blake2s.mine.zpool.ca:3573 -u 18s12dKDssLTQrVMvMe2jjKcMnF5NVZRXr -p c=BTC,stats";
// cmd = spawn(`${config.binDir}\/${runCommand}`, [], { shell: true, detached: true });

loop();
let intervalLoop = setInterval(loop, config.checkTime);
