import Tfw from 'tfw'
import React from "react"
import ReactDOM from 'react-dom'
import App from './app'
import * as serviceWorker from './serviceWorker'

import "./index.css"


const FADING_DURATION = 1000

Tfw.Theme.register("chronos", {
    bg0: "#cec",
    bg3: "#fff",
    bgP: "#2ca600",
    bgS: "#f86"
})
Tfw.Theme.apply("chronos")

ReactDOM.render(<App />, document.getElementById("root"))

const logo = document.getElementById("tp-logo")
if (logo) {
    logo.classList.add("vanish")
    window.setTimeout(
        () => { logo.parentNode ?.removeChild(logo) },
        FADING_DURATION
    )
}


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA

serviceWorker.unregister()
