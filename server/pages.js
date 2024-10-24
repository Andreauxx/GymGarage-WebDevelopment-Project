import express from "express"
import path from "path"
const __dirname = path.resolve();

const pagesRouter = express.Router();

pagesRouter.use(express.json())

pagesRouter.use(express.static(path.join(__dirname, '../styles')))

// RENDERING HTML PAGES
pagesRouter.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../Landing Page/Home.html'))
})

pagesRouter.get("/coaches", (req, res) => {
    res.sendFile(path.join(__dirname, '../Coaches Page/Coaches.html'))
})

pagesRouter.get("/shop", (req, res) => {
    res.sendFile(path.join(__dirname, '../Shop/shop.html'))
})

pagesRouter.get("/plans", (req, res) => {
    res.sendFile(path.join(__dirname, '../Plans/PlansPage.html'))
})

pagesRouter.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, '../About Us/about.html'))
})

pagesRouter.get("/checkout", (req, res) => {
    res.sendFile(path.join(__dirname, '../Checkout/checkout.html'))
})

pagesRouter.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, '../Contact Us/contact.html'))
})

pagesRouter.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, '../Login/login.html'))
})

pagesRouter.get("/cancel", (req, res) => {
    res.sendFile(path.join(__dirname, '../Legal/cancellation.html'))
})

pagesRouter.get("/faq", (req, res) => {
    res.sendFile(path.join(__dirname, '../Legal/FAQ.html'))
})

pagesRouter.get("/refund", (req, res) => {
    res.sendFile(path.join(__dirname, '../Legal/refund.html'))
})

pagesRouter.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, '../Legal/terms.html'))
})

//FOR PRODUCTS
pagesRouter.get("/products", (req, res) => {
    res.sendFile(path.join(__dirname, '../ProductPage/product.html'))
})

export default pagesRouter