class Algrorithm {
    tasks = [];
    processors;
    interruptionsCount = 0;
    scheduleLength;
    type;
    constructor(numProcessors, tasks) {
        this.numProcessors = numProcessors;
        this.tasks = tasks;
        this.processors = new Array(numProcessors);
        for (let i = 0; i < numProcessors; i++) {
            this.processors[i] = new Processor();
        }
    }

    getTasksSum() {
        return this.tasks.reduce((sum, cur) => sum += cur.length, 0)
    }
    getMaxTask() {
        return this.tasks.reduce((max, cur) => {
            if (cur.length > max) max = cur.length;
            return max;
        }, this.tasks[0].length)
    }
}

class McNaughton extends Algrorithm {
    constructor(numProcessors, tasks) {
        super(numProcessors, tasks);
        this.type = 'mcnaughton';
    }


    getSchedule() {
        this.tasks.sort((a, b) => b.length - a.length);
        const scheduleLength = Math.max(this.getMaxTask(), Math.ceil(1 / this.numProcessors * (this.getTasksSum())));
        this.scheduleLength = scheduleLength;
        this.processors.forEach(p => {
            while (p.load < scheduleLength && this.tasks.length > 0) {
                const task = this.tasks[0];
                const taskLength = task.length;
                const remainder = scheduleLength - p.load;
                if (taskLength > remainder) {
                    p.tasks.push(task.trim(remainder));
                    this.interruptionsCount++;
                }
                else {
                    p.tasks.push(...this.tasks.splice(0, 1));
                }
            }
        });
        console.log(this.scheduleLength, this.processors);
    }

}

class LPT extends Algrorithm {
    constructor(numProcessors, tasks) {
        super(numProcessors, tasks);
        this.type = 'lpt';
    }

    getSchedule() {
        this.tasks.sort((a, b) => b.length - a.length);
        this.tasks.forEach(task => {
            this.findLeastLoadedProc().tasks.push(task);
        });
        this.scheduleLength = this.findMostLoadedProc().load;
        console.log(this.scheduleLength, this.processors);
    }

    findLeastLoadedProc() {
        return this.processors.reduce((minLoad, cur) => {
            if (cur.load < minLoad.load) minLoad = cur;
            return minLoad;
        }, this.processors[0]);
    }
    findMostLoadedProc() {
        return this.processors.reduce((maxLoad, cur) => {
            if (cur.load > maxLoad.load) maxLoad = cur;
            return maxLoad;
        }, this.processors[0])
    }
}

class Task {
    id = Date.now().toString().slice(-10) + this.#getRandomLength(0, 100000);
    #length;
    #minLength = 1;
    #interrupted = false;
    constructor(length) {
        this.#length = this.#getRandomLength(this.#minLength, length);
    }
    get length() {
        return this.#length;
    }

    #getRandomLength(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }
    trim(remainder) {
        this.#length -= remainder;
        const newTask = new Task();
        newTask.id = this.id;
        newTask.#length = remainder;
        this.#interrupted = newTask.#interrupted = true;
        return newTask;
    }
    get interrupted() {
        return this.#interrupted;
    }
    static clone(...tasks) {
        const clones = []
        tasks.forEach(task => {
            const clone = new Task(task.length);
            clone.id = task.id;
            clone.#interrupted = false;
            clone.#length = task.#length;
            clones.push(clone);
        })

        return clones;
    }
}

class Processor {
    #tasks = [];
    constructor() {

    }
    get load() {
        return this.#tasks.reduce((sum, cur) => sum + cur.length, 0);
    }
    get tasks() {
        return this.#tasks;
    }
}

class App {
    #submitBtn = document.querySelector('.form-btn');
    #algs = { 'mcnaughton': '', 'lpt': '' };
    #tasks = [];
    #lines = [];
    #appContainer;
    #maxTask;
    constructor() {
        window.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const event = new Event('click', { bubbles: true, cancelable: true });
                document.querySelector('.form-btn').dispatchEvent(event);
            }
        });
        if (!this.#appContainer) {
            const appContainer = document.createElement('div');
            appContainer.classList.add('app-container');
            this.#appContainer = appContainer;
            document.body.appendChild(this.#appContainer);
        }
        this.#submitBtn.addEventListener('click', this.#submitForm.bind(this));
        window.onresize = this.#drawLines.bind(this);

    }

    #drawLines() {
        this.#lines.forEach(l => {
            l.remove();
        });
        this.#lines = [];
        const groups = {};
        const grid = document.querySelector('.grid-with-labels');
        if (!grid) return;
        document.querySelectorAll('.grid-item.interrupted').forEach(item => {
            const id = item.dataset.id;
            if (!groups[id]) groups[id] = [];
            groups[id].push(item);
        });

        Object.values(groups).forEach(group => {
            if (group.length > 1) {
                for (let i = 0; i < group.length - 1; i++) {
                    const line = new LeaderLine(group[i + 1], group[i], {
                        color: '#ff6347',
                        size: 2,
                        path: 'arc',
                        dash: {
                            animation: true,
                        },
                        startSocket: 'left',
                        endSocket: 'bottom',
                        endPlug: 'behind',
                        gradient: setLineGradient(group[i + 1], group[i]),
                    });
                    this.#lines.push(line);
                }
            }
        });
        function setLineGradient(...elements) {
            const [startElement, endElement] = elements;
            let startColor = getComputedStyle(startElement).backgroundColor;
            let endColor = getComputedStyle(endElement).backgroundColor;
            if (startColor === endColor) startColor = endColor = 'rgb(255, 255, 255)';
            return {
                startColor: startColor,
                endColor: endColor,
            }
        }
    }
    #submitForm(e) {
        e.preventDefault();
        const procNum = +document.getElementById('processors-num').value;
        const tasksNum = +document.getElementById('tasks-num').value;
        const taskskLength = +document.getElementById('tasks-length').value;

        const inputs = document.querySelectorAll('.form-input');

        if (!this.#isValid(inputs)) return;

        const tasks = [];
        for (let i = 0; i < tasksNum; i++) {
            tasks.push(new Task(taskskLength));
        }
        this.#tasks = tasks;
        this.#maxTask = this.#tasks.reduce((m, cur) => {
            if (cur.length > m) m = cur.length;
            return m;
        }, this.#tasks[0].length)

        Object.keys(this.#algs).forEach(type => {
            let alg;
            if (type === 'mcnaughton') alg = new McNaughton(procNum, [...Task.clone(...this.#tasks)]);
            else if (type === 'lpt') alg = new LPT(procNum, [...Task.clone(...this.#tasks)]);
            alg.getSchedule();
            this.#algs[type] = alg;
            if (!this.#appContainer.querySelector(`.${type}`)) {
                const container = document.createElement('div');
                container.classList.add(`${type}`, 'schedule-container');
                this.#appContainer.appendChild(container);
            }
            this.createScheduleElement(alg, this.#appContainer.querySelector(`.${type}`));
            this.#drawLines();
        });


    }
    #isValid(inputs) {
        let isValid = true;
        inputs.forEach(input => {
            if (!+input.value || +input.value < +input.min || +input.value > +input.max) {
                input.classList.add('invalid');
                isValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });
        return isValid;
    }

    createScheduleElement(alg, container) {
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.classList.add('grid');
        getNewTemplate.bind(this)(grid);
        container.insertAdjacentHTML('afterbegin', `<div class="grid-header"> <h2 class="grid-title">${alg.type.toUpperCase()}</h2></div>`);
        container.appendChild(grid);

        function getNewTemplate(grid) {
            const gridWrapper = grid;
            gridWrapper.className = 'grid-with-labels';
            let s = ``;
            alg.processors.forEach((p, i) => {
                let rowString = '';
                let sum = 0;

                const gridRow = document.createElement('div');
                gridRow.className = 'grid-row';

                // Создаем подпись слева
                const rowLabel = document.createElement('div');
                rowLabel.className = 'row-label';
                rowLabel.innerHTML = `
            <span style="font-weight: 700; color: #3b82f6;">CPU ${i + 1}</span>
            <span style="font-size: 12px; opacity: 0.7;">
                ${p.tasks.length} tasks
            </span>
            <span style="font-size: 12px; opacity: 0.7;">
                Load: ${Math.round(p.load / alg.scheduleLength * 100)}%
            </span>
        `;
                const rowContent = document.createElement('div');
                rowContent.className = 'row-content';

                p.tasks.forEach((task, taskIdx) => {
                    const gridItem = document.createElement('div');
                    gridItem.classList.add('grid-item');
                    gridItem.dataset['id'] = task.id;
                    gridItem.style.backgroundColor = getSmartGradientColor(task.length, this.#maxTask);
                    gridItem.textContent = task.length;
                    task.interrupted ? gridItem.classList.add('interrupted', 'timeline') : '';
                    gridItem.title = `Task ${taskIdx + 1}(${task.id}): ${task.length} load`;

                    rowContent.appendChild(gridItem);

                    const className = `class-${i}${taskIdx}`;
                    const ar = new Array(task.length).fill(className);
                    sum += task.length;
                    rowString += `${ar.join(' ')} `;
                });
                while (sum < alg.scheduleLength) {
                    rowString += 'none ';
                    sum++;
                }
                gridRow.appendChild(rowLabel);
                gridRow.appendChild(rowContent);
                gridWrapper.prepend(gridRow);

                s = `"${rowString.trim()}"\n` + s;
            });
            grid.style.gridTemplateAreas = s;
            const gridFooter = document.createElement('div');
            gridFooter.className = 'grid-footer';

            gridFooter.innerHTML = `
        <div class="footer-label"></div>
        <div class="text-output" id="results-output">
            <div class="output-content">
                <p class="output-info">SCHEDULE LENGTH: ${alg.scheduleLength}</p>
                <p class="output-info">NUMBER OF INTERRUPTIONS: ${alg.interruptionsCount}</p>
            </div>
        </div>
    `;

            gridWrapper.appendChild(gridFooter);
            container.appendChild(gridWrapper);
        }


        function getSmartGradientColor(value, reference = alg.getMaxTask(), maxDistance = null) {
            const distance = Math.abs(value - reference);
            const effectiveMaxDistance = maxDistance || Math.max(Math.abs(reference), 10);
            const normalized = Math.min(distance / effectiveMaxDistance, 1);
            const green = Math.round(255 * normalized);
            const red = Math.round(255 * (1 - normalized));

            return `rgb(${red}, ${green}, 0)`;
        }
    }
}



const app = new App();

