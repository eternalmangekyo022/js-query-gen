import mysql from 'mysql2'
import fs from 'fs'
import { faker } from '@faker-js/faker'

const records = 4;
const tableName = "sales";
const MAXNUM = 100;

function generate(type) {
	switch(type) {
		case 'color':
			return faker.color.human()
		
		case 'firstName':
			return faker.name.firstName()
		
		case 'lastName':
			return faker.name.lastName()
		
		case 'fullName':
			return faker.name.fullName()
		
		case 'car':
			return faker.vehicle.vehicle()
		
		case 'bike':
			return faker.vehicle.bicycle()

		case 'date':
			return faker.date.anytime()
		
		default:
			console.log('Error, no type specified')
			process.exit(1)
	}
}

const conn = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'bw'
});

let alphabet = 'abcdefghijklmnopqrstuvwxyz'
alphabet += alphabet.toUpperCase();

const parseDate = date => {
	const temp = date.split('T')
	return temp[0] + ' ' + temp[1].split('.')[0]
}

const wrap = str => '\'' + str + '\'';

const parser = toParse => {
	if(toParse.includes('varchar')) return () => wrap(faker.string.fromCharacters(alphabet, { min: 10, max: parseInt(toParse.match(/(\d+)/)[0]) }))
	else if(toParse == 'tinyint(1)') return () => faker.datatype.boolean()
	else if(toParse == 'int') return () => faker.number.int({ min: 0, max: MAXNUM })
	else if(toParse == 'datetime') return () => wrap(parseDate(faker.date.anytime().toISOString()))
	else if(toParse == 'date') return () => wrap(faker.date.anytime().toISOString().split('T')[0])

	process.exit();
}

const data = fs.readFileSync('schema.csv', { encoding: 'utf-8' }).split('\n').map(i => i.trim().split(',').map(i => i.trim()));
const cols = data[0].filter((_, idx) => idx > 0);
const types = data[1].filter((_, idx) => idx > 0).map(i => parser(i));

function inject() {
	for(let i = 0; i < records; i++) {
		const values = [];
		for(let j = 0; j < types.length; j++) values.push(types[j]());
		
		conn.query(`insert into ${tableName}(${cols.toString()}) values(${values.toString()})`, (err, q) => {
			err && (() => { console.log(err); process.exit() })(); // kis freestyle
		})
	}
}

conn.query(`show tables like '${tableName}'`, (err, q) => {
	err && console.log(err)
	if(err || q.length == 0) process.exit()
	inject()
})
