const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const ejs = require("ejs");
const path = require("path");


//arrays
var processes = [];

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  //clear the previous processes
  processes = [];
  
  res.render("index", {
    processes: processes,
    option: "FCFS",
    inputA: req.body.arrivalTimes,
    inputB: req.body.burstTimes,
    ganttChart: scheduler.ganttChart,
    averages: scheduler.averages,
  });
  // res.sendFile(__dirname+"/index.html")
});

app.post("/", function (req, res) {
  let a = req.body.arrivalTimes.split(" ");
  let b = req.body.burstTimes.split(" ");
  let quantum = req.body.quantum;
  let priorities = req.body.priorities == null? null :req.body.priorities.split(" ");
  let option = req.body.option;

  //clear the scheduler
  scheduler.reset();


  if(option != "5" && option != "6") {
  if (intializeProcesses1(a, b)) {
    if (option == "1") {
      scheduler.runFCFS();
      let temp = scheduler.getfinishedProcesses();

      res.render("index", {
        processes: temp,
        option: "FCFS",
        inputA: req.body.arrivalTimes,
        inputB: req.body.burstTimes,
        averages: scheduler.averages,
        ganttChart: scheduler.ganttChart,
      });
    } else if (option == "2") {
      scheduler.runSJF();
      let temp = scheduler.getfinishedProcesses();

      res.render("index", {
        processes: temp,
        option: "SJF",
        inputA: req.body.arrivalTimes,
        inputB: req.body.burstTimes,
        averages: scheduler.averages,
        ganttChart: scheduler.ganttChart,
      });
    } else if (option == "3") {
      scheduler.runSRTF();
      let temp = scheduler.getfinishedProcesses();

      res.render("index", {
        processes: temp,
        option: "SJF",
        inputA: req.body.arrivalTimes,
        inputB: req.body.burstTimes,
        averages: scheduler.averages,
        ganttChart: scheduler.ganttChart,
      });
    } else if (option == "4") {
      scheduler.runRoundRobin(quantum);
      let temp = scheduler.getfinishedProcesses();

      res.render("index", {
        processes: temp,
        option: "SJF",
        inputA: req.body.arrivalTimes,
        inputB: req.body.burstTimes,
        averages: scheduler.averages,
        ganttChart: scheduler.ganttChart,
      });
    }
  } 
  else{
      console.log("error initializing");
  }
 }

  //initialization for priority
  if(option == "5" || option == "6") {
  if (intializeProcesses2(a, b,priorities)) {

     if (option == "5") {
      scheduler.runPriorityScheduling();
      let temp = scheduler.getfinishedProcesses();

      res.render("index", {
        processes: temp,
        option: "SJF",
        inputA: req.body.arrivalTimes,
        inputB: req.body.burstTimes,
        averages: scheduler.averages,
        ganttChart: scheduler.ganttChart,
        priorities: priorities,
      });
    } 
    
    else if (option == "6") {
      scheduler.runPreemptivePriorityScheduling();
      let temp = scheduler.getfinishedProcesses();

      res.render("index", {
        processes: temp,
        option: "SJF",
        inputA: req.body.arrivalTimes,
        inputB: req.body.burstTimes,
        averages: scheduler.averages,
        ganttChart: scheduler.ganttChart,
        priorities: priorities,
      });
    } 
  }
  else{
      console.log("error intializing");

  }
  }
  
});

app.listen(3000, function (req, res) {
  console.log("server started at port 3000");
});

class Process {
  // constructor(name, arrivalTime, burstTime) {
  //   this.name = name;
  //   this.arrivalTime = arrivalTime;
  //   this.burstTime = burstTime;
  //   this.remainingTime = burstTime;
  //   this.completionTime = 0;
  //   this.turnaroundTime = 0;
  //   this.waitingTime = 0;
  //   this.responseTime;
  //   this.priority;
  // }
  constructor(name, arrivalTime, burstTime,priority) {
    this.name = name;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.remainingTime = burstTime;
    this.completionTime = 0;
    this.turnaroundTime = 0;
    this.waitingTime = 0;
    this.responseTime;
    this.priority = priority;
  }
}

class Scheduler {
  constructor() {
    this.queue = [];
    this.readyQueue = [];
    this.finishedProcesses = [];
    this.ganttChart = [];
    this.averages = [];
  }

  addProcess(process) {
    this.queue.push(process);
  }
  reset() {
    this.queue = [];
    this.readyQueue = [];
    this.finishedProcesses = [];
    this.ganttChart = [];
    this.averages = [];
  }

  runFCFS() {
    let currentTime = 0;
    let currentProcess = null;

    // Sort processes by arrival time
    this.queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (this.queue.length > 0) {
      currentProcess = this.queue[0];

      while (currentProcess.arrivalTime > currentTime) {
        currentTime++;
      }

      //response time is equal to current time minus the arrival time of the process
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime;
      //waiting time is equal to response time for FCFS because the processes are executed fully once started
      currentProcess.waitingTime = currentProcess.responseTime;

      let startTime = currentTime;

      while (currentProcess.remainingTime > 0) {
        currentProcess.remainingTime--;
        currentTime++;
      }
      let finishTime = currentTime;

      this.ganttChart.push({
        name: currentProcess.name,
        startTime: startTime,
        finishTime: finishTime,
      });

      //process has no remaning time left so the completion time is equal to the current time
      currentProcess.completionTime = currentTime;
      //turnaround time is the total time the process has spent in the queue until it is completed
      currentProcess.turnaroundTime =
        currentProcess.completionTime - currentProcess.arrivalTime;

      this.finishedProcesses.push(currentProcess);
      this.queue.shift();

      currentProcess = null;
    }
  this.calculateAverages();
  }

  runSJF() {
    let currentTime = 0;
    let currentProcess = null;

    // Sort processes by arrival time
    this.queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (this.queue.length > 0) {
      // Filter processes that have arrived before or on the current time
      const arrivedProcesses = this.queue.filter(
        (process) => process.arrivalTime <= currentTime
      );

      // Sort the arrived processes based on burst time
      arrivedProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
      if (arrivedProcesses.length > 0) {
        // Choose the process with the shortest remaining time
        currentProcess = arrivedProcesses[0];

        // Check if it is not null and is an unfinished process
        if (currentProcess !== null && currentProcess.remainingTime > 0) {
          // Response time is equal to current time minus the arrival time of the process
          currentProcess.responseTime =
            currentTime - currentProcess.arrivalTime;

          let startTime = currentTime;

          while (currentProcess.remainingTime > 0) {
            currentProcess.remainingTime--;
            currentTime++;
          }

          let finishTime = currentTime;
          this.ganttChart.push({
            name: currentProcess.name,
            startTime: startTime,
            finishTime: finishTime,
          });
          //console.log(this.ganttChart);

          // Process has no remaining time left, so the completion time is equal to the current time
          currentProcess.completionTime = currentTime;
          // Turnaround time is the total time the process has spent in the queue until it is completed
          currentProcess.turnaroundTime =
            currentProcess.completionTime - currentProcess.arrivalTime;
          currentProcess.waitingTime =
            currentProcess.turnaroundTime - currentProcess.burstTime;

          this.finishedProcesses.push(currentProcess);
          this.queue = this.queue.filter(
            (process) => process !== currentProcess
          );

          currentProcess = null;
        }
      } else {
        currentTime++;
      }
    }
  this.calculateAverages();
  }

  runSRTF() {
    let currentTime = 0;
    let currentProcess = null;

    while (this.queue.length > 0) {
      // Filter processes that have arrived before or on the current time
      const arrivedProcesses = this.queue.filter(
        (process) => process.arrivalTime <= currentTime
      );

      // Sort the arrived processes based on remaining time
      arrivedProcesses.sort((a, b) => a.remainingTime - b.remainingTime);

      if (arrivedProcesses.length > 0) {
        // Choose the process with the shortest remaining time
        currentProcess = arrivedProcesses[0];
        //console.log(currentProcess);
        // Check if it is not null and is an unfinished process
        if (
          currentProcess !== null &&
          currentProcess.remainingTime !== undefined &&
          currentProcess.remainingTime > 0
        ) {
          // Response time is equal to current time minus the arrival time of the process
          if (currentProcess.responseTime === undefined) {
            currentProcess.responseTime =
            currentTime - currentProcess.arrivalTime;
          }

          let startTime = currentTime;
           currentProcess.remainingTime--;
           currentTime++;

          while (currentProcess.remainingTime > 0) {
            console.log("in");
            const arrivedProcesses = this.queue.filter(
              (process) => process.arrivalTime <= currentTime
            );
            arrivedProcesses.sort((a, b) => a.remainingTime - b.remainingTime);

            if (arrivedProcesses.length > 0) {
              if (currentProcess.remainingTime <= arrivedProcesses[0].remainingTime) {
                currentProcess.remainingTime--;
                currentTime++;
                console.log( "p" + currentProcess.name + " " + startTime + " " + currentProcess.remainingTime);
              } else {
                console.log("out");
                break;
              }
            } else {
              
              currentProcess.remainingTime--;
              currentTime++;
              console.log( "p" + currentProcess.name + " " + startTime + " " + currentProcess.remainingTime);
            }
            if (currentProcess.remainingTime === 0) {
              break;
            }
          }

          // currentProcess.remainingTime--;
          // currentTime++;
          let finishTime = currentTime;

          this.ganttChart.push({
            name: currentProcess.name,
            startTime: startTime,
            finishTime: finishTime,
          });

          // Increment waiting time for all other processes in the queue
          this.queue.forEach((process) => {
            if (process !== currentProcess) {
              process.waitingTime++;
            }
          });

          // Check if the process has completed
          if (currentProcess.remainingTime === 0) {
            // Process has no remaining time left, so the completion time is equal to the current time
            currentProcess.completionTime = currentTime;
            // Turnaround time is the total time the process has spent in the queue until it is completed
            currentProcess.turnaroundTime =
              currentProcess.completionTime - currentProcess.arrivalTime;
            currentProcess.waitingTime =
              currentProcess.turnaroundTime - currentProcess.burstTime;

            this.finishedProcesses.push(currentProcess);
            this.queue = this.queue.filter(
              (process) => process !== currentProcess
            );

            currentProcess = null;
          }
        }
      } else {
        currentTime++;
      }
    }
  this.calculateAverages();
  }

  runRoundRobin(timeQuantum) {
    let currentTime = 0;
    let currentProcess = null;
    this.queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (this.queue.length > 0) {
      // Filter processes that have arrived before or on the current time
      const arrivedProcesses = this.queue.filter(
        (process) => process.arrivalTime <= currentTime
      );

      arrivedProcesses.forEach((process) => {
        if (!this.readyQueue.includes(process)) {
          this.readyQueue.push(process);
        }
      });

      // Check if there are any arrived processes
      if (this.readyQueue.length > 0) {
        // Choose the process to execute based on the round robin algorithm
        currentProcess = this.readyQueue[0];

        // if (this.queue[0].arrivalTime <= currentTime) {
        //   currentProcess = this.queue[0];

        // Check if it is not null and is an unfinished process
        if (
          // currentProcess !== null &&
          // currentProcess.remainingTime !== undefined &&
          currentProcess.remainingTime > 0
        ) {
          // Response time is equal to current time minus the arrival time of the process
          if (currentProcess.responseTime === undefined) {
            currentProcess.responseTime =
              currentTime - currentProcess.arrivalTime;
          }

          // Execute the process for the time quantum or until it completes
          const executionTime = Math.min(
            timeQuantum,
            currentProcess.remainingTime
          );

          let startTime = currentTime;
          currentProcess.remainingTime -= executionTime;
          currentTime += executionTime;
          let finishTime = currentTime;

          this.ganttChart.push({
            name: currentProcess.name,
            startTime: startTime,
            finishTime: finishTime,
          });
          console.log(
            "p" + currentProcess.name + " " + startTime + " " + finishTime
          );

          // Check if the process has completed
          if (currentProcess.remainingTime === 0) {
            // Process has no remaining time left, so the completion time is equal to the current time
            currentProcess.completionTime = currentTime;
            // Turnaround time is the total time the process has spent in the queue until it is completed
            currentProcess.turnaroundTime =
              currentProcess.completionTime - currentProcess.arrivalTime;
            currentProcess.waitingTime =
              currentProcess.turnaroundTime - currentProcess.burstTime;

            this.finishedProcesses.push(currentProcess);

            this.queue = this.queue.filter(
              (process) => process !== currentProcess
            );
            //this.queue.shift();
            this.readyQueue.shift();

            currentProcess = null;
          }
          // the process is not completed
          else {
            const arrivedProcesses = this.queue.filter(
              (process) => process.arrivalTime <= currentTime
            );
            //push the processes that have arrived while on execution to the ready queue
            arrivedProcesses.forEach((process) => {
              if (!this.readyQueue.includes(process)) {
                this.readyQueue.push(process);
              }
            });
            // push the process to the ready queue
            this.readyQueue.push(this.readyQueue.shift());

            currentProcess = null;
          }
        }
      } else {
        console.log("idle" + " " + currentTime);
        currentTime++;
      }
    }
  this.calculateAverages();

  }

  runPriorityScheduling() {
  let currentTime = 0;
  let currentProcess = null;

  // Sort processes by arrival time
  this.queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

  while (this.queue.length > 0) {
    // Filter processes that have arrived before or on the current time
    const arrivedProcesses = this.queue.filter(
      (process) => process.arrivalTime <= currentTime
    );

    // Sort the arrived processes based on priority
    arrivedProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
    arrivedProcesses.sort((a, b) => a.priority - b.priority);

    if (arrivedProcesses.length > 0) {
      // Choose the process with the highest priority
      currentProcess = arrivedProcesses[0];
      console.log(currentProcess);
      // Check if it is not null and is an unfinished process
      if (currentProcess !== null && currentProcess.remainingTime > 0) {
        // Response time is equal to current time minus the arrival time of the process
        if (currentProcess.responseTime === undefined) {
          currentProcess.responseTime =
            currentTime - currentProcess.arrivalTime;
        }

        let startTime = currentTime;

        while (currentProcess.remainingTime > 0) {
          currentProcess.remainingTime--;
          currentTime++;
        }

        let finishTime = currentTime;

        this.ganttChart.push({
          name: currentProcess.name,
          startTime: startTime,
          finishTime: finishTime,
        });

        // Process has no remaining time left, so the completion time is equal to the current time
        currentProcess.completionTime = currentTime;
        // Turnaround time is the total time the process has spent in the queue until it is completed
        currentProcess.turnaroundTime =
          currentProcess.completionTime - currentProcess.arrivalTime;
        currentProcess.waitingTime =
          currentProcess.turnaroundTime - currentProcess.burstTime;

        this.finishedProcesses.push(currentProcess);
        this.queue = this.queue.filter(
          (process) => process !== currentProcess
        );

        currentProcess = null;
      }
    } 
    else {
      currentTime++;
    }
  }
  this.calculateAverages();
  }

  runPreemptivePriorityScheduling() {
  let currentTime = 0;
  let currentProcess = null;

  // Sort processes by arrival time
  this.queue.sort((a, b) => a.arrivalTime - b.arrivalTime);

  while (this.queue.length > 0) {
    // Filter processes that have arrived before or on the current time
    const arrivedProcesses = this.queue.filter(
      (process) => process.arrivalTime <= currentTime
    );

    // Sort the arrived processes based on priority
    arrivedProcesses.sort((a, b) => a.priority - b.priority);

    if (arrivedProcesses.length > 0) {
      // Choose the process with the highest priority
      currentProcess = arrivedProcesses[0];

      // Check if it is not null and is an unfinished process
      if (currentProcess !== null && currentProcess.remainingTime > 0) {
        // Response time is equal to current time minus the arrival time of the process
        if (currentProcess.responseTime === undefined) {
          currentProcess.responseTime =
            currentTime - currentProcess.arrivalTime;
        }

        let startTime = currentTime;

        // Execute the process for one time unit
        currentProcess.remainingTime--;
        currentTime++;

        while (currentProcess.remainingTime > 0) {
            console.log("in");
            const arrivedProcesses = this.queue.filter(
              (process) => process.arrivalTime <= currentTime
            );
            arrivedProcesses.sort((a, b) => a.priority - b.priority);

            if (arrivedProcesses.length > 0) {
              if (currentProcess.priority <= arrivedProcesses[0].priority) {
                currentProcess.remainingTime--;
                currentTime++;
                console.log( "p" + currentProcess.name + " " + startTime + " " + currentProcess.remainingTime);
              } else {
                console.log("out");
                break;
              }
            } else {
              
              currentProcess.remainingTime--;
              currentTime++;
              console.log( "p" + currentProcess.name + " " + startTime + " " + currentProcess.remainingTime);
            }
            if (currentProcess.remainingTime === 0) {
              break;
            }
          }

        let finishTime = currentTime;

        this.ganttChart.push({
          name: currentProcess.name,
          startTime: startTime,
          finishTime: finishTime,
        });

        // Check if the process has completed
        if (currentProcess.remainingTime === 0) {
          // Process has no remaining time left, so the completion time is equal to the current time
          currentProcess.completionTime = currentTime;
          // Turnaround time is the total time the process has spent in the queue until it is completed
          currentProcess.turnaroundTime =
            currentProcess.completionTime - currentProcess.arrivalTime;
          currentProcess.waitingTime =
            currentProcess.turnaroundTime - currentProcess.burstTime;

          this.finishedProcesses.push(currentProcess);
          this.queue = this.queue.filter(
            (process) => process !== currentProcess
          );

          currentProcess = null;
        }
      }
    } else {
      currentTime++;
    }
  }
  this.calculateAverages()
}

  getfinishedProcesses() {
    this.getGanttChart();
    return this.finishedProcesses;
  }
  getGanttChart() {
    console.log(this.ganttChart);
  }
  calculateAverages(){
    var length = this.finishedProcesses.length

    var sumWaiting = 0, sumTurnaound = 0, sumResponse = 0
    var avgWaiting ,avgTurnaround, avgResponse 
   
    this.finishedProcesses.forEach(process => {
      sumWaiting += process.waitingTime;
      sumResponse += process.responseTime;
      sumTurnaound += process.turnaroundTime;
    })

    avgResponse = sumResponse / length
    avgWaiting = sumWaiting / length
    avgTurnaround = sumTurnaound / length

    this.averages.push({
      avgWaiting: avgWaiting,
      avgResponse: avgResponse,
      avgTurnaround: avgTurnaround,
    });
    this.modifyGanttChart()
  }
  modifyGanttChart(){
    const updatedGanttChart = [];

    for (let i = 0; i < this.ganttChart.length; i++) {
      const currentProcess = this.ganttChart[i];
      updatedGanttChart.push(currentProcess);
      if (i < this.ganttChart.length - 1) {
        const nextProcess = this.ganttChart[i + 1];
        if (currentProcess.finishTime !== nextProcess.startTime) {
          const idleProcess = {
            name: "-",
            startTime: currentProcess.finishTime,
            finishTime: nextProcess.startTime,
          };
          updatedGanttChart.push(idleProcess);
        }
      }
    }

    this.ganttChart = updatedGanttChart
    }
  }

const scheduler = new Scheduler();


function intializeProcesses1(arrivalTimes, burstTimes) {
  if (arrivalTimes.length !== burstTimes.length) {
    return false;
  } else {
    for (let i = 0; i < arrivalTimes.length; i++) {
      let process = new Process(i + 1, arrivalTimes[i], burstTimes[i]);
      scheduler.addProcess(process);
    }
    return true;
  }
}
function intializeProcesses2(arrivalTimes, burstTimes,priorities) {
  if (arrivalTimes.length !== burstTimes.length && arrivalTimes.length !== priorities.length ) {
    return false;
  } else {
    for (let i = 0; i < arrivalTimes.length; i++) {
      let process = new Process(i + 1, arrivalTimes[i], burstTimes[i],priorities[i]);
      scheduler.addProcess(process);
    }
    return true;
  }
}


