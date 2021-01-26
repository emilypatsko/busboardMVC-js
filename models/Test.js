class Test{
	constructor(name, id) {
		this.name = name;
		this.id = id;
	}

	showTestData() {
		return this.name + ", id: " + this.id; 
	};

	editName(newName) {
		this.name = newName
	}
};

class Bus {
	constructor(line, aimed_departure_time, expected_departure_time, direction) {
		this.line = line;
		this.aimed_departure_time = aimed_departure_time;
		this.expected_departure_time = expected_departure_time;
		this.direction = direction;
	};

	printBusData() {
		let arr = [`Route: ${this.line}`, `Scheduled: ${this.aimed_departure_time}`, `Expected: ${this.expected_departure_time}  `, `Direction: ${this.direction}`];
		return arr.join('\t');
	};
}

module.exports = Bus;
