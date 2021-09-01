require('dotenv').config()

const express = require('express')
const app = express()
app.use(express.json())

var morgan = require('morgan')
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

const cors = require('cors')
app.use(cors())

morgan.token('body', function(req) {
	if (req.method !== 'POST') {
		return
	}
	const person = JSON.stringify(req.body)
	return person
})

const Person = require('./models/person.js')

app.get('/api/info', (request, response) => {
	Person.countDocuments({}).then((result) => {
		response.send(`<h3>There are ${result} entries in the phonebook</h3>`)
	})
})

app.get('/api/persons', (request, response) => {
	Person.find({}).then(result => {
		response.json(result)
	})
})

app.get('/api/persons/:id', (request, response, next) => {
	Person.findById(request.params.id)
		.then(person => {
			if (person) {
				response.json(person)
			} else {
				response.status(404).end()
			}
		})
		.catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
	Person.findByIdAndRemove(request.params.id)
		.then(() => {
			response.status(204).end()
		})
		.catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
	const body = request.body

	if (!body.name ) {
		return response.status(400).json({
			error: 'name is missing'
		})
	} else if (!body.phone) {
		return response.status(400).json({
			error: 'number is missing'
		})
	}

	const person = new Person({
		name: body.name,
		phone: body.phone
	})

	person.save().then(savedNote => {
		response.json(savedNote)
	})
		.catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
	const body = request.body

	const person = {
		name: body.name,
		phone: body.phone,
	}

	Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
		.then(updatedPerson => {
			response.json(updatedPerson)
		})
		.catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
	console.error(error.message)

	if (error.name === 'CastError') {
		return response.status(400).send({ error: 'malformatted id' })
	} else if (error.name === 'ValidationError') {
		return response.status(400).json({ error: error.message })
	}

	next(error)
}

app.use(errorHandler)

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})