import express from "express"
import { getNotes, getNote, createNote } from "./database.js"

import path from "path"
const __dirname = path.resolve();

const port = 4000

const app = express()

app.use(express.json())

app.use(express.static(path.join(__dirname, '../styles')))


// RENDERING HTML PAGES
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../Landing Page/Home.html'))
})

app.get("/coaches", (req, res) => {
    res.sendFile(path.join(__dirname, '../Coaches Page/Coaches.html'))
})

app.get("/shop", (req, res) => {
    res.sendFile(path.join(__dirname, '../Shop/shop.html'))
})

app.get("/plans", (req, res) => {
    res.sendFile(path.join(__dirname, '../Plans/PlansPage.html'))
})

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, '../About Us/about.html'))
})

app.get("/checkout", (req, res) => {
    res.sendFile(path.join(__dirname, '../Checkout/checkout.html'))
})

// TEST CASES
app.get("/notes", async (req, res) => {
    const notes = await getNotes()
    res.send(notes)
})

app.get("/notes/:id", async (req, res) => {
    const id = req.params.id
    const note = await getNote(id)
    res.send(note)
})

app.post('/notes', async (req, res) => {
    const { title, content } = req.body
    const note = await createNote(title, content)
    res.status(201).send(note)
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  }) // FOR ERROR HANDLING

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})